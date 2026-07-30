const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const knex = require('../db');
const { authMiddleware, adminAuthMiddleware, superAdminAuthMiddleware, mainSuperAdminAuthMiddleware, adminOrSuperAdminAuthMiddleware } = require('../middleware/auth');

// Helper to get user ID from username
const getUserId = async (username) => {
    const user = await knex('users').where({ username }).first('id');
    return user ? user.id : null;
};

// In your POST /clients route
router.post('/clients', [authMiddleware, adminOrSuperAdminAuthMiddleware], async (req, res) => {
    console.log('POST /clients route called');
    try {
        const { name, url, description, graylog, logApi, adminId } = req.body;
        console.log('Request body:', req.body);

        const existingClient = await knex('clients').where({ name }).first();
        if (existingClient) {
            return res.status(409).json({ error: "Client with this name already exists" });
        }

        let assignedAdminId;

            // Superadmins can assign a client to a specific adminId.
            // If they don't, it's assigned to themselves.
            if ((req.user.role === 'superadmin' || req.user.role === 'main-superadmin') && adminId) {
                const adminExists = await knex('users').where({ id: adminId }).first('id');
                if (!adminExists) {
                    console.log('Assigned admin not found');
                    return res.status(404).json({ success: false, message: `Assigned admin with ID ${adminId} not found.` });
                }
                assignedAdminId = adminId;
            } else {
                // Regular admins or superadmins creating for themselves. 
                assignedAdminId = req.user.id;
            }
            console.log('Assigned admin ID:', assignedAdminId);

            // Insert the client record and client-admin relationship atomically using a transaction
            try {
                const result = await knex.transaction(async (trx) => {
                    // Insert the client record
                    const [newClientId] = await trx('clients').insert({
                        name,
                        url,
                        description: description || '',
                        graylog_host: graylog ? graylog.host : null,
                        graylog_username: graylog ? graylog.username : null,
                        graylog_password: graylog ? graylog.password : null,
                        graylog_stream_id: graylog ? graylog.streamId : null,
                        log_api_host: logApi ? logApi.host : null,
                        log_api_username: logApi ? logApi.username : null,
                        log_api_password: logApi ? logApi.password : null,
                        sso_username: logApi ? (logApi.ssoUsername || null) : null,
                        sso_client_id: logApi ? (logApi.ssoClientId || null) : null,
                    });
                    console.log('New client ID:', newClientId);

                    // Insert the client-admin relationship
                    await trx('client_admins').insert({
                        client_id: newClientId,
                        user_id: assignedAdminId
                    });
                    console.log('Client admin relationship created');

                    // Fetch and return the newly created client
                    const newClient = await trx('clients').where({ id: newClientId }).first();
                    return newClient;
                });

                res.status(201).json({ success: true, client: result });

            } catch (transactionError) {
                console.error('Database error inserting client:', transactionError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add client due to database error'
                });
            }
    } catch (error) {
        console.error('Error adding client:', error);

        // Handle specific error types
        if (error.message && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({ success: false, message: 'Failed to add client' });
    }
});

router.put('/clients/:id', [authMiddleware, adminAuthMiddleware], async (req, res) => {
    try {
        const { name, url, description, graylog, logApi } = req.body;
        const clientId = parseInt(req.params.id);

        if (!name || !url) {
            return res.status(400).json({ success: false, message: 'Name and URL are required' });
        }

        const user = await knex('users').where({ username: req.user.username }).first('id');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hasAccess = await knex('client_admins')
            .where({ client_id: clientId, user_id: user.id })
            .first();

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
        }

        const existingClient = await knex('clients').where({ name }).whereNot({ id: clientId }).first();
        if (existingClient) {
            return res.status(409).json({ error: "Client with this name already exists" });
        }

        const updated = await knex('clients').where({ id: clientId }).update({
            name,
            url,
            description: description || '',
            graylog_host: graylog ? graylog.host : null,
            graylog_username: graylog ? graylog.username : null,
            graylog_password: graylog ? graylog.password : null,
            graylog_stream_id: graylog ? graylog.streamId : null,
            log_api_host: logApi ? logApi.host : null,
            log_api_username: logApi ? logApi.username : null,
            log_api_password: logApi ? logApi.password : null,
            sso_username: logApi ? (logApi.ssoUsername || null) : null,
            sso_client_id: logApi ? (logApi.ssoClientId || null) : null,
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const updatedClient = await knex('clients').where({ id: clientId }).first();
        res.json({ success: true, client: updatedClient });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ success: false, message: 'Failed to update client' });
    }
});

router.delete('/clients/:id', [authMiddleware, adminAuthMiddleware], async (req, res) => {
    try {
        const clientId = parseInt(req.params.id);

        const user = await knex('users').where({ username: req.user.username }).first('id');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hasAccess = await knex('client_admins')
            .where({ client_id: clientId, user_id: user.id })
            .first();

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
        }

        const deleted = await knex('clients').where({ id: clientId }).del();

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ success: false, message: 'Failed to delete client' });
    }
});

router.post('/admins', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const { username, password, name, email, organization, city, state } = req.body;
        if (!username || !password || !name || !email || !organization || !city || !state) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingUser = await knex('users').where({ username }).orWhere({ email }).first();
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newAdminId] = await knex('users').insert({
            username,
            password: hashedPassword,
            name,
            email,
            organization,
            city,
            state,
            role: 'admin',
            blocked: false,
        });

        const newAdmin = await knex('users').where({ id: newAdminId }).first();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully. They will need to setup MFA on first login.',
            admin: newAdmin
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ success: false, message: 'Failed to create admin' });
    }
});

router.get('/admins', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const admins = await knex('users').where({ role: 'admin' });

        // For each admin, fetch their associated clients
        const adminsWithClients = await Promise.all(admins.map(async (admin) => {
            const clients = await knex('clients')
                .join('client_admins', 'clients.id', '=', 'client_admins.client_id')
                .where('client_admins.user_id', admin.id)
                .select('clients.*');
            return { ...admin, clients };
        }));

        res.json(adminsWithClients);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admins' });
    }
});


router.get('/admins/:adminId/clients', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const { adminId } = req.params;
        const clients = await knex('clients')
            .join('client_admins', 'clients.id', '=', 'client_admins.client_id')
            .join('users', 'users.id', '=', 'client_admins.user_id')
            .where('users.username', adminId)
            .select('clients.*');

        res.json(clients);
    } catch (error) {
        console.error('Error fetching admin clients:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin clients' });
    }
});

router.patch('/admins/:id/block', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        const { blocked } = req.body;

        if (typeof blocked !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Blocked status must be a boolean' });
        }

        const updated = await knex('users').where({ id: adminId }).update({ blocked });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const admin = await knex('users').where({ id: adminId }).first();

        res.json({
            success: true,
            message: `Admin ${blocked ? 'blocked' : 'unblocked'} successfully`,
            admin: admin
        });
    } catch (error) {
        console.error('Error updating admin block status:', error);
        res.status(500).json({ success: false, message: 'Failed to update admin status' });
    }
});

router.get('/admins/:id', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        const admin = await knex('users').where({ id: adminId, role: 'admin' }).first();

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin' });
    }
});

router.post('/superadmins', [authMiddleware, mainSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const { username, password, name, email, organization, city, state } = req.body;
        
        if (!username || !password || !name || !email || !organization || !city || !state) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingUser = await knex('users').where({ username }).orWhere({ email }).first();
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newSuperAdminId] = await knex('users').insert({
            username,
            password: hashedPassword,
            name,
            email,
            organization,
            city,
            state,
            role: 'superadmin',
            blocked: false,
        });

        const newSuperAdmin = await knex('users').where({ id: newSuperAdminId }).first();

        res.status(201).json({
            success: true,
            message: 'Superadmin created successfully',
            superadmin: newSuperAdmin
        });
    } catch (error) {
        console.error('Error creating superadmin:', error);
        res.status(500).json({ success: false, message: 'Failed to create superadmin' });
    }
});

router.put('/admins/:id', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        if (isNaN(adminId)) throw new Error('Invalid admin ID');

        const { name, email, organization, city, state } = req.body;
        if (!name || !email || !organization || !city || !state) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const updated = await knex('users').where({ id: adminId }).update({
            name,
            email,
            organization,
            city,
            state
        });
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const admin = await knex('users').where({ id: adminId }).first();

        res.json({
            success: true,
            message: 'Admin updated successfully',
            admin: admin
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.get('/superadmins', [authMiddleware, mainSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const superadmins = await knex('users').where({ role: 'superadmin' });
        res.json(superadmins);
    } catch (error) {
        console.error('Error fetching superadmins:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch superadmins' });
    }
});

router.patch('/superadmins/:username/block', [authMiddleware, mainSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const { username } = req.params;
        const { blocked } = req.body;

        if (typeof blocked !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Invalid blocked status' });
        }

        const updated = await knex('users').where({ username }).update({ blocked });
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Superadmin not found' });
        }

        res.json({
            success: true,
            message: `Superadmin ${blocked ? 'blocked' : 'unblocked'} successfully`
        });

    } catch (error) {
        console.error('Error updating superadmin:', error);
        res.status(500).json({ success: false, message: 'Failed to update superadmin' });
    }
});

module.exports = router;