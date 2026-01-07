const knex = require('../db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearClients() {
  console.log('⚠️ WARNING: This script will permanently delete ALL clients and their associations with admins.');
  
  rl.question('Are you sure you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      try {
        console.log('Starting deletion...');

        // Check for 'client_admins' table before deleting
        const hasClientAdminsTable = await knex.schema.hasTable('client_admins');
        if (hasClientAdminsTable) {
          const clientAdminsDeleted = await knex('client_admins').del();
          console.log(`✅ Deleted ${clientAdminsDeleted} records from 'client_admins'.`);
        } else {
          console.log("🟡 Table 'client_admins' does not exist, skipping.");
        }
        
        // Check for 'clients' table before deleting
        const hasClientsTable = await knex.schema.hasTable('clients');
        if (hasClientsTable) {
          const clientsDeleted = await knex('clients').del();
          console.log(`✅ Deleted ${clientsDeleted} records from 'clients'.`);
        } else {
          console.log("🟡 Table 'clients' does not exist, skipping.");
        }

        console.log('✅ Deletion script finished.');

      } catch (error) {
        console.error('❌ Error during deletion:', error);
      } finally {
        await knex.destroy();
        rl.close();
      }
    } else {
      console.log('Operation cancelled. No data was deleted.');
      rl.close();
      await knex.destroy();
    }
  });
}

clearClients();