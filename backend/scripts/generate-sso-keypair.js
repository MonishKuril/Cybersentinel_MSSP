const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Bootstraps the RSA keypair the console uses to sign SIEM SSO launch
// tokens. Safe to run on every install/redeploy: if a keypair is already
// configured in .env, it is left untouched (never silently rotated - every
// already-onboarded client's SIEM holds the old public key, and rotating
// would break their SSO until they're given the new one). Only generates
// and appends to .env when the keys are missing.
const ENV_PATH = path.join(__dirname, '..', '.env');

function readEnvFile() {
  return fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
}

function getEnvValue(envContent, key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

function derivePublicKeyInfo(privateKeyPem) {
  const publicKey = crypto.createPublicKey(privateKeyPem).export({ type: 'spki', format: 'pem' });
  const kid = 'mssp-' + crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
  return { publicKey, kid };
}

function printHandoff(publicKey, kid) {
  const publicKeyB64 = Buffer.from(publicKey, 'utf8').toString('base64');
  console.log('\n================ Send to the client SIEM operator ================');
  console.log('Public key (SPKI PEM):\n');
  console.log(publicKey);
  console.log('Public key (base64, single line):\n');
  console.log(publicKeyB64);
  console.log(`\nkid: ${kid}`);
  console.log('====================================================================\n');
}

function generateSsoKeypair() {
  const envContent = readEnvFile();
  const existingPrivateKeyB64 = getEnvValue(envContent, 'SIEM_SSO_PRIVATE_KEY');
  const existingKid = getEnvValue(envContent, 'SIEM_SSO_KID');

  if (existingPrivateKeyB64 && existingKid) {
    console.log('✅ SIEM SSO keypair already configured in .env - leaving it untouched.');
    const privateKeyPem = Buffer.from(existingPrivateKeyB64, 'base64').toString('utf8');
    const { publicKey } = derivePublicKeyInfo(privateKeyPem);
    printHandoff(publicKey, existingKid);
    return;
  }

  console.log('No SIEM SSO keypair found in .env - generating a new one...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const kid = 'mssp-' + crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
  const privateKeyB64 = Buffer.from(privateKey, 'utf8').toString('base64');

  const appendLines = `${envContent.endsWith('\n') || envContent === '' ? '' : '\n'}SIEM_SSO_PRIVATE_KEY=${privateKeyB64}\nSIEM_SSO_KID=${kid}\n`;
  fs.appendFileSync(ENV_PATH, appendLines);
  console.log(`✅ Generated new keypair and appended SIEM_SSO_PRIVATE_KEY / SIEM_SSO_KID to ${ENV_PATH}`);

  printHandoff(publicKey, kid);
}

generateSsoKeypair();
