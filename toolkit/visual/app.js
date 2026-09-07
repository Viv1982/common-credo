(function () {
  var story = window.CC_STORY || [];
  var root = document.getElementById('story');

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  function overallTone(overall) {
    if (overall === 'valid') return { label: 'GENUINE & VALID', tone: 'good' };
    if (overall === 'cancelled') return { label: 'CANCELLED', tone: 'bad' };
    if (overall === 'unverifiable') return { label: 'UNVERIFIABLE', tone: 'warn' };
    return { label: 'NOT GENUINE', tone: 'bad' };
  }

  function badge(label, tone) {
    return el('span', { class: 'badge ' + tone }, [label]);
  }

  function kvTable(rows) {
    var table = el('table', { class: 'kv-table' });
    rows.forEach(function (row) {
      table.appendChild(el('tr', {}, [
        el('td', {}, [row[0]]),
        el('td', {}, [String(row[1])]),
      ]));
    });
    return table;
  }

  function renderKeyValueCard(card) {
    var box = el('div', { class: 'card' });
    box.appendChild(kvTable(card.rows));
    return box;
  }

  function renderRecordCard(card) {
    var r = card.data;
    var box = el('div', { class: 'card record-card' });
    box.appendChild(el('div', { class: 'record-title' }, ['Sealed record']));
    box.appendChild(kvTable([
      ['Issuer', r.issuer.name + ' (' + r.issuer.orgType + ', ' + r.issuer.location + ')'],
      ['Subject', r.subject.reference],
      ['Identity anchor', r.subject.identityAnchorType],
      ['Claim', r.claim.claimType + (r.claim.isRegionalExtension ? ' (regional extension)' : '')],
      ['Period', r.claim.period],
      ['Outcome', r.claim.outcome.polarity + ' — ' + r.claim.outcome.detail],
      ['Vouch type', r.vouchType],
      ['Stake', r.stake.type + (r.stake.description ? ' — ' + r.stake.description : '') + (r.stake.declaredProfile ? ' — ' + r.stake.declaredProfile : '')],
      ['Issued', r.issuedAt],
      ['Cancellation address', r.revocationPointer.address],
    ]));
    if (r.flags && r.flags.length) {
      var flagsBox = el('div', { class: 'gap-callout' });
      flagsBox.appendChild(el('div', { class: 'gap-label' }, ['SPEC FLAG (D3)']));
      flagsBox.appendChild(el('p', {}, [r.flags.join(' ')]));
      box.appendChild(flagsBox);
    }
    box.appendChild(el('p', { class: 'mono' }, ['Record ID: ' + r.recordId]));
    box.appendChild(el('p', { class: 'mono' }, ['Seal: ' + r.seal.algorithm + ' ' + r.seal.signature.slice(0, 24) + '…']));
    return box;
  }

  function renderCheckDetails(check) {
    var box = el('div', { class: 'check-grid' });

    var c1 = check.check1;
    var box1 = el('div', { class: 'check-box' });
    box1.appendChild(el('h3', {}, ['Check 1 — Genuine?']));
    box1.appendChild(badge(c1.structurallySealed ? 'Seal matches' : 'Seal broken', c1.structurallySealed ? 'good' : 'bad'));
    box1.appendChild(badge(c1.issuerKeyConfirmed ? 'Issuer key confirmed' : 'Issuer key unconfirmed', c1.issuerKeyConfirmed ? 'good' : 'warn'));
    if (c1.issuerKeyConfirmedNote) box1.appendChild(el('div', { class: 'detail' }, [c1.issuerKeyConfirmedNote]));
    box.appendChild(box1);

    var c2 = check.check2;
    var box2 = el('div', { class: 'check-box' });
    box2.appendChild(el('h3', {}, ['Check 2 — Still valid?']));
    if (c2.status === 'valid') box2.appendChild(badge('Not cancelled', 'good'));
    if (c2.status === 'cancelled') {
      box2.appendChild(badge('Cancelled by ' + c2.cancelledBy, 'bad'));
      box2.appendChild(el('div', { class: 'detail' }, ['Reason: ' + c2.reason]));
      if (c2.disputed) box2.appendChild(el('div', { class: 'detail' }, ['⚑ Disputed: ' + c2.disputeReason]));
    }
    if (c2.status === 'unverifiable') {
      box2.appendChild(badge('Unverifiable', 'warn'));
      box2.appendChild(el('div', { class: 'detail' }, [c2.reason]));
    }
    box.appendChild(box2);

    return box;
  }

  function renderCheckCard(card) {
    var wrap = el('div', { class: 'card' });
    var tone = overallTone(card.data.overall);
    wrap.appendChild(badge(tone.label, tone.tone));
    wrap.appendChild(renderCheckDetails(card.data));
    return wrap;
  }

  function renderBeforeAfterCard(card) {
    var wrap = el('div', { class: 'card before-after' });
    [card.before, card.after].forEach(function (side) {
      var col = el('div', {});
      col.appendChild(el('div', { class: 'col-label' }, [side.label]));
      var tone = overallTone(side.data.overall);
      col.appendChild(badge(tone.label, tone.tone));
      col.appendChild(renderCheckDetails(side.data));
      wrap.appendChild(col);
    });
    return wrap;
  }

  function bundleStatRow(label, value) {
    return el('div', { class: 'bundle-stat' }, [
      el('span', {}, [label]),
      el('span', { class: 'n' }, [String(value)]),
    ]);
  }

  function bundleColumn(title, summary) {
    var col = el('div', { class: 'bundle-col' });
    col.appendChild(el('h4', {}, [title]));
    col.appendChild(bundleStatRow('Shown in standard view', summary.shownInStandard + ' of ' + summary.totalRecordsInWallet));
    col.appendChild(bundleStatRow('Hidden as lapsed', summary.hiddenAsLapsed));
    col.appendChild(bundleStatRow('Positive', summary.positive));
    col.appendChild(bundleStatRow('Negative', summary.negative));
    col.appendChild(bundleStatRow('Neutral', summary.neutral));
    col.appendChild(bundleStatRow('Cancelled', summary.cancelled));
    return col;
  }

  function renderBundleCompareCard(card) {
    var wrap = el('div', { class: 'card bundle-compare' });
    wrap.appendChild(bundleColumn('Standard bundle (default)', card.standard.summary));
    wrap.appendChild(bundleColumn('Holder chooses to show everything', card.forced.summary));
    return wrap;
  }

  function renderCard(card) {
    if (!card) return null;
    if (card.type === 'keyvalue') return renderKeyValueCard(card);
    if (card.type === 'record') return renderRecordCard(card);
    if (card.type === 'check') return renderCheckCard(card);
    if (card.type === 'beforeAfter') return renderBeforeAfterCard(card);
    if (card.type === 'bundleCompare') return renderBundleCompareCard(card);
    return null;
  }

  story.forEach(function (stepData, i) {
    var section = el('section', { class: 'step' });
    section.appendChild(el('div', { class: 'step-index' }, ['STEP ' + i]));
    section.appendChild(el('h2', {}, [stepData.title]));
    (stepData.paragraphs || []).forEach(function (p) {
      section.appendChild(el('p', {}, [p]));
    });
    if (stepData.gapCallout) {
      var gap = el('div', { class: 'gap-callout' });
      gap.appendChild(el('div', { class: 'gap-label' }, ['⚑ ' + stepData.gapCallout.label + ' — SPEC GAP']));
      gap.appendChild(el('p', {}, [stepData.gapCallout.text]));
      section.appendChild(gap);
    }
    var cardEl = renderCard(stepData.card);
    if (cardEl) section.appendChild(cardEl);
    root.appendChild(section);
  });
})();
