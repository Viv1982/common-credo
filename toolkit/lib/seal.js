'use strict';

const nacl = require('tweetnacl');
const { canonicalBytes } = require('./canonical');
const { fromHex, toHex } = require('./keys');

// Spec Part II.2.2 #6 -- "the issuer's digital signature over the whole
// record." We sign the record AS IT STANDS (including recordId and the
// revocationPointer) so that changing any one field -- or swapping out the
// pointer to a different cancellation list -- breaks the seal. This is the
// tally stick's two matching halves, rebuilt in Ed25519.
function sealRecord(record, issuerSecretKeyHex) {
  if (record.seal) throw new Error('record is already sealed');
  const secretKey = fromHex(issuerSecretKeyHex);
  const signature = nacl.sign.detached(canonicalBytes(record), secretKey);
  return Object.assign({}, record, {
    seal: {
      algorithm: 'ed25519',
      signature: toHex(signature),
      signedAt: new Date().toISOString(),
    },
  });
}

// Structural check only: does this signature match the record's OWN
// embedded issuer.publicKey? This is necessary but not sufficient -- see
// Gap 1 in verify.js for the missing piece (whether that embedded key is
// really the named issuer's).
function sealMatchesEmbeddedKey(record) {
  if (!record.seal) return false;
  const { seal, ...rest } = record;
  const bodyWithoutSeal = rest;
  const signature = fromHex(seal.signature);
  const publicKey = fromHex(record.issuer.publicKey);
  return nacl.sign.detached.verify(canonicalBytes(bodyWithoutSeal), signature, publicKey);
}

module.exports = { sealRecord, sealMatchesEmbeddedKey };
