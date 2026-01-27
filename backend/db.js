const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './mssp.db',
  },
  useNullAsDefault: true,
  debug: false, // Disable debug in production to improve performance
  pool: {
    min: 2,
    max: 20, // Increase pool size for better concurrent handling
    acquireTimeoutMillis: 60000, // Increase timeout
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    createRetryIntervalMillis: 200,
    afterCreate: (conn, cb) => {
      // Optimize SQLite for better performance
      conn.run('PRAGMA journal_mode = WAL;', (err) => {
        if (err) {
          return cb(err);
        }
        conn.run('PRAGMA synchronous = NORMAL;', (err) => {
          if (err) {
            return cb(err);
          }
          conn.run('PRAGMA cache_size = 10000;', (err) => {
            if (err) {
              return cb(err);
            }
            conn.run('PRAGMA temp_store = MEMORY;', (err) => {
              if (err) {
                return cb(err);
              }
              cb(null, conn);
            });
          });
        });
      });
    }
  },
  migrations: {
    stub: 'migrations.stub'
  }
});

// Only enable query logging in development
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
  db.on('query', (queryData) => {
    console.log(queryData);
  });
}

db.on('query-error', (error, obj) => {
  console.error('Knex query error:', error, 'Object:', obj);
});

module.exports = db;
