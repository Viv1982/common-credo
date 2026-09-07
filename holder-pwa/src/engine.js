'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// The single import point for the shared common-credo-core engine, exposing
// exactly what the wallet needs in the browser. Everything here is
// browser-safe (verified in Phase 1: keyCrypto.web, and the fs-free splits of
// keys.js -> keyIdentity.js and cancellationList.js -> cancellationListRead.js
// that verify.js now uses). Keeping all core imports behind this one module
// means the rest of the app never reaches into core/ paths directly.

const { generateKeypair, encodeForBackup, publicKeyFromSecret } = require('common-credo-core/lib/keyIdentity');
const { encryptSecretKey, decryptSecretKey, isSupported } = require('common-credo-core/lib/keyCrypto.web');
const { recordIsStructurallySealed, parseRecordContent } = require('common-credo-core/lib/record');
const { publishDispute, publishWithdrawal, DISPUTE_CATEGORIES } = require('common-credo-core/lib/holderActions');
const { verifyRecord } = require('common-credo-core/lib/verify');
const { readBundle } = require('common-credo-core/lib/bundle');
const { createPool, DEFAULT_RELAYS } = require('common-credo-core/lib/relay');

module.exports = {
  generateKeypair, encodeForBackup, publicKeyFromSecret,
  encryptSecretKey, decryptSecretKey, cryptoSupported: isSupported,
  recordIsStructurallySealed, parseRecordContent,
  publishDispute, publishWithdrawal, DISPUTE_CATEGORIES,
  verifyRecord, readBundle,
  createPool, DEFAULT_RELAYS,
};
