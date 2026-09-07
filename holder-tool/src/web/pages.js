'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const { escapeHtml } = require('./layout');

// ---------------------------------------------------------------- onboarding

function onboardingIntro() {
  return `
  <div class="card">
    <h1>Set up your wallet</h1>
    <p>This creates your own signing identity -- separate from any co-op or
    lender's records about you. It's what lets you show your records to
    anyone, and what lets you dispute or withdraw a record with no one
    else's permission needed.</p>
    <p><strong>There is no password reset and no account recovery.</strong>
    Common Credo has no central party who could restore access for you --
    that is the whole point of how it's built. If this key is lost, you
    lose the ability to dispute or withdraw records independently (your
    imported records themselves are just files and are safe separately).
    You will be shown a backup phrase on the next screen and asked to
    confirm you've saved it before anything is created for real.</p>
    <form method="POST" action="/onboarding/generate">
      <button type="submit">Generate my key</button>
    </form>
  </div>`;
}

function onboardingBackup({ nsec, npub }) {
  return `
  <div class="card">
    <h1>Back up your key</h1>
    <div class="warning-box">
      Write these down or store them in a password manager NOW. They will
      never be shown again by this tool. Anyone who has your secret key can
      dispute or withdraw records as you -- keep it as carefully as your
      most important password.
    </div>
    <label>Your public identity (safe to share -- this is what you show verifiers)</label>
    <p class="mono">${escapeHtml(npub)}</p>
    <label>Your secret key (never share this)</label>
    <p class="mono">${escapeHtml(nsec)}</p>

    <form method="POST" action="/onboarding/complete">
      <div class="checkbox-row">
        <input type="checkbox" name="confirmedBackup" required id="confirmedBackup">
        <label for="confirmedBackup" style="margin:0;">I have saved the secret key above somewhere safe</label>
      </div>

      <h2 style="margin-top:24px;">Set a password</h2>
      <p>Encrypts your key at rest on this device. You'll need it every
      time you (re)open this tool.</p>
      <label>Password</label>
      <input type="password" name="password" required minlength="8">
      <label>Confirm password</label>
      <input type="password" name="passwordConfirm" required minlength="8">

      <button type="submit">Finish setup</button>
    </form>
  </div>`;
}

// -------------------------------------------------------------------- unlock

function unlockPage() {
  return `
  <div class="card">
    <h1>Unlock</h1>
    <p>Enter the password you set when you set up your wallet.</p>
    <form method="POST" action="/unlock">
      <label>Password</label>
      <input type="password" name="password" required autofocus>
      <button type="submit">Unlock</button>
    </form>
  </div>`;
}

// ---------------------------------------------------------------------- wallet

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

function walletPage({ profile, records }) {
  const rows = records.map(({ record, content, verification }) => {
    const overall = verification.overall;
    const check2 = verification.check2;
    let detail = '';
    if (overall === 'cancelled' && check2.cancellation) {
      detail = `<div style="font-size:12.5px; color:var(--muted); margin-top:4px;">Reason: ${escapeHtml(check2.cancellation.reason)}</div>`;
      if (check2.dispute) detail += `<div style="font-size:12.5px; color:var(--muted);">Your dispute: ${escapeHtml(check2.dispute.category)} -- ${escapeHtml(check2.dispute.detail || '')}</div>`;
    }
    if (overall === 'withdrawn_by_holder' && check2.withdrawal) {
      detail = `<div style="font-size:12.5px; color:var(--muted); margin-top:4px;">Your reason: ${escapeHtml(check2.withdrawal.reason)}</div>`;
    }

    const actions = [];
    if (overall === 'cancelled' && !check2.dispute) {
      actions.push(`<a class="btn secondary" style="margin-top:6px; padding:4px 10px; font-size:12px;" href="/disputes/new?recordId=${encodeURIComponent(record.id)}">Dispute</a>`);
    }
    if (overall !== 'withdrawn_by_holder') {
      actions.push(`<a class="btn secondary" style="margin-top:6px; padding:4px 10px; font-size:12px;" href="/withdrawals/new?recordId=${encodeURIComponent(record.id)}">Withdraw</a>`);
    }

    return `<tr>
      <td class="mono">${escapeHtml(record.id.slice(0, 12))}...</td>
      <td>${escapeHtml(content.claim.claimType)}</td>
      <td>${escapeHtml(content.issuer.name)}</td>
      <td>${statusBadge(overall)}${detail}</td>
      <td>${actions.join(' ')}</td>
    </tr>`;
  }).join('');

  return `
  <div class="card">
    <h1>My wallet</h1>
    <p>Public identity: <span class="mono">${escapeHtml(profile.npub)}</span></p>
  </div>
  <div class="card">
    <h2>My records</h2>
    <table>
      <tr><th>ID</th><th>Claim</th><th>Issuer</th><th>Status</th><th></th></tr>
      ${rows || '<tr><td colspan="5">No records yet -- <a href="/records/import">import one</a>.</td></tr>'}
    </table>
  </div>`;
}

// -------------------------------------------------------------- import a record

function importRecordForm() {
  return `
  <div class="card">
    <h1>Import a record</h1>
    <p>Choose the record file your issuer gave you (a small .json file).
    It's checked here before anything is added to your wallet -- a
    corrupted or tampered file will be rejected.</p>
    <form method="POST" action="/records/import" enctype="multipart/form-data">
      <label>Record file</label>
      <input type="file" name="recordFile" accept=".json,application/json" required>
      <button type="submit">Import</button>
    </form>
  </div>`;
}

// -------------------------------------------------------------------- bundle

function bundleBuilderPage({ records }) {
  const rows = records.map((r) => `
    <div class="checkbox-row">
      <input type="checkbox" name="recordIds" value="${escapeHtml(r.recordId)}" id="rec-${escapeHtml(r.recordId)}">
      <label for="rec-${escapeHtml(r.recordId)}" style="margin:0; font-weight:400;">
        ${escapeHtml(r.claimType)} -- ${escapeHtml(r.issuer)} (${escapeHtml(r.issuedAt.slice(0, 10))})
        <span style="color:var(--muted); font-size:12px;">
          &nbsp;or <label style="display:inline; font-weight:400;">
            <input type="checkbox" name="forceShowRecordIds" value="${escapeHtml(r.recordId)}" style="width:auto;"> show even if lapsed
          </label>
        </span>
      </label>
    </div>`).join('');

  return `
  <div class="card">
    <h1>Show a bundle</h1>
    <p>Pick which records to show. Old, negative records are hidden by
    default (they fade after a few years) -- you can still choose to show
    one if you want to tell the fuller story.</p>
    <form method="POST" action="/bundle/export">
      ${rows || '<p>No records yet -- <a href="/records/import">import one first</a>.</p>'}
      ${records.length ? '<button type="submit">Build bundle</button>' : ''}
    </form>
  </div>`;
}

function bundleExportedPage({ standing, fileName }) {
  return `
  <div class="card">
    <h1>Bundle ready</h1>
    <p>Facts only -- no score. Whoever you show this to decides how to weigh it.</p>
    <table>
      <tr><td>Records included</td><td>${standing.summary.shownInStandard}</td></tr>
      <tr><td>Positive</td><td>${standing.summary.positive}</td></tr>
      <tr><td>Negative</td><td>${standing.summary.negative}</td></tr>
      <tr><td>Cancelled</td><td>${standing.summary.cancelled}</td></tr>
      <tr><td>Withdrawn</td><td>${standing.summary.withdrawn}</td></tr>
    </table>
    <a class="btn" href="/bundle/download/${encodeURIComponent(fileName)}">Download bundle file</a>
    <a class="btn secondary" href="/wallet">Back to wallet</a>
  </div>`;
}

// ------------------------------------------------------------------ disputes

function disputeForm({ record, content, cancellation }) {
  return `
  <div class="card">
    <h1>File a dispute</h1>
    <p><strong>${escapeHtml(content.claim.claimType)}</strong> from ${escapeHtml(content.issuer.name)}
    was cancelled. Reason given: "${escapeHtml(cancellation.reason)}"</p>
    <p>Your dispute is published where only you control it -- the issuer
    cannot see it in advance or suppress it. It travels alongside the
    cancellation for every future verifier, permanently.</p>
    <form method="POST" action="/disputes/${encodeURIComponent(record.id)}">
      <label>Category</label>
      <select name="category" required>
        <option value="cancellation_factually_wrong">The cancellation is factually wrong</option>
        <option value="cancellation_retaliatory">This is retaliatory, unrelated to the facts</option>
        <option value="record_never_authorised">I never authorised this record</option>
      </select>
      <label>Tell your side</label>
      <textarea name="detail" required></textarea>
      <button type="submit">Publish dispute</button>
    </form>
  </div>`;
}

// --------------------------------------------------------------- withdrawals

function withdrawalForm({ record, content }) {
  return `
  <div class="card">
    <h1>Withdraw this record</h1>
    <p><strong>${escapeHtml(content.claim.claimType)}</strong> from ${escapeHtml(content.issuer.name)}</p>
    <div class="warning-box">
      This is permanent and public. Any verifier who checks this record
      afterwards will see "withdrawn by holder" -- with no issuer action
      needed, no one else's permission required. This does not delete the
      record from your device; you can still choose to show it again
      later if you want to.
    </div>
    <form method="POST" action="/withdrawals/${encodeURIComponent(record.id)}">
      <label>Reason</label>
      <textarea name="reason" required placeholder="e.g. phone stolen, or simply: I no longer wish to show this"></textarea>
      <div class="checkbox-row">
        <input type="checkbox" name="confirmedPermanent" required id="confirmedPermanent">
        <label for="confirmedPermanent" style="margin:0;">I understand this is permanent and public</label>
      </div>
      <button type="submit">Withdraw</button>
    </form>
  </div>`;
}

module.exports = {
  onboardingIntro, onboardingBackup, unlockPage,
  walletPage, importRecordForm,
  bundleBuilderPage, bundleExportedPage,
  disputeForm, withdrawalForm,
};
