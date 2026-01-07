const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const knex = require('../db');
require('dotenv').config();

const { authMiddleware } = require('../middleware/auth');

// Generate backup codes
const generateBackupCodes = () => {
  return Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
};

// Check if user has MFA setup
const checkMFASetup = async (username) => {
  const user = await knex('users').where({ username }).first();
  return user && !!user.mfa_secret;
};

// Setup MFA for user
router.post('/setup-mfa', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username required' });
  }

  try {
    const secret = speakeasy.generateSecret({
      name: `MSSP Console (${username})`,
      issuer: 'MSSP Console'
    });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    const backupCodes = generateBackupCodes();

    await knex('users')
      .where({ username })
      .update({
        mfa_secret: secret.base32,
        // In a real app, backup codes should be hashed before storing
        // For this example, we'll store them as-is
        // mfa_backup_codes: JSON.stringify(backupCodes),
      });

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes,
      secret: secret.base32
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup MFA' });
  }
});

// Verify MFA token
const verifyMFAToken = async (username, token) => {
  const user = await knex('users').where({ username }).first();
  if (!user || !user.mfa_secret) {
    return false;
  }

  // Check TOTP token
  const verified = speakeasy.totp.verify({
    secret: user.mfa_secret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  if (verified) {
    return true;
  }

  // In a real app, you would also check and handle backup codes here
  // For simplicity, this is omitted

  return false;
};

router.post('/login', async (req, res) => {
  const { username, password, totpCode } = req.body;
  console.log('Login attempt for:', username);

  try {
    console.log('1. Fetching user from DB');
    const user = await knex('users').where({ username }).first();

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    console.log('2. User found:', user.username);

    if (user.blocked) {
      console.log('User is blocked');
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator. Please contact support.',
        blocked: true
      });
    }
    console.log('3. User is not blocked');

    console.log('4. Comparing passwords');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    console.log('5. Password is valid');


    const hasMFA = !!user.mfa_secret;
    console.log('6. MFA Status:', hasMFA);

    if (!hasMFA) {
      return res.json({
        success: true,
        requireMFASetup: true,
        message: "MFA setup required"
      });
    }

    if (!totpCode) {
      return res.json({
        success: true,
        requireMFAToken: true,
        message: "MFA token required"
      });
    }

    console.log('7. Verifying MFA token');
    if (!(await verifyMFAToken(username, totpCode))) {
      console.log('Invalid MFA token');
      return res.status(401).json({ success: false, message: "Invalid MFA token" });
    }
    console.log('8. MFA token is valid');


    const token = jwt.sign(
      { username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    });

    console.log('9. Login successful');
    res.json({ success: true, message: "Login successful", role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'An internal error occurred' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: "Logout successful" });
});

// Generate short-lived SIEM access token
router.post('/siem-access-token', authMiddleware, async (req, res) => {
  try {
    const user = req.user; // User object now comes from authMiddleware

    // Validate environment configuration
    if (!process.env.SIEM_SHARED_SECRET) {
      console.error('SIEM_SHARED_SECRET environment variable not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: SIEM_SHARED_SECRET not set'
      });
    }

    // Generate a short-lived token for SIEM access
    const siemToken = jwt.sign(
      {
        username: user.username,
        role: user.role,
        source: 'mssp'
      },
      process.env.SIEM_SHARED_SECRET,
      { expiresIn: '2m' }
    );

    res.json({
      success: true,
      siemToken
    });
  } catch (err) {
    console.error('Error generating SIEM access token:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SIEM access token'
    });
  }
});

router.get('/check', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ authenticated: false });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true, role: decoded.role, username: decoded.username });
  } catch (error) {
    res.clearCookie('token');
    res.json({ authenticated: false });
  }
});

module.exports = router;