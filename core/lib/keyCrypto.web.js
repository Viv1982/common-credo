'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The WebCrypto adapter for the shared key payload (keyFormat.js). This is
// the phone-PWA path. It is browser-safe -- no fs, no Node crypto, no Buffer
// -- and uses only globalThis.crypto (present in browsers and in Node >=20,
// so this file is unit-tested headlessly in core/test/keyCrypto.test.js) plus
// @noble/hashes' scrypt, which is already a transitive dependency of
// nostr-tools. It produces and consumes payloads byte-identical to the Node
// adapter (keyCrypto.node.js), so keys interoperate between the two tools.
//
// Two interop details worth stating:
//  - scrypt cost params come from keyFormat.SCRYPT_PARAMS and are verified
//    byte-identical to Node's crypto.scryptSync in the tests.
//  - WebCrypto's AES-GCM APPENDS the 16-byte auth tag to the ciphertext,
//    whereas Node exposes it separately. We split it off on encrypt and
//    re-append it on decrypt so the stored payload's separate `authTag` /
//    `ciphertext` fields match the Node adapter exactly.

const { scryptAsync } = require('@noble/hashes/scrypt.js');
const {
  SCRYPT_PARAMS, KEY_BYTES, SALT_BYTES, IV_BYTES, AUTH_TAG_BYTES,
  buildPayload, parsePayload, concatBytes,
} = require('./keyFormat');

function subtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('WebCrypto (crypto.subtle) is unavailable in this environment.');
  }
  return c.subtle;
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

async function deriveKey(password, salt) {
  const pw = new TextEncoder().encode(password);
  return scryptAsync(pw, salt, {
    N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p, dkLen: KEY_BYTES,
  });
}

async function importAesKey(rawKeyBytes) {
  return subtle().importKey('raw', rawKeyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptSecretKey(secretKey, password) {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const aesKey = await importAesKey(await deriveKey(password, salt));
  const sealed = new Uint8Array(
    await subtle().encrypt({ name: 'AES-GCM', iv }, aesKey, new Uint8Array(secretKey))
  );
  // WebCrypto returns ciphertext || authTag; split to match the Node format.
  const ciphertext = sealed.slice(0, sealed.length - AUTH_TAG_BYTES);
  const authTag = sealed.slice(sealed.length - AUTH_TAG_BYTES);
  return buildPayload({ salt, iv, authTag, ciphertext });
}

async function decryptSecretKey(payload, password) {
  const { salt, iv, authTag, ciphertext } = parsePayload(payload);
  const aesKey = await importAesKey(await deriveKey(password, salt));
  // Re-append the tag WebCrypto expects at the end of the ciphertext.
  const sealed = concatBytes(ciphertext, authTag);
  let plain;
  try {
    plain = await subtle().decrypt({ name: 'AES-GCM', iv }, aesKey, sealed);
  } catch (e) {
    throw new Error('Wrong password, or key file is corrupted.');
  }
  return new Uint8Array(plain);
}

function isSupported() {
  return !!(globalThis.crypto && globalThis.crypto.subtle && globalThis.crypto.getRandomValues);
}

module.exports = { encryptSecretKey, decryptSecretKey, isSupported };
