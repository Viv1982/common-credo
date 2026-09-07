'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const { escapeHtml } = require('./layout');

function uploadForm() {
  return `
  <div class="card">
    <h1>Check a bundle</h1>
    <p>Choose the bundle file the person gave you (a small .json file
    exported from their Common Credo wallet). This checks it against the
    live public record -- takes about a second per record, needs an
    internet connection.</p>
    <form method="POST" action="/check" enctype="multipart/form-data">
      <label>Bundle file</label>
      <input type="file" name="bundleFile" accept=".json,application/json" required>
      <button type="submit">Check</button>
    </form>
  </div>`;
}

function statusBadge(overall) {
  const map = {
    valid: ['Genuine & valid', 'good'],
    cancelled: ['Cancelled by issuer', 'bad'],
    withdrawn_by_holder: ['Withdrawn by holder', 'bad'],
    unverifiable: ['Unverifiable', 'warn'],
    not_genuine: ['NOT GENUINE -- seal broken', 'bad'],
  };
  const [label, tone] = map[overall] || [overall, 'warn'];
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function formatAge(record) {
  const ms = Date.now() - record.created_at * 1000;
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return 'issued today';
  if (days < 60) return `issued ${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `issued ${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(days / 365.25 * 10) / 10;
  return `issued ${years} year${years === 1 ? '' : 's'} ago`;
}

function recordCard({ record, content, verification }) {
  const overall = verification.overall;
  const check1 = verification.check1;
  const check2 = verification.check2;

  const anchorLine = content.issuer.anchor
    ? `${escapeHtml(content.issuer.anchor.type.replace(/_/g, ' '))} -- ${escapeHtml(content.issuer.anchor.country)} -- <span class="mono">${escapeHtml(content.issuer.anchor.value)}</span>`
    : 'not declared';

  let statusDetail = '';
  if (overall === 'cancelled' && check2.cancellation) {
    statusDetail = `<div class="note-box">Cancelled by the issuer. Reason given: "${escapeHtml(check2.cancellation.reason)}"`
      + (check2.dispute
        ? `<br><br><strong>The holder disputes this cancellation.</strong> Category: ${escapeHtml(check2.dispute.category.replace(/_/g, ' '))}. Their side: "${escapeHtml(check2.dispute.detail || '')}"`
        : '')
      + `</div>`;
  } else if (overall === 'withdrawn_by_holder' && check2.withdrawal) {
    statusDetail = `<div class="note-box">The holder withdrew this record herself, independent of the issuer. Her reason: "${escapeHtml(check2.withdrawal.reason)}"</div>`;
  } else if (overall === 'unverifiable') {
    statusDetail = `<div class="warning-box">Could not reach the issuer's noticeboard to confirm this is still valid (${escapeHtml(check2.reason || 'unreachable')}). Not rejected, not accepted -- price it as unconfirmed.</div>`;
  } else if (overall === 'not_genuine') {
    statusDetail = `<div class="warning-box">This record's seal does not match its own contents. It has been altered since it was signed, or was never genuinely signed. Do not rely on anything else shown below.</div>`;
  }

  if (check2.holderChecksCompleted === false && overall !== 'not_genuine') {
    statusDetail += `<div class="warning-box">No holder identity was available to check for a dispute or an independent withdrawal on this record -- that half of Check 2 was not attempted. This shouldn't happen with a normal bundle export; treat this record cautiously.</div>`;
  }

  return `
  <div class="record-card">
    <div style="margin-bottom:10px;">${statusBadge(overall)}</div>
    <table>
      <tr><td>Claim</td><td><strong>${escapeHtml(content.claim.claimType.replace(/_/g, ' '))}</strong>${content.claim.isRegionalExtension ? ' (regional extension)' : ''}</td></tr>
      <tr><td>Period / amount</td><td>${escapeHtml(content.claim.period)}${content.claim.amount != null ? ' -- ' + escapeHtml(String(content.claim.amount)) : ''}</td></tr>
      <tr><td>Outcome</td><td>${escapeHtml(content.claim.outcome.polarity)} -- ${escapeHtml(content.claim.outcome.detail || '')}</td></tr>
      <tr><td>Vouch type</td><td>${escapeHtml(content.vouchType.replace(/_/g, ' '))}</td></tr>
      <tr><td>Stake</td><td>${escapeHtml(content.stake.type)}${content.stake.description ? ' -- ' + escapeHtml(content.stake.description) : ''}${content.stake.declaredProfile ? ' (' + escapeHtml(content.stake.declaredProfile) + ')' : ''}</td></tr>
      <tr><td>Issuer</td><td>${escapeHtml(content.issuer.name)} -- ${escapeHtml(content.issuer.orgType)}, ${escapeHtml(content.issuer.location)}</td></tr>
      <tr><td>Issuer's declared anchor (D7)</td><td>${anchorLine}</td></tr>
      <tr><td>Subject</td><td>${escapeHtml(content.subject.reference)} (${escapeHtml(content.subject.identityAnchorType.replace(/_/g, ' '))})</td></tr>
      <tr><td>Dates</td><td>${escapeHtml(formatAge(record))}</td></tr>
      <tr><td>Check 1 -- genuine?</td><td>${check1.genuine ? 'yes, seal matches' : 'NO -- seal broken'}</td></tr>
      <tr><td>Record ID</td><td class="mono">${escapeHtml(record.id)}</td></tr>
    </table>
    ${content.flags && content.flags.length ? `<div class="warning-box">${content.flags.map(escapeHtml).join('<br>')}</div>` : ''}
    ${statusDetail}
  </div>`;
}

function resultsPage({ envelope, results }) {
  const counts = { valid: 0, cancelled: 0, withdrawn_by_holder: 0, unverifiable: 0, not_genuine: 0 };
  results.forEach((r) => { counts[r.verification.overall] = (counts[r.verification.overall] || 0) + 1; });

  const statLabels = [
    ['valid', 'Genuine & valid'], ['cancelled', 'Cancelled'], ['withdrawn_by_holder', 'Withdrawn'],
    ['unverifiable', 'Unverifiable'], ['not_genuine', 'Not genuine'],
  ];

  return `
  <div class="card">
    <h1>Standing for ${escapeHtml(envelope.holderNpub ? envelope.holderNpub.slice(0, 20) + '...' : 'this bundle')}</h1>
    <p>Facts only -- no score. ${results.length} record${results.length === 1 ? '' : 's'} checked, generated by the holder at ${escapeHtml(envelope.generatedAt || 'an unknown time')}.</p>
    <div class="summary-grid">
      ${statLabels.map(([k, label]) => `<div class="summary-stat"><div class="n">${counts[k]}</div><div class="label">${escapeHtml(label)}</div></div>`).join('')}
    </div>
  </div>
  <div class="note-box">
    This tool does not check any issuer's declared anchor (D7) against a
    government registry -- that's your own job if it matters for this
    decision. Common Credo does not verify identity; it only makes the
    claim, the seal, and the cancellation/dispute/withdrawal status
    checkable.
  </div>
  ${results.map(recordCard).join('')}
  <a class="btn secondary" href="/">Check another bundle</a>`;
}

module.exports = { uploadForm, resultsPage, statusBadge, formatAge };
