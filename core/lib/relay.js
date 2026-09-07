'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// A relay pool wrapper that waits for quorum acknowledgment rather than
// firing and forgetting. Built after live-testing showed real public
// relays are flaky (2 of 4 tested relays were unreachable from the dev
// sandbox that built this) -- a cancellation the issuer believes published
// but silently didn't is a real conformance failure: the record would
// still verify as valid.

const { SimplePool } = require('nostr-tools/pool');

const DEFAULT_RELAYS = ['wss://nos.lol', 'wss://relay.primal.net'];
const DEFAULT_PUBLISH_TIMEOUT_MS = 8000;
const DEFAULT_QUERY_TIMEOUT_MS = 8000;

function createPool() {
  return new SimplePool();
}

// Publishes `event` to `relayUrls` and waits for at least `quorum` relays
// to acknowledge (OK) before resolving. Never silently succeeds on a
// partial publish -- callers get the full per-relay outcome to display.
async function publishWithQuorum(pool, event, relayUrls, opts) {
  opts = opts || {};
  const relays = relayUrls && relayUrls.length ? relayUrls : DEFAULT_RELAYS;
  const quorum = opts.quorum || Math.min(2, relays.length);
  const maxWait = opts.maxWait || DEFAULT_PUBLISH_TIMEOUT_MS;

  const attempts = pool.publish(relays, event, { maxWait });
  const results = await Promise.allSettled(attempts);

  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') succeeded.push(relays[i]);
    else failed.push({ url: relays[i], reason: r.reason && r.reason.message ? r.reason.message : String(r.reason) });
  });

  return {
    ok: succeeded.length >= quorum,
    quorum,
    succeeded,
    failed,
  };
}

// Reads the CURRENT version of an addressable/parameterized-replaceable
// event (kind 30000-39999) -- e.g. an issuer's cancellation list (30300)
// or relay list (10002). Queries all given relays and returns the one with
// the highest created_at, since not every relay is guaranteed to have
// caught up to the latest publish.
async function fetchLatestAddressable(pool, relayUrls, { pubkey, kind, dTag }, opts) {
  opts = opts || {};
  const relays = relayUrls && relayUrls.length ? relayUrls : DEFAULT_RELAYS;
  const filter = { kinds: [kind], authors: [pubkey] };
  if (dTag) filter['#d'] = [dTag];

  const events = await pool.querySync(relays, filter, { maxWait: opts.maxWait || DEFAULT_QUERY_TIMEOUT_MS });
  if (!events.length) return null;
  return events.reduce((latest, e) => (e.created_at > latest.created_at ? e : latest));
}

module.exports = { DEFAULT_RELAYS, createPool, publishWithQuorum, fetchLatestAddressable };
