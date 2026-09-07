'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// Spec Part V -- "A bundle is the set of records a holder chooses to
// present ... A standing is a verifier's reading of a bundle ... does not
// define scoring." This function assembles facts and applies the D4
// memory rule; it deliberately produces no score, only organised,
// checkable facts, per "CC carries facts; users decide."
//
// This is a new file, not a port of toolkit/lib/bundle.js -- the D4 lapse
// arithmetic there is correct and preserved verbatim, but that version
// assumed a flat pre-Nostr record shape and a SYNCHRONOUS verify call.
// Real records nest fields inside JSON.parse(record.content), issuance
// date is the event's own created_at (unix seconds), and verifyRecord is
// now async (network calls, plus the holder dispute/withdrawal lookups).

const { verifyRecord } = require('./verify');
const { parseRecordContent } = require('./record');

const DEFAULT_NEGATIVE_LAPSE_YEARS = 6; // Spec D4: "5-7 years, regional tuning" -- midpoint default.
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function ageInYears(createdAtUnixSeconds, now) {
  return (now.getTime() - createdAtUnixSeconds * 1000) / MS_PER_YEAR;
}

// records: array of sealed Nostr-shaped records (as produced by
// core/lib/record.js's createRecord). relayUrls / pool as elsewhere.
// holderPubkeyHex, if supplied, enables the dispute/withdrawal lookups in
// verifyRecord for every record in the bundle.
async function readBundle(pool, records, relayUrls, holderPubkeyHex, options) {
  options = options || {};
  const now = options.now || new Date();
  const negativeLapseYears = options.negativeLapseYears || DEFAULT_NEGATIVE_LAPSE_YEARS;
  const forceShowRecordIds = new Set(options.forceShowRecordIds || []);

  const entries = await Promise.all(records.map(async (record) => {
    const content = parseRecordContent(record);
    const verification = await verifyRecord(pool, record, relayUrls, holderPubkeyHex);
    const polarity = content.claim.outcome.polarity;
    const ageYears = ageInYears(record.created_at, now);
    // D4: positive records never lapse; negative records lapse after the
    // fixed period. "Lapsed means hidden, never deleted" -- a lapsed
    // record still exists in the wallet and can be force-shown by the
    // holder; it is just excluded from the default bundle view.
    const lapsed = polarity === 'negative' && ageYears > negativeLapseYears;
    const shown = !lapsed || forceShowRecordIds.has(record.id);

    return {
      recordId: record.id,
      issuer: content.issuer.name,
      claimType: content.claim.claimType,
      polarity,
      issuedAt: new Date(record.created_at * 1000).toISOString(),
      ageYears: Math.round(ageYears * 10) / 10,
      lapsed,
      shownByHolderOverride: lapsed && shown,
      shown,
      verification,
    };
  }));

  const visible = entries.filter((e) => e.shown);
  const summary = {
    totalRecordsInWallet: entries.length,
    shownInStandard: visible.length,
    hiddenAsLapsed: entries.filter((e) => e.lapsed && !e.shown).length,
    positive: visible.filter((e) => e.polarity === 'positive').length,
    negative: visible.filter((e) => e.polarity === 'negative').length,
    neutral: visible.filter((e) => e.polarity === 'neutral').length,
    cancelled: visible.filter((e) => e.verification.overall === 'cancelled').length,
    withdrawn: visible.filter((e) => e.verification.overall === 'withdrawn_by_holder').length,
    unverifiable: visible.filter((e) => e.verification.overall === 'unverifiable').length,
  };

  return { generatedAt: now.toISOString(), entries, summary };
}

module.exports = { readBundle, DEFAULT_NEGATIVE_LAPSE_YEARS };
