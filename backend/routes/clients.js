const express = require('express');
const router = express.Router();
const http = require('http');
const fetch = require('node-fetch');
const { authMiddleware } = require('../middleware/auth');
const knex = require('../db');

router.get('/', authMiddleware, async (req, res) => {
  try {
    let clients = [];

    if (req.user.role === 'superadmin' || req.user.role === 'main-superadmin') {
      // Superadmins get all clients
      clients = await knex('clients').select('*');
    } else {
      // Regular admins get only their assigned clients
      const user = await knex('users').where({ username: req.user.username }).first('id');
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Use a more efficient join with proper indexing
      clients = await knex('clients')
        .join('client_admins', 'clients.id', '=', 'client_admins.client_id')
        .where('client_admins.user_id', user.id)
        .select('clients.*');
    }

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await knex('clients').where({ id: parseInt(req.params.id) }).first();
    
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (req.user.role === 'admin') {
        const user = await knex('users').where({ username: req.user.username }).first();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (client.admin_id !== user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this client' });
        }
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch client' });
  }
});

router.get('/:id/logs', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id);

  try {
    // First, get client info with minimal fields needed
    const client = await knex('clients')
      .where({ id: clientId })
      .select('id', 'name', 'graylog_host', 'graylog_username', 'graylog_password', 'graylog_stream_id')
      .first();

    if (!client || !client.graylog_host) {
      return res.status(404).json({ success: false, message: 'Client or Graylog config not found' });
    }

    const fromDate = new Date();
    fromDate.setSeconds(fromDate.getSeconds() - 10); // 10 seconds ago
    const toDate = new Date(); // now

    const fromFormatted = fromDate.toISOString();
    const toFormatted = toDate.toISOString();

    let graylogHost = client.graylog_host;
    if (!graylogHost.startsWith('http')) {
      graylogHost = `http://${graylogHost}`;
    }

    const apiUrl = `${graylogHost}/api/search/universal/absolute?query=*&from=${fromFormatted}&to=${toFormatted}&limit=0&filter=streams:${client.graylog_stream_id}`;

    const auth = Buffer.from(`${client.graylog_username}:${client.graylog_password}`).toString('base64');

    // Use axios instead of http module for better promise support and timeout handling
    const axios = require('axios');

    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      timeout: 5000, // 5 second timeout to prevent hanging requests
    });

    const responseData = {
      success: true,
      clientId: client.id,
      clientName: client.name,
      logCount: response.data.total_results || 0,
      timeRange: {
        from: fromFormatted,
        to: toFormatted
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching Graylog data:', error.message);

    // Return a default response instead of failing completely
    res.status(200).json({
      success: true,
      clientId: clientId,
      logCount: 0,
      timeRange: {
        from: new Date(Date.now() - 10000).toISOString(),
        to: new Date().toISOString()
      }
    });
  }
});

router.get('/:id/logstats', authMiddleware, async (req, res) => {
  const clientId = parseInt(req.params.id);

  try {
    // Get only necessary fields
    const client = await knex('clients')
      .where({ id: clientId })
      .select('id', 'name', 'log_api_host', 'log_api_username', 'log_api_password')
      .first();

    if (!client || !client.log_api_host) {
      return res.status(404).json({ success: false, message: 'Client or Log API config not found' });
    }

    let logApiHost = client.log_api_host;
    if (!logApiHost.startsWith('http')) {
      logApiHost = `http://${logApiHost}`;
    }

    const axios = require('axios');

    // Login to get token
    const tokenResponse = await axios.post(`${logApiHost}/api/auth/login`, {
      username: client.log_api_username,
      password: client.log_api_password
    }, {
      timeout: 5000, // 5 second timeout
      headers: { 'Content-Type': 'application/json' }
    });

    if (!tokenResponse.data.token) {
      throw new Error('Failed to get authentication token');
    }

    // Get stats with the token
    const statsResponse = await axios.get(`${logApiHost}/api/logs/stats/overview?timeRange=24h`, {
      headers: {
        'Authorization': `Bearer ${tokenResponse.data.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    const responseData = {
      success: true,
      stats: statsResponse.data
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching log stats:', error.message);

    // Return default stats instead of failing completely
    res.status(200).json({
      success: true,
      stats: { total: 0, major: 0, normal: 0 }
    });
  }
});



module.exports = router;