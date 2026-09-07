'use strict';

// Proves the two key-crypto adapters interoperate: a key encrypted by the
// Node desktop adapter decrypts with the WebCrypto PWA adapter and vice
// versa, over the shared keyFormat.js payload. This is the crux of the
// phone-PWA plan's Phase 1 -- it means "export your encrypted key" is a real
// cross-device backup, and that the PWA's cryptography is trustworthy before
// any UI is built. Runs headless: Node >=20 exposes globalThis.crypto.subtle
// and @noble/hashes is pure JS, so the "web" adapter runs here unchanged.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { generateSecretKey } = require('nostr-tools/pure');
const nodeCrypto = require('../lib/keyCrypto.node');
const webCrypto = require('../lib/keyCrypto.web');
const keyFormat = require('../lib/keyFormat');

const PASSWORD = 'correct horse battery staple';

function eq(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

test('scrypt params reproduce Node crypto.scryptSync defaults exactly', () => {
  const salt = crypto.randomBytes(16);
  const viaDefault = crypto.scryptSync(PASSWORD, salt, keyFormat.KEY_BYTES);
  const viaExplicit = crypto.scryptSync(PASSWORD, salt, keyFormat.KEY_BYTES, {
    N: keyFormat.SCRYPT_PARAMS.N, r: keyFormat.SCRYPT_PARAMS.r, p: keyFormat.SCRYPT_PARAMS.p,
  });
  assert.equal(Buffer.compare(viaDefault, viaExplicit), 0);
});

test('node adapter produces the documented v1 payload shape', () => {
  const sk = generateSecretKey();
  const p = nodeCrypto.encryptSecretKey(sk, PASSWORD);
  assert.equal(p.version, 1);
  assert.equal(p.algorithm, 'aes-256-gcm');
  assert.equal(p.kdf, 'scrypt');
  assert.equal(keyFormat.hexToBytes(p.salt).length, keyFormat.SALT_BYTES);
  assert.equal(keyFormat.hexToBytes(p.iv).length, keyFormat.IV_BYTES);
  assert.equal(keyFormat.hexToBytes(p.authTag).length, keyFormat.AUTH_TAG_BYTES);
  assert.equal(keyFormat.hexToBytes(p.ciphertext).length, keyFormat.KEY_BYTES);
});

test('web adapter produces the same v1 payload shape', async () => {
  const sk = generateSecretKey();
  const p = await webCrypto.encryptSecretKey(sk, PASSWORD);
  assert.equal(p.version, 1);
  assert.equal(p.algorithm, 'aes-256-gcm');
  assert.equal(p.kdf, 'scrypt');
  assert.equal(keyFormat.hexToBytes(p.authTag).length, keyFormat.AUTH_TAG_BYTES);
  assert.equal(keyFormat.hexToBytes(p.ciphertext).length, keyFormat.KEY_BYTES);
});

test('node self round-trip', () => {
  const sk = generateSecretKey();
  const back = nodeCrypto.decryptSecretKey(nodeCrypto.encryptSecretKey(sk, PASSWORD), PASSWORD);
  assert.ok(eq(back, sk));
});

test('web self round-trip', async () => {
  const sk = generateSecretKey();
  const back = await webCrypto.decryptSecretKey(await webCrypto.encryptSecretKey(sk, PASSWORD), PASSWORD);
  assert.ok(eq(back, sk));
});

test('cross: node-encrypt -> web-decrypt', async () => {
  const sk = generateSecretKey();
  const payload = nodeCrypto.encryptSecretKey(sk, PASSWORD);
  const back = await webCrypto.decryptSecretKey(payload, PASSWORD);
  assert.ok(eq(back, sk), 'desktop-encrypted key must decrypt in the PWA adapter');
});

test('cross: web-encrypt -> node-decrypt', async () => {
  const sk = generateSecretKey();
  const payload = await webCrypto.encryptSecretKey(sk, PASSWORD);
  const back = nodeCrypto.decryptSecretKey(payload, PASSWORD);
  assert.ok(eq(back, sk), 'PWA-encrypted key must decrypt in the desktop adapter');
});

test('wrong password fails on node adapter', () => {
  const sk = generateSecretKey();
  const payload = nodeCrypto.encryptSecretKey(sk, PASSWORD);
  assert.throws(() => nodeCrypto.decryptSecretKey(payload, 'wrong'), /Wrong password/);
});

test('wrong password fails on web adapter', async () => {
  const sk = generateSecretKey();
  const payload = await webCrypto.encryptSecretKey(sk, PASSWORD);
  await assert.rejects(webCrypto.decryptSecretKey(payload, 'wrong'), /Wrong password/);
});

test('cross wrong password fails: node-encrypt -> web-decrypt(wrong)', async () => {
  const sk = generateSecretKey();
  const payload = nodeCrypto.encryptSecretKey(sk, PASSWORD);
  await assert.rejects(webCrypto.decryptSecretKey(payload, 'nope'), /Wrong password/);
});
