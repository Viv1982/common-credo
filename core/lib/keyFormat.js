'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The shared contract for the holder/issuer key file: the exact encrypted
// payload shape and the KDF/cipher parameters, plus dependency-free byte
// helpers. Deliberately browser-safe -- NO fs, NO Buffer, NO node crypto --
// so that both the Node crypto adapter (keyCrypto.node.js, desktop) and the
// WebCrypto adapter (keyCrypto.web.js, the phone PWA) build and read the
// identical JSON. That interoperability is the point: a key encrypted on the
// desktop tool decrypts in the PWA and vice versa, which makes the PWA's
// "export your key" the real backup/restore path across devices.
//
// The parameters below reproduce Node's crypto.scryptSync defaults
// (N=16384, r=8, p=1) and the original keys.js format exactly, so key files
// written before this split still load unchanged.

const PAYLOAD_VERSION = 1;
const ALGORITHM = 'aes-256-gcm';
const KDF = 'scrypt';

// scrypt cost parameters -- MUST match Node's crypto.scryptSync defaults, or
// desktop-written key files stop decrypting. Verified byte-identical against
// crypto.scryptSync in core/test/keyCrypto.test.js.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_BYTES = 32;   // AES-256
const SALT_BYTES = 16;
const IV_BYTES = 12;    // GCM standard nonce length
const AUTH_TAG_BYTES = 16;

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0) {
    throw new Error('invalid hex string');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) throw new Error('invalid hex string');
    out[i] = byte;
  }
  return out;
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

// Assemble the on-disk/in-storage JSON from the raw byte parts. Field names
// and order reproduce the original keys.js payload exactly.
function buildPayload({ salt, iv, authTag, ciphertext }) {
  return {
    version: PAYLOAD_VERSION,
    algorithm: ALGORITHM,
    kdf: KDF,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    authTag: bytesToHex(authTag),
    ciphertext: bytesToHex(ciphertext),
  };
}

// Validate and decode a stored payload back into raw byte parts. Throws a
// clear error on anything this build did not write, rather than failing
// obscurely inside a cipher later.
function parsePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('key file is not a Common Credo key payload.');
  }
  if (payload.version !== PAYLOAD_VERSION) {
    throw new Error(`unsupported key file version: ${payload.version}`);
  }
  if (payload.algorithm !== ALGORITHM || payload.kdf !== KDF) {
    throw new Error('key file uses an unexpected algorithm or KDF.');
  }
  for (const field of ['salt', 'iv', 'authTag', 'ciphertext']) {
    if (typeof payload[field] !== 'string') {
      throw new Error(`key file is missing the "${field}" field.`);
    }
  }
  return {
    salt: hexToBytes(payload.salt),
    iv: hexToBytes(payload.iv),
    authTag: hexToBytes(payload.authTag),
    ciphertext: hexToBytes(payload.ciphertext),
  };
}

module.exports = {
  PAYLOAD_VERSION, ALGORITHM, KDF, SCRYPT_PARAMS,
  KEY_BYTES, SALT_BYTES, IV_BYTES, AUTH_TAG_BYTES,
  bytesToHex, hexToBytes, concatBytes,
  buildPayload, parsePayload,
};
