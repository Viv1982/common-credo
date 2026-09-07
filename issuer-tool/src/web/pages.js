'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const { escapeHtml } = require('./layout');
const { ISSUER_ANCHOR_LADDER } = require('common-credo-core/lib/anchor');
const { CORE_CLAIM_TYPES, HOLDER_IDENTITY_ANCHOR_TYPES, VOUCH_TYPES } = require('common-credo-core/lib/claimTypes');

// ---------------------------------------------------------------- onboarding

function onboardingIntro() {
  return `
  <div class="card">
    <h1>Set up this issuer</h1>
    <p>This creates a signing identity for your organisation and publishes an
    empty, signed cancellation noticeboard -- both in one step, as the
    standard requires (records can't be valid without a place to check them
    against).</p>
    <p><strong>There is no password reset and no account recovery.</strong>
    Common Credo has no central party who could restore access for you --
    that is the whole point of how it's built. If the signing key is lost,
    this issuer's entire track record and cancellation authority is gone
    permanently. You will be shown a backup phrase on the next screen and
    asked to confirm you've saved it before anything is created for real.</p>
    <form method="POST" action="/onboarding/generate">
      <button type="submit">Generate signing key</button>
    </form>
  </div>`;
}

function onboardingBackup({ nsec, npub }) {
  const anchorOptions = ISSUER_ANCHOR_LADDER.map(
    (a) => `<option value="${a.id}">Rung ${a.rung} -- ${escapeHtml(a.label)}</option>`
  ).join('');

  return `
  <div class="card">
    <h1>Back up your signing key</h1>
    <div class="warning-box">
      Write these down or store them in a password manager NOW. They will
      never be shown again by this tool. Anyone who has your secret key can
      sign records and cancellations as your organisation -- keep it as
      carefully as a bank signing authority, because that is what it is.
    </div>
    <label>Public identity (safe to share -- this is what verifiers will see)</label>
    <p class="mono">${escapeHtml(npub)}</p>
    <label>Secret key (never share this)</label>
    <p class="mono">${escapeHtml(nsec)}</p>

    <form method="POST" action="/onboarding/complete">
      <label><input type="checkbox" name="confirmedBackup" required style="width:auto; margin-right:8px;">
        I have saved the secret key above somewhere safe</label>

      <h2 style="margin-top:24px;">Issuer profile</h2>
      <label>Organisation name</label>
      <input name="name" required>
      <label>Organisation type</label>
      <input name="orgType" required placeholder="cooperative, chamber of commerce, MFI, NGO...">
      <label>Location</label>
      <input name="location" required placeholder="City, Country">

      <h2 style="margin-top:24px;">Issuer identity anchor (Spec D7)</h2>
      <p>An external, publicly checkable identifier that establishes your
      organisation as real and accountable. CC does not verify this itself --
      a verifier checks it against your jurisdiction's own public registry.
      Pick the strongest one your organisation genuinely has.</p>
      <label>Anchor type</label>
      <select name="anchorType" required>${anchorOptions}</select>
      <label>Country</label>
      <input name="anchorCountry" required placeholder="KE, NG, BD...">
      <label>Anchor value (the registration/account/address identifier itself)</label>
      <input name="anchorValue" required>

      <h2 style="margin-top:24px;">Set a password</h2>
      <p>Encrypts the signing key at rest on this machine. You'll need it
      every time you (re)start this tool.</p>
      <label>Password</label>
      <input type="password" name="password" required minlength="8">
      <label>Confirm password</label>
      <input type="password" name="passwordConfirm" required minlength="8">

      <button type="submit">Complete setup and publish noticeboard</button>
    </form>
  </div>`;
}

// -------------------------------------------------------------------- unlock

function unlockPage() {
  return `
  <div class="card">
    <h1>Unlock</h1>
    <p>Enter the password you set during onboarding to decrypt the signing key for this session.</p>
    <form method="POST" action="/unlock">
      <label>Password</label>
      <input type="password" name="password" required autofocus>
      <button type="submit">Unlock</button>
    </form>
  </div>`;
}

// ---------------------------------------------------------------- dashboard

function dashboardPage({ profile, recordCount, pendingCount, listStatus }) {
  return `
  <div class="card">
    <h1>${escapeHtml(profile.name)}</h1>
    <p>${escapeHtml(profile.orgType)} -- ${escapeHtml(profile.location)}</p>
    <p>Public identity: <span class="mono">${escapeHtml(profile.publicKey)}</span></p>
  </div>
  <div class="card">
    <h2>Status</h2>
    <table>
      <tr><td>Records issued</td><td>${recordCount}</td></tr>
      <tr><td>Pending cancellations (in the 72h window)</td><td>${pendingCount}</td></tr>
      <tr><td>Cancellation noticeboard</td><td>${listStatus}</td></tr>
    </table>
    <form method="POST" action="/cancellations/run-scheduler" style="display:inline;">
      <button type="submit" class="secondary">Run scheduler now (promote due cancellations, re-stamp if aging)</button>
    </form>
  </div>`;
}

// ------------------------------------------------------------------ records

function recordNewForm() {
  const claimOptions = Object.keys(CORE_CLAIM_TYPES).map((k) => `<option value="${k}">${k.replace(/_/g, ' ')}</option>`).join('')
    + `<option value="__extension__">Other (regional extension) -- specify below</option>`;
  const anchorOptions = HOLDER_IDENTITY_ANCHOR_TYPES.map((a) => `<option value="${a}">${a.replace(/_/g, ' ')}</option>`).join('');
  const vouchOptions = VOUCH_TYPES.map((v) => `<option value="${v}">${v.replace(/_/g, ' ')}</option>`).join('');

  return `
  <div class="card">
    <h1>Create a record</h1>
    <form method="POST" action="/records">
      <h2>Subject (the holder)</h2>
      <label>Reference (name or business name)</label>
      <input name="subjectReference" required>
      <label>Identity anchor type (Spec D1)</label>
      <select name="identityAnchorType" required>${anchorOptions}</select>
      <label>Identity anchor value</label>
      <input name="identityAnchorValue">
      <label>Holder's public key (optional -- only if she already has a Common Credo wallet)</label>
      <input name="holderPubkeyHex" placeholder="leave blank if she doesn't have one yet" class="mono">

      <h2 style="margin-top:20px;">The claim (Spec D2)</h2>
      <label>Claim type</label>
      <select name="claimType" required>${claimOptions}</select>
      <label>If "Other" -- name your regional extension claim type</label>
      <input name="extensionClaimType" placeholder="e.g. harambee_contribution_honoured">
      <label>Amount (if applicable)</label>
      <input name="amount" type="number" step="any">
      <label>Period</label>
      <input name="period" required placeholder="e.g. 2024-01 to 2026-01">
      <label>Outcome polarity</label>
      <select name="polarity" required><option value="positive">positive</option><option value="negative">negative</option><option value="neutral">neutral</option></select>
      <label>Outcome detail</label>
      <textarea name="outcomeDetail"></textarea>

      <h2 style="margin-top:20px;">Vouch (Spec Part II)</h2>
      <label>Vouch type</label>
      <select name="vouchType" required>${vouchOptions}</select>

      <h2 style="margin-top:20px;">Stake (Spec D3)</h2>
      <label>Stake type</label>
      <select name="stakeType" required onchange="document.getElementById('declaredProfileRow').style.display = this.value === 'none' ? 'block' : 'none'">
        <option value="financial">financial</option><option value="reputational">reputational</option><option value="none">none</option>
      </select>
      <label>Stake description</label>
      <input name="stakeDescription" placeholder="what you stand to lose if this vouch proves false">
      <div id="declaredProfileRow">
        <label>Declared profile (required if stake is "none" -- Spec D3)</label>
        <input name="declaredProfile" placeholder="e.g. NGO attesting a factual membership record, not a credit judgement">
      </div>

      <button type="submit">Seal record</button>
    </form>
  </div>`;
}

function recordCreatedPage({ record, exportPath }) {
  return `
  <div class="card">
    <h1>Record sealed</h1>
    <p>Structurally sealed and ready to hand to the holder. This record was
    NOT published anywhere -- only the holder's copy exists.</p>
    <table>
      <tr><td>Record ID (content hash)</td><td class="mono">${escapeHtml(record.id)}</td></tr>
      <tr><td>Exported to</td><td class="mono">${escapeHtml(exportPath)}</td></tr>
    </table>
    <a class="btn" href="/records/${encodeURIComponent(record.id)}/export">Download record file</a>
    <a class="btn secondary" href="/records">Back to records</a>
  </div>`;
}

function recordsListPage({ records }) {
  const rows = records.map((r) => `<tr>
    <td class="mono">${escapeHtml(r.recordId.slice(0, 12))}...</td>
    <td>${escapeHtml(r.claimType)}</td>
    <td>${escapeHtml(r.subjectReference)}</td>
    <td>${escapeHtml(r.issuedAt)}</td>
    <td>${r.cancellationStatus === 'none'
      ? `<form method="POST" action="/cancellations/${encodeURIComponent(r.recordId)}" style="margin:0;">
           <input type="text" name="reason" placeholder="reason" required style="width:140px; display:inline-block;">
           <button type="submit" style="margin-top:0; padding:6px 10px; font-size:12px;">Cancel</button>
         </form>`
      : `<span class="badge warn">${escapeHtml(r.cancellationStatus)}</span>`}
    </td>
    <td><a href="/records/${encodeURIComponent(r.recordId)}/export">download</a></td>
  </tr>`).join('');

  return `
  <div class="card">
    <h1>Records issued</h1>
    <table>
      <tr><th>ID</th><th>Claim</th><th>Subject</th><th>Issued</th><th>Cancellation</th><th></th></tr>
      ${rows || '<tr><td colspan="6">None yet.</td></tr>'}
    </table>
  </div>`;
}

// ------------------------------------------------------------ cancellations

function cancellationsPage({ pending, published }) {
  const pendingRows = pending.map((p) => `<tr>
    <td class="mono">${escapeHtml(p.recordId.slice(0, 12))}...</td>
    <td>${escapeHtml(p.cancelledBy)}</td>
    <td>${escapeHtml(p.reason)}</td>
    <td>${escapeHtml(p.effectiveAt)}</td>
  </tr>`).join('');

  // Note: no per-entry "disputed" column here. Under D8 a dispute lives at
  // an address only the HOLDER controls (kind 30301, see
  // core/lib/holderActions.js) -- it is no longer something the issuer's
  // own list can carry or this view can read cheaply. Showing the
  // issuer's own aggregate count of active disputes (Spec Part IV.7 --
  // "sees the issuer's count... not the disputants' identities") is a
  // legitimate future feature, not built here.
  const publishedRows = published.map((e) => `<tr>
    <td class="mono">${escapeHtml(e.recordId.slice(0, 12))}...</td>
    <td>${escapeHtml(e.cancelledBy)}</td>
    <td>${escapeHtml(e.reason)}</td>
  </tr>`).join('');

  return `
  <div class="card">
    <h2>Pending (in the 72h window -- not yet visible to verifiers)</h2>
    <table>
      <tr><th>Record</th><th>By</th><th>Reason</th><th>Visible from</th></tr>
      ${pendingRows || '<tr><td colspan="4">None.</td></tr>'}
    </table>
  </div>
  <div class="card">
    <h2>Published (visible to verifiers now)</h2>
    <table>
      <tr><th>Record</th><th>By</th><th>Reason</th></tr>
      ${publishedRows || '<tr><td colspan="3">None.</td></tr>'}
    </table>
    <form method="POST" action="/cancellations/run-scheduler">
      <button type="submit" class="secondary">Run scheduler now</button>
    </form>
  </div>`;
}

// --------------------------------------------------------- holder requests

function holderRequestsPage() {
  return `
  <div class="card">
    <h1>Holder cancellation requests</h1>
    <div class="warning-box">
      Spec v0.3 gives a holder the right to cancel any record about
      themselves (D5), but only your key can sign the one noticeboard a
      verifier checks. This is a known, documented gap (see
      toolkit/GAPS.md, Gap 3) -- until the hold-and-show app exists, a
      holder's cancellation only takes effect if you review and countersign
      it here. Verify the request came from the actual holder by whatever
      means you already trust (phone, in person) before submitting.
    </div>
    <form method="POST" action="/holder-requests">
      <label>Record ID</label>
      <input name="recordId" required class="mono">
      <label>Reason (from the holder)</label>
      <textarea name="reason" required></textarea>
      <label><input type="checkbox" name="notifiedHolder" required style="width:auto; margin-right:8px;">
        I have confirmed with the holder that this request is genuinely theirs</label>
      <button type="submit">Countersign and enqueue (72h window applies)</button>
    </form>
  </div>`;
}

module.exports = {
  onboardingIntro, onboardingBackup, unlockPage, dashboardPage,
  recordNewForm, recordCreatedPage, recordsListPage,
  cancellationsPage, holderRequestsPage,
};
