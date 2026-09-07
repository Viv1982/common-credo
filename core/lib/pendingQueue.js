'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// D8's 72-hour delayed-visibility window (Spec Part IV.2), enforced here,
// at the publisher, as a local file -- not by publishing immediately with
// a future "effective_at" tag a verifier is trusted to honor. See the
// plan file's reasoning: D8's dispute-flag fix exists specifically because
// the old design let an issuer control the one channel a verifier trusts;
// making the 72h guarantee depend on downstream verifier cooperation on a
// permissionless protocol would silently reintroduce that same flaw.
//
// Pure local state -- no network calls in this module. lib/cancellationList.js
// is responsible for actually publishing promoted entries.

const fs = require('fs');
const path = require('path');

const DEFAULT_WINDOW_HOURS = 72;

function queuePath(dataDir) {
  return path.join(dataDir, 'pending-cancellations.json');
}

function loadQueue(dataDir) {
  const p = queuePath(dataDir);
  if (!fs.existsSync(p)) return { entries: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveQueue(dataDir, queue) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(queuePath(dataDir), JSON.stringify(queue, null, 2));
}

// Adds a cancellation to the pending queue. `cancelledBy` is 'issuer' for
// an issuer-initiated cancellation, or 'holder' for a countersigned
// holder request (Spec D5 -- the residual gap documented in
// toolkit/GAPS.md Gap 3; the same 72h window is applied uniformly to both,
// a judgment call named in the plan file, not settled by the Spec).
function enqueueCancellation(dataDir, { recordId, reason, cancelledBy }, windowHours) {
  if (!recordId) throw new Error('recordId is required');
  if (!reason) throw new Error('a cancellation must state a reason (Spec Part IV.1)');
  if (!['issuer', 'holder'].includes(cancelledBy)) throw new Error('cancelledBy must be "issuer" or "holder"');

  const hours = windowHours || DEFAULT_WINDOW_HOURS;
  const requestedAt = new Date();
  const effectiveAt = new Date(requestedAt.getTime() + hours * 60 * 60 * 1000);

  const queue = loadQueue(dataDir);
  const existing = queue.entries.find((e) => e.recordId === recordId);
  if (existing) throw new Error(`record ${recordId} already has a pending cancellation`);

  const entry = {
    recordId,
    reason,
    cancelledBy,
    requestedAt: requestedAt.toISOString(),
    effectiveAt: effectiveAt.toISOString(),
  };
  queue.entries.push(entry);
  saveQueue(dataDir, queue);
  return entry;
}

// Entries whose window has elapsed as of `now` -- ready to be promoted
// into the published cancellation list.
function promotableEntries(dataDir, now) {
  const queue = loadQueue(dataDir);
  const cutoff = (now || new Date()).getTime();
  return queue.entries.filter((e) => new Date(e.effectiveAt).getTime() <= cutoff);
}

function removeFromQueue(dataDir, recordIds) {
  const ids = new Set(recordIds);
  const queue = loadQueue(dataDir);
  queue.entries = queue.entries.filter((e) => !ids.has(e.recordId));
  saveQueue(dataDir, queue);
  return queue;
}

module.exports = { DEFAULT_WINDOW_HOURS, queuePath, loadQueue, saveQueue, enqueueCancellation, promotableEntries, removeFromQueue };
