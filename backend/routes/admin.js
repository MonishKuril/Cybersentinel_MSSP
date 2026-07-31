const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const knex = require('../db');
const { authMiddleware, adminAuthMiddleware, superAdminAuthMiddleware, mainSuperAdminAuthMiddleware, adminOrSuperAdminAuthMiddleware } = require('../middleware/auth');
const logger = require('../logger');

// Helper to get user ID from username
const getUserId = async (username) => {
    const user = await knex('users').where({ username }).first('id');
    return user ? user.id : null;
};

// Deletes a user along with any clients assigned exclusively to them.
// If a client is still linked to another user via client_admins after this
// user's link is removed, the client is left in place (covers the case
// where a client is shared across multiple admins/superadmins).
const deleteUserAndOwnedClients = async (trx, userId) => {
    const ownedClientIds = (await trx('client_admins').where({ user_id: userId }).select('client_id'))
        .map((row) => row.client_id);

    await trx('client_admins').where({ user_id: userId }).del();

    if (ownedClientIds.length) {
        const stillLinked = await trx('client_admins')
            .whereIn('client_id', ownedClientIds)
            .distinct('client_id');
        const stillLinkedIds = new Set(stillLinked.map((row) => row.client_id));
        const orphanedClientIds = ownedClientIds.filter((id) => !stillLinkedIds.has(id));

        if (orphanedClientIds.length) {
            await trx('clients').whereIn('id', orphanedClientIds).del();
        }
    }

    await trx('users').where({ id: userId }).del();
};

// In your POST /clients route
router.post('/clients', [authMiddleware, adminOrSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const { name, url, description, graylog, logApi, adminId } = req.body;

        const existingClient = await knex('clients').where({ name }).first();
        if (existingClient) {
            return res.status(409).json({ success: false, message: "Client with this name already exists" });
        }

        if (logApi && logApi.ssoClientId) {
            const existingSsoClientId = await knex('clients').where({ sso_client_id: logApi.ssoClientId }).first();
            if (existingSsoClientId) {
                return res.status(409).json({ success: false, message: `SIEM SSO Client ID "${logApi.ssoClientId}" is already assigned to another client` });
            }
        }

        let assignedAdminId;

            // Superadmins can assign a client to a specific adminId.
            // If they don't, it's assigned to themselves.
            if ((req.user.role === 'superadmin' || req.user.role === 'main-superadmin') && adminId) {
                const adminExists = await knex('users').where({ id: adminId }).first('id');
                if (!adminExists) {
                    return res.status(404).json({ success: false, message: `Assigned admin with ID ${adminId} not found.` });
                }
                assignedAdminId = adminId;
            } else {
                // Regular admins or superadmins creating for themselves.
                assignedAdminId = req.user.id;
            }

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

                    // Insert the client-admin relationship
                    await trx('client_admins').insert({
                        client_id: newClientId,
                        user_id: assignedAdminId
                    });

                    // Fetch and return the newly created client
                    const newClient = await trx('clients').where({ id: newClientId }).first();
                    return newClient;
                });

                res.status(201).json({ success: true, client: result });

            } catch (transactionError) {
                logger.error('Database error inserting client', { message: transactionError.message, stack: transactionError.stack });
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add client due to database error'
                });
            }
    } catch (error) {
        logger.error('Error adding client', { message: error.message, stack: error.stack });

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
            return res.status(409).json({ success: false, message: "Client with this name already exists" });
        }

        if (logApi && logApi.ssoClientId) {
            const existingSsoClientId = await knex('clients')
                .where({ sso_client_id: logApi.ssoClientId })
                .whereNot({ id: clientId })
                .first();
            if (existingSsoClientId) {
                return res.status(409).json({ success: false, message: `SIEM SSO Client ID "${logApi.ssoClientId}" is already assigned to another client` });
            }
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
        logger.error('Error updating client', { message: error.message, stack: error.stack });
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
        logger.error('Error deleting client', { message: error.message, stack: error.stack });
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
        logger.error('Error creating admin', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to create admin' });
    }
});

router.get('/admins', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const admins = await knex('users').where({ role: 'admin' });
        const adminIds = admins.map((admin) => admin.id);

        // Fetch every assigned client for all admins in a single query instead
        // of one query per admin, and group the results in memory.
        const clientRows = adminIds.length
            ? await knex('clients')
                .join('client_admins', 'clients.id', '=', 'client_admins.client_id')
                .whereIn('client_admins.user_id', adminIds)
                .select('clients.*', 'client_admins.user_id as __adminId')
            : [];

        const clientsByAdminId = clientRows.reduce((acc, row) => {
            const { __adminId, ...client } = row;
            if (!acc[__adminId]) acc[__adminId] = [];
            acc[__adminId].push(client);
            return acc;
        }, {});

        const adminsWithClients = admins.map((admin) => ({
            ...admin,
            clients: clientsByAdminId[admin.id] || []
        }));

        res.json(adminsWithClients);
    } catch (error) {
        logger.error('Error fetching admins', { message: error.message, stack: error.stack });
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
        logger.error('Error fetching admin clients', { message: error.message, stack: error.stack });
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
        logger.error('Error updating admin block status', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to update admin status' });
    }
});

router.delete('/admins/:id', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        if (isNaN(adminId)) {
            return res.status(400).json({ success: false, message: 'Invalid admin ID' });
        }

        const admin = await knex('users').where({ id: adminId, role: 'admin' }).first();
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        await knex.transaction((trx) => deleteUserAndOwnedClients(trx, adminId));

        res.json({ success: true, message: 'Admin and their clients deleted successfully' });
    } catch (error) {
        logger.error('Error deleting admin', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to delete admin' });
    }
});

router.patch('/admins/:id/reset-mfa', [authMiddleware, superAdminAuthMiddleware], async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        if (isNaN(adminId)) {
            return res.status(400).json({ success: false, message: 'Invalid admin ID' });
        }

        const updated = await knex('users').where({ id: adminId, role: 'admin' }).update({ mfa_secret: null });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({
            success: true,
            message: 'MFA reset. The admin will be asked to set up MFA again on their next login.'
        });
    } catch (error) {
        logger.error('Error resetting admin MFA', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to reset MFA' });
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
        logger.error('Error fetching admin', { message: error.message, stack: error.stack });
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
        logger.error('Error creating superadmin', { message: error.message, stack: error.stack });
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
        logger.error('Error updating admin', { message: error.message, stack: error.stack });
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
        logger.error('Error fetching superadmins', { message: error.message, stack: error.stack });
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
        logger.error('Error updating superadmin', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to update superadmin' });
    }
});

router.delete('/superadmins/:username', [authMiddleware, mainSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const { username } = req.params;
        const superadmin = await knex('users').where({ username, role: 'superadmin' }).first();
        if (!superadmin) {
            return res.status(404).json({ success: false, message: 'Superadmin not found' });
        }

        await knex.transaction((trx) => deleteUserAndOwnedClients(trx, superadmin.id));

        res.json({ success: true, message: 'Superadmin and their clients deleted successfully' });
    } catch (error) {
        logger.error('Error deleting superadmin', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to delete superadmin' });
    }
});

router.patch('/superadmins/:username/reset-mfa', [authMiddleware, mainSuperAdminAuthMiddleware], async (req, res) => {
    try {
        const { username } = req.params;
        const updated = await knex('users').where({ username, role: 'superadmin' }).update({ mfa_secret: null });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Superadmin not found' });
        }

        res.json({
            success: true,
            message: 'MFA reset. The superadmin will be asked to set up MFA again on their next login.'
        });
    } catch (error) {
        logger.error('Error resetting superadmin MFA', { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Failed to reset MFA' });
    }
});

module.exports = router;