'use strict';

const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const { mkdirpSync } = require('./fsutil');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DIRECTORY_PATH = path.join(DATA_DIR, 'directory.json');

function toHex(u8) {
  return Buffer.from(u8).toString('hex');
}
function fromHex(hex) {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function generateIssuerKeypair() {
  const kp = nacl.sign.keyPair();
  return { publicKey: toHex(kp.publicKey), secretKey: toHex(kp.secretKey) };
}

// --- Gap 1 stand-in -----------------------------------------------------
// The Spec (Part II.2.2 #1) has an issuer's public key travel INSIDE the
// record it signs, self-declared. Nothing in the Spec says how a verifier
// first learns that key really belongs to the named issuer, rather than to
// whoever typed that issuer's name into a record they forged themselves.
// The same applies to the cancellation-list address (Part III).
//
// This directory is NOT a Common Credo component. It is demo scaffolding
// standing in for whatever real out-of-band trust root CC eventually
// chooses (a federation registry, a domain-verified address, a
// chamber-of-commerce phonebook, etc.). A verifier in this demo checks a
// record's self-declared issuer key against this directory as a stand-in
// for "I already know this issuer some other way" -- that step is the gap,
// not the spec, being made visible rather than quietly assumed away.
function ensureDataDir() {
  mkdirpSync(DATA_DIR);
}

function loadDirectory() {
  ensureDataDir();
  if (!fs.existsSync(DIRECTORY_PATH)) return {};
  return JSON.parse(fs.readFileSync(DIRECTORY_PATH, 'utf8'));
}

function saveDirectory(dir) {
  ensureDataDir();
  fs.writeFileSync(DIRECTORY_PATH, JSON.stringify(dir, null, 2));
}

// Register an issuer's real key/address in the demo trust-root stand-in.
// In the real world this is the step nobody has designed yet (Gap 1).
function registerIssuer(issuerName, publicKeyHex, cancellationListAddress) {
  const dir = loadDirectory();
  dir[issuerName] = { publicKey: publicKeyHex, cancellationListAddress };
  saveDirectory(dir);
}

function lookupIssuer(issuerName) {
  const dir = loadDirectory();
  return dir[issuerName] || null;
}

module.exports = {
  toHex,
  fromHex,
  generateIssuerKeypair,
  registerIssuer,
  lookupIssuer,
  loadDirectory,
  DATA_DIR,
};
