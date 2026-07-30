const crypto = require('crypto');

// One-off script: generates the RSA keypair the console uses to sign SIEM SSO
// launch tokens. Run manually and paste the printed lines into .env yourself -
// this script never touches .env, so a single run can't corrupt existing config.
function generateSsoKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const kid = 'mssp-' + crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
  const privateKeyB64 = Buffer.from(privateKey, 'utf8').toString('base64');
  const publicKeyB64 = Buffer.from(publicKey, 'utf8').toString('base64');

  console.log('================ Paste into backend/.env ================');
  console.log(`SIEM_SSO_PRIVATE_KEY=${privateKeyB64}`);
  console.log(`SIEM_SSO_KID=${kid}`);
  console.log('===========================================================\n');

  console.log('================ Send to the client SIEM operator ================');
  console.log('Public key (SPKI PEM):\n');
  console.log(publicKey);
  console.log('Public key (base64, single line):\n');
  console.log(publicKeyB64);
  console.log(`\nkid: ${kid}`);
  console.log('====================================================================');
}

generateSsoKeypair();
