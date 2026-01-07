const knex = require('../db');
const bcrypt = require('bcrypt');
const prompts = require('prompts');
const path = require('path');
// Ensure dotenv is loaded to read from the .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // 1. Create 'users' table if it doesn't exist
    const usersTableExists = await knex.schema.hasTable('users');
    if (!usersTableExists) {
      console.log("Table 'users' not found. Creating it now...");
      await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username').unique().notNullable();
        table.string('password').notNullable();
        table.string('role').notNullable();
        table.string('name');
        table.string('email').unique();
        table.string('organization');
        table.string('city');
        table.string('state');
        table.boolean('blocked').defaultTo(false);
        table.string('mfa_secret');
        table.timestamps(true, true);
      });
      console.log('✅ Table "users" created successfully.');
    } else {
      console.log("✅ Table 'users' already exists.");
    }

    // 2. Create 'clients' table if it doesn't exist
    const clientsTableExists = await knex.schema.hasTable('clients');
    if (!clientsTableExists) {
      console.log("Table 'clients' not found. Creating it now...");
      await knex.schema.createTable('clients', (table) => {
        table.increments('id').primary();
        table.string('name').unique().notNullable();
        table.string('url').notNullable();
        table.text('description');
        table.timestamps(true, true);
      });
      console.log('✅ Table "clients" created successfully.');
    } else {
      console.log("✅ Table 'clients' already exists.");
    }
    
    // 3. Add missing columns to 'clients' table
    const clientColumns = {
        graylog_host: { type: 'string' },
        graylog_username: { type: 'string' },
        graylog_password: { type: 'string' },
        graylog_stream_id: { type: 'string' },
        log_api_host: { type: 'string' },
        log_api_username: { type: 'string' },
        log_api_password: { type: 'string' }
    };

    for (const [column, properties] of Object.entries(clientColumns)) {
        const hasColumn = await knex.schema.hasColumn('clients', column);
        if (!hasColumn) {
            console.log(`Column '${column}' not found in 'clients' table. Adding it now...`);
            await knex.schema.alterTable('clients', (table) => {
                table[properties.type](column);
            });
            console.log(`✅ Column '${column}' added successfully.`);
        }
    }


    // 4. Create 'client_admins' table if it doesn't exist
    const clientAdminsTableExists = await knex.schema.hasTable('client_admins');
    if (!clientAdminsTableExists) {
      console.log("Table 'client_admins' not found. Creating it now...");
      await knex.schema.createTable('client_admins', (table) => {
        table.increments('id').primary();
        table.integer('client_id').unsigned().notNullable().references('id').inTable('clients').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.timestamps(true, true);
        table.unique(['client_id', 'user_id']);
      });
      console.log("✅ Table 'client_admins' created successfully.");
    } else {
      console.log("✅ Table 'client_admins' already exists.");
    }

    // 5. Clean up legacy columns
    const hasAdminIdColumn = await knex.schema.hasColumn('clients', 'admin_id');
    if (hasAdminIdColumn) {
      console.log("Legacy column 'admin_id' found in 'clients' table. Removing it now...");
      await knex.schema.alterTable('clients', (table) => {
        table.dropColumn('admin_id');
      });
      console.log("✅ Legacy column 'admin_id' removed successfully.");
    }
    
    // 6. Seed the main superadmin if one doesn't exist
    const superAdmin = await knex('users').where('role', 'main-superadmin').first();
    if (!superAdmin) {
        console.log('No main-superadmin found. Prompting for credentials...');
        const usernameResponse = await prompts({
            type: 'text',
            name: 'username',
            message: 'Enter the username for the main superadmin:',
            initial: 'username'
        });

        if (!usernameResponse.username) {
            throw new Error('Username is required.');
        }

        let passwordResponse;
        let passwordsMatch = false;

        while (!passwordsMatch) {
            passwordResponse = await prompts([
                {
                    type: 'password',
                    name: 'password',
                    message: 'Enter the password for the main superadmin:'
                },
                {
                    type: 'password',
                    name: 'confirm_password',
                    message: 'Confirm the password:'
                }
            ]);

            if (passwordResponse.password && passwordResponse.password === passwordResponse.confirm_password) {
                passwordsMatch = true;
            } else {
                console.log('❌ Passwords do not match. Please try again.');
            }
        }

        const superAdminUsername = usernameResponse.username;
        const superAdminPassword = passwordResponse.password;

        if (!superAdminPassword) {
            throw new Error('Password is required.');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);
        
        await knex('users').insert({
            username: superAdminUsername,
            password: hashedPassword,
            role: 'main-superadmin',
            name: 'Main Super Admin',
            email: `${superAdminUsername}@example.com`
        });
        console.log(`-> Main superadmin '${superAdminUsername}' created.`);
    } else {
        console.log('✅ Main superadmin already exists.');
    }

    console.log('\n🎉 Database setup is complete and up-to-date!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await knex.destroy();
  }
}

setupDatabase();
