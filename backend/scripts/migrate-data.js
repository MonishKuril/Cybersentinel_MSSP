const knex = require('../db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const admins = require('../config/admins');
const clients = require('../config/clients');
const superadmins = require('../config/superadmin');


async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Migrate users
    console.log('Migrating users...');
    for (const admin of admins) {
      const password = process.env[`ADMIN_PASSWORD_${admin.name}`];
      if (!password) {
        console.warn(`Password for admin ${admin.name} not found in .env. Skipping.`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await knex('users').insert({
        username: admin.name,
        password: hashedPassword,
        name: admin.name,
        email: admin.email,
        organization: admin.organization,
        city: admin.city,
        state: admin.state,
        role: 'admin',
        mfa_secret: process.env[`MFA_SECRET_${admin.name}`] || null,
        blocked: admin.blocked || false,
      });
    }

    for (const superadmin of superadmins) {
        const password = process.env[`SUPERADMIN_PASSWORD_${superadmin.id}`];
        if (!password) {
          console.warn(`Password for superadmin ${superadmin.username} not found in .env. Skipping.`);
          continue;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await knex('users').insert({
          username: superadmin.username,
          password: hashedPassword,
          name: superadmin.name,
          email: superadmin.email,
          organization: superadmin.organization,
          city: superadmin.city,
          state: superadmin.state,
          role: 'superadmin',
          mfa_secret: process.env[`MFA_SECRET_${superadmin.username}`] || null,
          blocked: superadmin.blocked || false,
        });
      }

      //main super admin
      const mainSuperAdminPassword = process.env.MAIN_SUPERADMIN_PASSWORD;
      const mainSuperAdminUsername = process.env.MAIN_SUPERADMIN_USERNAME;
      if(mainSuperAdminPassword && mainSuperAdminUsername){
        const hashedPassword = await bcrypt.hash(mainSuperAdminPassword, 10);
        await knex('users').insert({
            username: mainSuperAdminUsername,
            password: hashedPassword,
            name: "Main Super Admin",
            email: "main.super@admin.com",
            role: 'main-superadmin'
        })
      }


    console.log('Users migrated successfully.');

    // Migrate clients
    console.log('Migrating clients...');
    for (const client of clients) {
      const [newClientId] = await knex('clients').insert({
        name: client.name,
        url: client.url,
        description: client.description,
        graylog_host: client.graylog ? client.graylog.host : null,
        graylog_username: client.graylog ? client.graylog.username : null,
        graylog_password: client.graylog ? client.graylog.password : null,
        graylog_stream_id: client.graylog ? client.graylog.streamId : null,
        log_api_host: client.logApi ? client.logApi.host : null,
        log_api_username: client.logApi ? client.logApi.username : null,
        log_api_password: client.logApi ? client.logApi.password : null,
      });

      const user = await knex('users').where({ username: client.adminId }).first();
      if(user){
        await knex('client_admins').insert({
            client_id: newClientId,
            user_id: user.id
        })
      }
    }
    console.log('Clients migrated successfully.');

    console.log('Data migration completed.');
  } catch (error) {
    console.error('Error migrating data:', error);
  } finally {
    await knex.destroy();
  }
}

migrateData();
