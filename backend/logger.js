const winston = require('winston');

// Shared logger for the whole backend. File transports use buffered,
// asynchronous writes, so using this instead of console.log/console.error
// in request handlers avoids blocking the event loop (which console.*
// does when stdout/stderr is redirected to a regular file, as in
// deploy.sh's `nohup npm start > mssp_server.log`).
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
