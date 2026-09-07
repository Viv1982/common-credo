'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// Spec v0.3 Part II.2.2 (D2) -- ported from toolkit/lib/record.js (the
// v0.2-era demo). Kept as a small versioned config module, not inlined
// into signing logic, because Spec Part VII says the final core list is
// "to be finalised with the warm-seed community" -- a future revision
// should be a one-file change, never touching the crypto path.

const CORE_CLAIM_TYPES = {
  loan_repaid: { creditJudgement: true },
  loan_defaulted: { creditJudgement: true },
  trade_credit_honoured: { creditJudgement: true },
  trade_credit_defaulted: { creditJudgement: true },
  supplier_payments_record: { creditJudgement: true },
  savings_record: { creditJudgement: false },
  membership_good_standing: { creditJudgement: false },
  registration_licence_fact: { creditJudgement: false },
  character_vouch: { creditJudgement: false },
};

// Holder identity anchors (D1) -- distinct from the issuer anchor ladder
// (D7, lib/anchor.js). Same four named in the Spec's own text.
const HOLDER_IDENTITY_ANCHOR_TYPES = ['national_id', 'company_registration', 'phone_number', 'community_register'];

const VOUCH_TYPES = ['saw_money_move', 'knows_character'];

const OUTCOME_POLARITY = ['positive', 'negative', 'neutral'];

module.exports = { CORE_CLAIM_TYPES, HOLDER_IDENTITY_ANCHOR_TYPES, VOUCH_TYPES, OUTCOME_POLARITY };
