'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The browser-safe identity helpers: generate a keypair, and encode it into
// the human-readable nsec/npub forms for the forced backup step. Only
// nostr-tools -- NO fs, NO node crypto -- so the phone wallet PWA can import
// these directly. Split out of keys.js (which keeps the fs-backed storage
// facade) for the same reason keyCrypto and cancellationListRead were split:
// to make core/ browser-cleanly importable. keys.js re-exports these, so the
// desktop tools' API is unchanged.

const { generateSecretKey, getPublicKey } = require('nostr-tools/pure');
const { nip19 } = require('nostr-tools');

function generateKeypair() {
  const secretKey = generateSecretKey(); // Uint8Array
  const publicKey = getPublicKey(secretKey); // hex string
  return { secretKey, publicKey };
}

// Derive the public key from a secret key -- used when restoring an identity
// from an exported encrypted key file, where only the secret key comes back.
function publicKeyFromSecret(secretKey) {
  return getPublicKey(secretKey);
}

// Human-readable forms for the forced backup step at onboarding (Spec has
// no opinion on this; it is this build's key-loss mitigation -- there is no
// recovery mechanism by design).
function encodeForBackup(secretKey, publicKey) {
  return {
    nsec: nip19.nsecEncode(secretKey),
    npub: nip19.npubEncode(publicKey),
  };
}

module.exports = { generateKeypair, encodeForBackup, publicKeyFromSecret };
