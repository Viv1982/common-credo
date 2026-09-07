'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pendingQueue = require('common-credo-core/lib/pendingQueue');

function tmpDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cc-pendingqueue-'));
}

test('enqueueCancellation computes effectiveAt as requestedAt + window', () => {
  const dir = tmpDataDir();
  const before = Date.now();
  const entry = pendingQueue.enqueueCancellation(dir, { recordId: 'r1', reason: 'fraud', cancelledBy: 'issuer' }, 72);
  const requestedMs = new Date(entry.requestedAt).getTime();
  const effectiveMs = new Date(entry.effectiveAt).getTime();
  assert.ok(requestedMs >= before);
  assert.equal(effectiveMs - requestedMs, 72 * 60 * 60 * 1000);
});

test('rejects missing reason (Spec Part IV.1)', () => {
  const dir = tmpDataDir();
  assert.throws(() => pendingQueue.enqueueCancellation(dir, { recordId: 'r1', cancelledBy: 'issuer' }), /reason/);
});

test('rejects an invalid cancelledBy value', () => {
  const dir = tmpDataDir();
  assert.throws(
    () => pendingQueue.enqueueCancellation(dir, { recordId: 'r1', reason: 'x', cancelledBy: 'nobody' }),
    /cancelledBy must be/
  );
});

test('rejects a duplicate pending cancellation for the same record', () => {
  const dir = tmpDataDir();
  pendingQueue.enqueueCancellation(dir, { recordId: 'r1', reason: 'x', cancelledBy: 'issuer' });
  assert.throws(
    () => pendingQueue.enqueueCancellation(dir, { recordId: 'r1', reason: 'y', cancelledBy: 'holder' }),
    /already has a pending cancellation/
  );
});

test('promotableEntries excludes entries before their window and includes entries after', () => {
  const dir = tmpDataDir();
  pendingQueue.enqueueCancellation(dir, { recordId: 'early', reason: 'x', cancelledBy: 'issuer' }, 72);

  const notYet = pendingQueue.promotableEntries(dir, new Date(Date.now() + 71 * 3600 * 1000));
  assert.equal(notYet.length, 0);

  const now = pendingQueue.promotableEntries(dir, new Date(Date.now() + 73 * 3600 * 1000));
  assert.equal(now.length, 1);
  assert.equal(now[0].recordId, 'early');
});

test('removeFromQueue removes only the specified records', () => {
  const dir = tmpDataDir();
  pendingQueue.enqueueCancellation(dir, { recordId: 'r1', reason: 'a', cancelledBy: 'issuer' });
  pendingQueue.enqueueCancellation(dir, { recordId: 'r2', reason: 'b', cancelledBy: 'issuer' });

  pendingQueue.removeFromQueue(dir, ['r1']);
  const remaining = pendingQueue.loadQueue(dir);
  assert.equal(remaining.entries.length, 1);
  assert.equal(remaining.entries[0].recordId, 'r2');
});

test('loadQueue on a fresh directory returns an empty entries array, not an error', () => {
  const dir = tmpDataDir();
  assert.deepEqual(pendingQueue.loadQueue(dir), { entries: [] });
});
