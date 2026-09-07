'use strict';

// Test-only in-memory stand-in for nostr-tools' SimplePool, implementing
// just the surface lib/relay.js uses (publish, querySync). Keeps unit
// tests fast and deterministic -- real relay behavior was verified live
// separately (see plan's "manual verification against real relays" step).

class FakePool {
  constructor({ failRelays } = {}) {
    this.events = [];
    this.failRelays = new Set(failRelays || []);
  }

  publish(relays, event) {
    this.events.push(event);
    return relays.map((url) =>
      this.failRelays.has(url) ? Promise.reject(new Error('relay down: ' + url)) : Promise.resolve(url)
    );
  }

  async querySync(relays, filter) {
    return this.events.filter((e) => matches(e, filter));
  }

  destroy() {}
}

function matches(event, filter) {
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter['#d']) {
    const dTags = event.tags.filter((t) => t[0] === 'd').map((t) => t[1]);
    if (!filter['#d'].some((d) => dTags.includes(d))) return false;
  }
  return true;
}

module.exports = { FakePool };
