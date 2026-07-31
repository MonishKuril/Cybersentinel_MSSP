const jwt = require('jsonwebtoken');
const logger = require('../logger');
require('dotenv').config();

// NOTE: block enforcement for already-issued sessions happens at login
// (routes/auth.js checks users.blocked before minting a token) and at the
// SIEM SSO launch route (which checks users.blocked directly from the DB).
// This middleware only validates the JWT itself; it does not re-check DB
// block status on every request, since that used to be attempted via a
// config/admins.js stub that never held real data (removed - it was
// dead weight: synchronous disk I/O on every request that always
// evaluated to "not blocked").
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth error', { message: error.message });
    return res.status(401).json({ success: false, message: 'Invalid authentication' });
  }
};

const adminAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

const superAdminAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'main-superadmin') {
    return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

const mainSuperAdminAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'main-superadmin') {
    return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

// FIXED: This middleware was missing main-superadmin role
const adminOrSuperAdminAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'main-superadmin') {
    return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

// New middleware for any elevated privileges (superadmin or main-superadmin)
const elevatedAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'main-superadmin') {
    return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminAuthMiddleware,
  superAdminAuthMiddleware,
  mainSuperAdminAuthMiddleware,
  adminOrSuperAdminAuthMiddleware,
  elevatedAuthMiddleware
};
