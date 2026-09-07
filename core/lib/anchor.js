'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// Spec v0.3 Part II-A (D7) -- the issuer anchor ladder. A working set, to
// be tuned with the warm-seed community (Spec Part VII). This module only
// lets an issuer DECLARE a rung truthfully; verifying it against a
// jurisdiction's own public registry is explicitly a verifier-side job,
// out of scope for the issuer tool (Spec: "CC is never in the loop").

const ISSUER_ANCHOR_LADDER = [
  { rung: 1, id: 'national_business_registration', label: 'National business registration (ABN, GSTIN, BIN, NIB, or local equivalent)' },
  { rung: 2, id: 'tax_vat_id', label: 'Tax / VAT / GST identifier' },
  { rung: 3, id: 'cooperative_ngo_registration', label: 'Cooperative, NGO, or association registration certificate' },
  { rung: 4, id: 'bank_account', label: "Bank account held in the entity's name" },
  { rung: 5, id: 'mobile_money_account', label: "Mobile-money account held in the entity's name" },
  { rung: 6, id: 'verified_physical_address', label: 'Verified physical address registered with local government' },
];

const ANCHOR_BY_ID = Object.fromEntries(ISSUER_ANCHOR_LADDER.map((a) => [a.id, a]));

function isValidAnchorId(id) {
  return Object.prototype.hasOwnProperty.call(ANCHOR_BY_ID, id);
}

// Every issuer must declare SOMETHING externally verifiable -- "anonymous
// issuers are not permitted" is the one hard line (Spec Part II-A).
function validateIssuerAnchor(anchor) {
  if (!anchor || typeof anchor !== 'object') {
    throw new Error('issuer anchor is required (Spec D7 -- no anonymous issuers)');
  }
  if (!isValidAnchorId(anchor.type)) {
    throw new Error(`issuer anchor type must be one of: ${ISSUER_ANCHOR_LADDER.map((a) => a.id).join(', ')}`);
  }
  if (!anchor.country) {
    throw new Error('issuer anchor needs a declared country');
  }
  if (!anchor.value) {
    throw new Error('issuer anchor needs a declared value (the registration/account/address identifier itself)');
  }
  return true;
}

module.exports = { ISSUER_ANCHOR_LADDER, ANCHOR_BY_ID, isValidAnchorId, validateIssuerAnchor };
