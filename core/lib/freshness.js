'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// R2: "a list must be re-signed at least every 90 days even if nothing
// changed... silence and 'all clear' must mean different things." Pure
// date-math -- no network, no filesystem.

const MAX_AGE_DAYS = 90;
const RESTAMP_THRESHOLD_DAYS = 80; // re-stamp with margin, never let a slow scheduler tick miss the 90-day cap

function ageInDays(createdAtUnixSeconds, now) {
  const nowMs = (now || new Date()).getTime();
  return (nowMs - createdAtUnixSeconds * 1000) / (1000 * 60 * 60 * 24);
}

function needsReStamp(listEvent, now) {
  if (!listEvent) return true; // no list at all is the "dead issuer" case, not this module's concern to fix -- but from a freshness standpoint, nothing to re-stamp
  return ageInDays(listEvent.created_at, now) >= RESTAMP_THRESHOLD_DAYS;
}

function isStale(listEvent, now) {
  if (!listEvent) return true;
  return ageInDays(listEvent.created_at, now) >= MAX_AGE_DAYS;
}

module.exports = { MAX_AGE_DAYS, RESTAMP_THRESHOLD_DAYS, ageInDays, needsReStamp, isStale };
