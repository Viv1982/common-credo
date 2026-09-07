'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The Node crypto adapter for the shared key payload (keyFormat.js). This is
// the desktop path -- keys.js wraps it with fs. It is intentionally
// storage-agnostic (no fs here): given a secret key + password it returns a
// payload object, and given a payload + password it returns the secret key.
// The WebCrypto adapter (keyCrypto.web.js) produces byte-identical payloads
// for the phone PWA.

const crypto = require('crypto');
const {
  SCRYPT_PARAMS, KEY_BYTES, SALT_BYTES, IV_BYTES,
  buildPayload, parsePayload,
} = require('./keyFormat');

function deriveKey(password, salt) {
  // Node's scryptSync defaults are exactly SCRYPT_PARAMS; pass them
  // explicitly so this never drifts from the WebCrypto adapter.
  return crypto.scryptSync(password, salt, KEY_BYTES, {
    N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p,
  });
}

function encryptSecretKey(secretKey, password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(secretKey)), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return buildPayload({
    salt: new Uint8Array(salt),
    iv: new Uint8Array(iv),
    authTag: new Uint8Array(authTag),
    ciphertext: new Uint8Array(ciphertext),
  });
}

function decryptSecretKey(payload, password) {
  const { salt, iv, authTag, ciphertext } = parsePayload(payload);
  const key = deriveKey(password, Buffer.from(salt));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(authTag));
  let secretKey;
  try {
    secretKey = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
  } catch (e) {
    throw new Error('Wrong password, or key file is corrupted.');
  }
  return new Uint8Array(secretKey);
}

function isSupported() {
  return true;
}

module.exports = { encryptSecretKey, decryptSecretKey, isSupported };
