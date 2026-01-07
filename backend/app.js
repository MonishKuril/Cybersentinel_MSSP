const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const winston = require('winston');
const https = require('https');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const { authMiddleware } = require('./middleware/auth');

require('dotenv').config();

/* ---------------- LOGGER ---------------- */

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

/* ---------------- APP INIT ---------------- */

const app = express();
const PORT = process.env.PORT || 7000;

/* ---------------- SECURITY (Development Mode - No HTTPS enforcement) ---------------- */

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    // Disable HSTS in development to prevent HTTPS enforcement
    hsts: false,
    // Disable content security policy that upgrades insecure requests
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // Remove 'upgrade-insecure-requests' directive
      },
    },
  })
);

/* ---------------- CORE MIDDLEWARE ---------------- */

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

/* ---------------- API ROUTES ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/news', newsRoutes);

/* ---------------- REACT BUILD ---------------- */

const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

/* ---------------- SPA FALLBACK ---------------- */

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ---------------- ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
  });
});

/* ---------------- START SERVER ---------------- */

const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem')),
};

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on https://192.168.1.189:${PORT}`);
});

module.exports = app;

