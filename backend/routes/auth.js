const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const knex = require('../db');
require('dotenv').config();

const { authMiddleware } = require('../middleware/auth');

// SIEM SSO signing key (RS256). The private key never leaves the console.
const SIEM_SSO_KID = process.env.SIEM_SSO_KID;
const SIEM_SSO_PRIVATE_KEY = process.env.SIEM_SSO_PRIVATE_KEY
  ? Buffer.from(process.env.SIEM_SSO_PRIVATE_KEY, 'base64').toString('utf8')
  : null;

const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderSsoError = (res, status, message) => {
  res.status(status).type('html').send(
    `<!doctype html><html><body><p>${escapeHtml(message)}</p></body></html>`
  );
};

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

  // Check TOTP token (window: 4 = ±2 min tolerance for client/server clock drift)
  const verified = speakeasy.totp.verify({
    secret: user.mfa_secret,
    encoding: 'base32',
    token: token,
    window: 4
  });

  if (verified) {
    return true;
  }

  // In a real app, you would also check and handle backup codes here
  // For simplicity, this is omitted

  return false;
};

router.post('/login', async (req, res) => {
  let { username, password, totpCode } = req.body;
  username = username ? username.trim() : username;
  password = password ? password.trim() : password;
  totpCode = totpCode ? totpCode.trim() : totpCode;
  console.log('Login attempt for:', username);

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    console.log('1. Fetching user from DB');
    // Only select necessary fields for performance
    const user = await knex('users')
      .where({ username })
      .select('id', 'username', 'password', 'role', 'mfa_secret', 'blocked')
      .first();

    if (!user) {
      console.log('User not found');
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
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
      { id: user.id, username, role: user.role },
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

// Helper to ensure a client URL has a valid scheme (mirrors the frontend's getNormalizedUrl)
const getNormalizedUrl = (rawUrl) => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `http://${trimmed}`;
};

// Launch SSO into a client's SIEM: mints a short-lived RS256 JWT and hands it
// off via an auto-submitting form POST (a real top-level navigation, not
// fetch/XHR - the SIEM needs that to write to its own origin's localStorage).
router.get('/siem-launch/:clientId', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.clientId;

    if (!SIEM_SSO_PRIVATE_KEY || !SIEM_SSO_KID) {
      console.error('SIEM_SSO_PRIVATE_KEY / SIEM_SSO_KID environment variables not set');
      return renderSsoError(res, 500, 'Server configuration error: SIEM SSO signing key not set');
    }

    const client = await knex('clients').where({ id: clientId }).first();
    if (!client) {
      return renderSsoError(res, 404, 'Client not found');
    }

    // Security check: if user is admin, ensure they have access to this client
    if (user.role === 'admin') {
      const access = await knex('client_admins')
        .where({ client_id: clientId, user_id: user.id })
        .first();

      if (!access) {
        return renderSsoError(res, 403, 'Unauthorized access to this client');
      }
    }

    if (!client.sso_client_id) {
      return renderSsoError(res, 400, 'This client is not configured for SIEM SSO');
    }

    let siemOrigin;
    try {
      siemOrigin = new URL(getNormalizedUrl(client.url)).origin;
    } catch (err) {
      return renderSsoError(res, 500, 'Client has an invalid SIEM URL configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: 'mssp-console',
        sub: 'mssp',
        aud: client.sso_client_id,
        jti: crypto.randomUUID(),
        iat: now,
        nbf: now - 60,
        exp: now + 60,
        analyst_id: String(user.id),
        analyst_username: user.username,
        analyst_role: user.role,
      },
      SIEM_SSO_PRIVATE_KEY,
      { algorithm: 'RS256', keyid: SIEM_SSO_KID }
    );

    const actionUrl = `${siemOrigin}/api/auth/sso/mssp`;
    res.type('html').send(`<!doctype html>
<html>
<body>
<form id="sso" method="POST" action="${escapeHtml(actionUrl)}">
<input type="hidden" name="token" value="${escapeHtml(token)}">
</form>
<script>document.getElementById('sso').submit();</script>
</body>
</html>`);
  } catch (err) {
    console.error('Error generating SIEM SSO launch token:', err);
    renderSsoError(res, 500, 'Failed to generate SIEM SSO launch token');
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