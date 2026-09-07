'use strict';

// A seal only means anything if issuer and verifier sign/check the exact
// same bytes. This turns any JS object into one fixed, sorted-key string,
// so "change one character and the seal breaks" (Spec Part II.2.2 item 6)
// is actually true regardless of how the object was built in memory.
function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const parts = keys.map((k) => JSON.stringify(k) + ':' + canonicalize(value[k]));
  return '{' + parts.join(',') + '}';
}

function canonicalBytes(value) {
  return Buffer.from(canonicalize(value), 'utf8');
}

module.exports = { canonicalize, canonicalBytes };
