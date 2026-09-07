'use strict';

const { verifyRecord } = require('./verify');

const DEFAULT_NEGATIVE_LAPSE_YEARS = 6; // Spec D4: "5-7 years, regional tuning" -- demo picks the midpoint.
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function ageInYears(issuedAt, now) {
  return (now.getTime() - new Date(issuedAt).getTime()) / MS_PER_YEAR;
}

// Spec Part V -- "A bundle is the set of records a holder chooses to
// present ... A standing is a verifier's reading of a bundle ... does not
// define scoring." This function assembles facts and applies the D4 memory
// rule; it deliberately produces no score, only organised, checkable facts,
// per "CC carries facts; users decide."
function readBundle(records, options) {
  options = options || {};
  const now = options.now || new Date();
  const negativeLapseYears = options.negativeLapseYears || DEFAULT_NEGATIVE_LAPSE_YEARS;
  const forceShowRecordIds = new Set(options.forceShowRecordIds || []);

  const entries = records.map((record) => {
    const verification = verifyRecord(record);
    const polarity = record.claim.outcome.polarity;
    const ageYears = ageInYears(record.issuedAt, now);
    // D4: positive records never lapse; negative records lapse after the
    // fixed period. "Lapsed means hidden, never deleted" -- so a lapsed
    // record still exists in the wallet and can be force-shown by the
    // holder, it is just excluded from the default bundle view.
    const lapsed = polarity === 'negative' && ageYears > negativeLapseYears;
    const shown = !lapsed || forceShowRecordIds.has(record.recordId);

    return {
      recordId: record.recordId,
      issuer: record.issuer.name,
      claimType: record.claim.claimType,
      polarity,
      issuedAt: record.issuedAt,
      ageYears: Math.round(ageYears * 10) / 10,
      lapsed,
      shownByHolderOverride: lapsed && shown,
      shown,
      verification,
    };
  });

  const visible = entries.filter((e) => e.shown);
  const summary = {
    totalRecordsInWallet: entries.length,
    shownInStandard: visible.length,
    hiddenAsLapsed: entries.filter((e) => e.lapsed && !e.shown).length,
    positive: visible.filter((e) => e.polarity === 'positive').length,
    negative: visible.filter((e) => e.polarity === 'negative').length,
    neutral: visible.filter((e) => e.polarity === 'neutral').length,
    cancelled: visible.filter((e) => e.verification.overall === 'cancelled').length,
    unverifiable: visible.filter((e) => e.verification.overall === 'unverifiable').length,
  };

  return { generatedAt: now.toISOString(), entries, summary };
}

module.exports = { readBundle, DEFAULT_NEGATIVE_LAPSE_YEARS };
