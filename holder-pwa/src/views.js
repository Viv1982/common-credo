'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Phone-first screens as pure HTML-string builders -- no DOM, no state, so
// they are trivial to reason about and app.js owns all wiring. The copy is
// carried over from the tested desktop tool (holder-tool/src/web/pages.js);
// the layout is rebuilt for a phone: one column, big tap targets, records as
// stacked blocks rather than a wide table.

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function flash(msg, kind) {
  if (!msg) return '';
  return `<div class="flash ${kind === 'error' ? 'error' : 'success'}">${escapeHtml(msg)}</div>`;
}

function shell(bodyHtml, { nav } = {}) {
  const navHtml = nav ? `
    <nav class="nav">
      <a href="#/wallet">Wallet</a>
      <a href="#/import">Import</a>
      <a href="#/bundle">Show</a>
      <a href="#/lock" data-action="lock">Lock</a>
    </nav>` : '';
  return `<header class="app-header">Common Credo wallet</header>${navHtml}<main class="screen">${bodyHtml}</main>`;
}

// ---------------------------------------------------------------- onboarding

function onboardingIntro() {
  return `
  <div class="card">
    <h1>Set up your wallet</h1>
    <p>This creates your own signing identity, separate from any co-op or
    lender's records about you. It is what lets you show your records to
    anyone, and dispute or withdraw a record with no one else's permission.</p>
    <p><strong>There is no password reset and no account recovery.</strong>
    Common Credo has no central party who could restore access for you. If
    this key is lost, you lose the ability to dispute or withdraw records
    independently (your imported records themselves are just files and are
    safe separately). The next screen shows a backup you must save before
    anything is created.</p>
    <button class="btn" data-action="generate-key">Generate my key</button>
    <p class="muted small" style="margin-top:14px;">Already set up Common Credo on
    another phone or computer? <a href="#/restore">Restore from your key file</a>.</p>
  </div>`;
}

function restore() {
  return `
  <div class="card">
    <h1>Restore from a key file</h1>
    <p>Choose the key file you exported from another device and enter its
    password. This brings your identity back here. Your records are separate
    files &mdash; import them again afterwards.</p>
    <label>Key file (.json)</label>
    <input type="file" id="key-file" accept=".json,application/json">
    <label>Password</label>
    <input type="password" id="restore-password" autocomplete="current-password">
    <button class="btn" data-action="restore">Restore</button>
    <a class="btn btn-secondary" href="#/onboarding">Back</a>
  </div>`;
}

function onboardingBackup({ nsec, npub }) {
  return `
  <div class="card">
    <h1>Back up your key</h1>
    <div class="warning">
      Save these now. The secret key will never be shown again. Anyone who
      has it can act as you. Best of all: after saving the password below,
      use "Export key file" from your wallet to keep an encrypted copy in
      your phone's Files &mdash; that copy survives even if this app's data
      is cleared.
    </div>
    <label>Your public identity (safe to share &mdash; this is what verifiers see)</label>
    <div class="backup" id="npub-val">${escapeHtml(npub)}</div>
    <button class="btn btn-secondary" data-action="copy" data-copy="npub-val" type="button">Copy public key</button>
    <label>Your secret key (never share this)</label>
    <div class="backup" id="nsec-val">${escapeHtml(nsec)}</div>
    <button class="btn btn-secondary" data-action="copy" data-copy="nsec-val" type="button">Copy secret key</button>

    <form data-action="complete-onboarding">
      <label class="check">
        <input type="checkbox" name="confirmedBackup" required>
        I have saved the secret key above somewhere safe
      </label>
      <h2>Set a password</h2>
      <p class="muted">Encrypts your key on this device. You will need it each
      time you open the wallet.</p>
      <label>Password</label>
      <input type="password" name="password" required minlength="8" autocomplete="new-password">
      <label>Confirm password</label>
      <input type="password" name="passwordConfirm" required minlength="8" autocomplete="new-password">
      <button class="btn" type="submit">Finish setup</button>
    </form>
  </div>`;
}

function unlock() {
  return `
  <div class="card">
    <h1>Unlock</h1>
    <p class="muted">Enter the password you set when you set up your wallet.</p>
    <form data-action="unlock">
      <label>Password</label>
      <input type="password" name="password" required autofocus autocomplete="current-password">
      <button class="btn" type="submit">Unlock</button>
    </form>
  </div>`;
}

// -------------------------------------------------------------------- wallet

function statusBadge(overall) {
  const map = {
    valid: ['Genuine & valid', 'good'],
    cancelled: ['Cancelled by issuer', 'bad'],
    withdrawn_by_holder: ['Withdrawn by you', 'bad'],
    unverifiable: ['Unverifiable', 'warn'],
    not_genuine: ['Not genuine', 'bad'],
  };
  const [label, tone] = map[overall] || [overall, 'warn'];
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function recordBlock({ record, content, verification }) {
  const overall = verification.overall;
  const check2 = verification.check2;
  let detail = '';
  if (overall === 'cancelled' && check2.cancellation) {
    detail = `<div class="muted small">Reason: ${escapeHtml(check2.cancellation.reason)}</div>`;
    if (check2.dispute) detail += `<div class="muted small">Your dispute: ${escapeHtml(check2.dispute.category)} &mdash; ${escapeHtml(check2.dispute.detail || '')}</div>`;
  }
  if (overall === 'withdrawn_by_holder' && check2.withdrawal) {
    detail = `<div class="muted small">Your reason: ${escapeHtml(check2.withdrawal.reason)}</div>`;
  }

  const actions = [];
  if (overall === 'cancelled' && !check2.dispute) {
    actions.push(`<a class="btn btn-secondary btn-small" href="#/dispute/${encodeURIComponent(record.id)}">Dispute</a>`);
  }
  if (overall !== 'withdrawn_by_holder') {
    actions.push(`<a class="btn btn-secondary btn-small" href="#/withdraw/${encodeURIComponent(record.id)}">Withdraw</a>`);
  }

  return `
  <div class="record">
    <div class="record-claim">${escapeHtml(content.claim.claimType.replace(/_/g, ' '))}</div>
    <div class="muted small">${escapeHtml(content.issuer.name)}</div>
    <div class="record-status">${statusBadge(overall)}</div>
    ${detail}
    ${actions.length ? `<div class="record-actions">${actions.join(' ')}</div>` : ''}
  </div>`;
}

function keyCard({ persisted, exported }) {
  const storageLine = persisted
    ? 'Storage on this device is marked persistent &mdash; the phone should not clear it on its own.'
    : 'This phone may clear the app\'s data if it runs low on space, so keep an exported copy.';
  const remind = !exported
    ? `<div class="warning">Back up your key now. You have not exported it yet &mdash; if this
       app's data is cleared, your identity cannot be recovered. Records are separate files
       and can be re-imported; the key cannot.</div>`
    : '';
  return `
  <div class="card">
    <h2>Your key &amp; backup</h2>
    ${remind}
    <p class="muted small">${storageLine}</p>
    <p class="small">Export an encrypted copy of your key to your phone's Files. It is protected
    by your password, works on any device, and is the only way to recover your identity if this
    app's data is lost.</p>
    <button class="btn btn-secondary" data-action="export-key">Export key file</button>
  </div>`;
}

function wallet({ profile, rows, keyStatus }) {
  const list = rows.length
    ? rows.map(recordBlock).join('')
    : `<div class="card"><p>No records yet.</p><a class="btn" href="#/import">Import a record</a></div>`;
  return `
  <div class="card">
    <h1>My wallet</h1>
    <div class="muted small">Public identity</div>
    <div class="backup">${escapeHtml(profile.npub)}</div>
    <div class="row-buttons">
      <a class="btn" href="#/import">Import a record</a>
      <a class="btn btn-secondary" href="#/bundle">Show a bundle</a>
    </div>
  </div>
  ${keyStatus ? keyCard(keyStatus) : ''}
  ${list}`;
}

// ------------------------------------------------------------- import a record

function importRecord() {
  return `
  <div class="card">
    <h1>Import a record</h1>
    <p>Add the record an issuer gave you. It is checked before anything is
    saved &mdash; a corrupted or tampered file is rejected.</p>
    <label>Choose a record file (.json)</label>
    <input type="file" id="record-file" accept=".json,application/json">
    <p class="muted small">Or paste the record's text:</p>
    <textarea id="record-paste" rows="5" placeholder='{"kind":3388, ...}'></textarea>
    <button class="btn" data-action="import-record">Import</button>
    <a class="btn btn-secondary" href="#/wallet">Cancel</a>
  </div>`;
}

// -------------------------------------------------------------------- dispute

function dispute({ record, content, cancellation }) {
  return `
  <div class="card">
    <h1>File a dispute</h1>
    <p><strong>${escapeHtml(content.claim.claimType.replace(/_/g, ' '))}</strong> from
    ${escapeHtml(content.issuer.name)} was cancelled. Reason given:
    "${escapeHtml(cancellation.reason)}"</p>
    <p class="muted">Your dispute is published where only you control it &mdash; the
    issuer cannot see it in advance or suppress it. It travels alongside the
    cancellation for every future verifier, permanently.</p>
    <form data-action="file-dispute" data-record-id="${escapeHtml(record.id)}">
      <label>Category</label>
      <select name="category" required>
        <option value="cancellation_factually_wrong">The cancellation is factually wrong</option>
        <option value="cancellation_retaliatory">This is retaliatory, unrelated to the facts</option>
        <option value="record_never_authorised">I never authorised this record</option>
      </select>
      <label>Tell your side</label>
      <textarea name="detail" rows="4" required></textarea>
      <button class="btn" type="submit">Publish dispute</button>
      <a class="btn btn-secondary" href="#/wallet">Cancel</a>
    </form>
  </div>`;
}

// ----------------------------------------------------------------- withdrawal

function withdraw({ record, content }) {
  return `
  <div class="card">
    <h1>Withdraw this record</h1>
    <p><strong>${escapeHtml(content.claim.claimType.replace(/_/g, ' '))}</strong> from
    ${escapeHtml(content.issuer.name)}</p>
    <div class="warning">
      This is permanent and public. Any verifier who checks this record
      afterwards sees "withdrawn by holder" &mdash; no issuer action needed, no
      one else's permission required. It does not delete the record from your
      device; you can still choose to show it again later.
    </div>
    <form data-action="withdraw" data-record-id="${escapeHtml(record.id)}">
      <label>Reason</label>
      <textarea name="reason" rows="3" required placeholder="e.g. phone stolen, or simply: I no longer wish to show this"></textarea>
      <label class="check">
        <input type="checkbox" name="confirmedPermanent" required>
        I understand this is permanent and public
      </label>
      <button class="btn" type="submit">Withdraw</button>
      <a class="btn btn-secondary" href="#/wallet">Cancel</a>
    </form>
  </div>`;
}

// -------------------------------------------------------------------- bundle

function bundleBuilder({ records }) {
  const rows = records.map((r) => `
    <label class="check record-pick">
      <input type="checkbox" name="recordIds" value="${escapeHtml(r.recordId)}">
      <span>${escapeHtml((r.claimType || '').replace(/_/g, ' '))} &mdash; ${escapeHtml(r.issuer || '')}
      <span class="muted small">(${escapeHtml((r.issuedAt || '').slice(0, 10))})</span></span>
    </label>`).join('');

  return `
  <div class="card">
    <h1>Show a bundle</h1>
    <p>Pick which records to show. Whoever you show it to checks each one and
    decides how to weigh it &mdash; there is no score.</p>
    <form data-action="build-bundle">
      ${rows || '<p>No records yet.</p>'}
      ${records.length ? '<button class="btn" type="submit">Build bundle</button>' : '<a class="btn" href="#/import">Import a record first</a>'}
      <a class="btn btn-secondary" href="#/wallet">Back</a>
    </form>
  </div>`;
}

function bundleReady({ standing }) {
  const s = standing.summary;
  return `
  <div class="card">
    <h1>Bundle ready</h1>
    <p>Facts only &mdash; no score. Whoever you show this to decides how to weigh it.</p>
    <table>
      <tr><td>Records included</td><td>${s.shownInStandard}</td></tr>
      <tr><td>Positive</td><td>${s.positive}</td></tr>
      <tr><td>Negative</td><td>${s.negative}</td></tr>
      <tr><td>Cancelled</td><td>${s.cancelled}</td></tr>
      <tr><td>Withdrawn</td><td>${s.withdrawn}</td></tr>
    </table>
    <button class="btn" data-action="share-bundle">Share bundle</button>
    <button class="btn btn-secondary" data-action="download-bundle">Download file</button>
    <a class="btn btn-secondary" href="#/wallet">Back to wallet</a>
  </div>`;
}

module.exports = {
  escapeHtml, flash, shell,
  onboardingIntro, onboardingBackup, unlock, restore,
  wallet, importRecord, dispute, withdraw,
  bundleBuilder, bundleReady,
};
