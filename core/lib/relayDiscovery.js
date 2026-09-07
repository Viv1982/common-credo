'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// NIP-65 (kind 10002) -- an existing, standard Nostr mechanism for "where
// do I currently publish," reused as-is rather than reinvented. A record's
// revocationPointer never stores a fixed relay URL (see NOSTR-KINDS.md);
// a verifier resolves an issuer's CURRENT relays via this event instead,
// so an issuer can change relay providers without invalidating every
// record it has ever sealed.

const { finalizeEvent } = require('nostr-tools/pure');
const { fetchLatestAddressable, publishWithQuorum } = require('./relay');

const RELAY_LIST_KIND = 10002;

function buildRelayListEvent(relayUrls, secretKey) {
  const template = {
    kind: RELAY_LIST_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: relayUrls.map((url) => ['r', url]), // no marker = both read and write
    content: '',
  };
  return finalizeEvent(template, secretKey);
}

// Bootstrapping note: to discover an issuer's relay list, a verifier needs
// SOME relay to ask first. v1 keeps this simple -- the 10002 event is
// published to the same default relay set as everything else, not a
// separate indexer tier. A real deployment may want well-known discovery
// relays; documented as a v1.1 concern, not solved here.
async function publishRelayList(pool, secretKey, relayUrls, publishTargets) {
  const event = buildRelayListEvent(relayUrls, secretKey);
  const result = await publishWithQuorum(pool, event, publishTargets || relayUrls);
  return { event, publishResult: result };
}

async function fetchRelayList(pool, pubkey, discoveryRelays) {
  const event = await fetchLatestAddressable(pool, discoveryRelays, { pubkey, kind: RELAY_LIST_KIND });
  if (!event) return null;
  return parseRelayListEvent(event);
}

function parseRelayListEvent(event) {
  return event.tags.filter((t) => t[0] === 'r').map((t) => t[1]);
}

module.exports = { RELAY_LIST_KIND, buildRelayListEvent, publishRelayList, fetchRelayList, parseRelayListEvent };
