'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.

const fs = require('fs');
const path = require('path');
const { bytesToHex, hexToBytes } = require('./keyFormat');
const { generateKeypair, encodeForBackup } = require('./keyIdentity');
const nodeCrypto = require('./keyCrypto.node');

// Kept for API compatibility with existing callers. The byte<->hex helpers
// now live in keyFormat.js (browser-safe, no Buffer) and are re-exported here;
// generateKeypair/encodeForBackup live in the browser-safe keyIdentity.js.
function toHex(bytes) {
  return bytesToHex(bytes);
}
function fromHex(hex) {
  return hexToBytes(hex);
}

// --- Encrypted-at-rest storage --------------------------------------------
// Password-derived AES-256-GCM. Not a hardware-backed keychain (documented
// in the plan as a v1.1 upgrade) but deliberately not plaintext JSON either
// -- this is real trust infrastructure from day one, not a demo.
//
// The cryptography now lives in the shared adapters (keyCrypto.node.js here,
// keyCrypto.web.js for the phone PWA), over the common payload format in
// keyFormat.js, so a key encrypted by this desktop tool decrypts in the PWA
// and vice versa. This facade adds only the fs read/write around it; the
// on-disk payload format is unchanged, so key files written before the split
// still load.

function saveEncryptedKey(filePath, secretKey, password) {
  const payload = nodeCrypto.encryptSecretKey(secretKey, password);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function loadEncryptedKey(filePath, password) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return nodeCrypto.decryptSecretKey(payload, password);
}

function keyFileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  toHex,
  fromHex,
  generateKeypair,
  encodeForBackup,
  saveEncryptedKey,
  loadEncryptedKey,
  keyFileExists,
};
