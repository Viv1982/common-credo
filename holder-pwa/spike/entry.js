// Phase 1 spike entry point (holder wallet PWA plan).
//
// Re-exports, for the browser, exactly the core/ engine the phone wallet
// needs on its WRITE path -- key crypto (WebCrypto adapter), record creation,
// holder dispute/withdrawal signing + publishing, verification, and a relay
// pool. esbuild bundles this into one self-contained browser ESM (no CDN,
// same approach as build-site.js's verifier vendoring). This file is the
// seed of the real PWA's browser entry; the spike page drives it end to end.

import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { encryptSecretKey, decryptSecretKey, isSupported as webCryptoSupported } from '../../core/lib/keyCrypto.web.js';
import { createRecord } from '../../core/lib/record.js';
import { publishWithdrawal, publishDispute, fetchWithdrawal, fetchDispute } from '../../core/lib/holderActions.js';
import { verifyRecord } from '../../core/lib/verify.js';
import { createPool, DEFAULT_RELAYS } from '../../core/lib/relay.js';

export {
  generateSecretKey, getPublicKey,
  encryptSecretKey, decryptSecretKey, webCryptoSupported,
  createRecord,
  publishWithdrawal, publishDispute, fetchWithdrawal, fetchDispute,
  verifyRecord,
  createPool, DEFAULT_RELAYS,
};
