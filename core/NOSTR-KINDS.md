# Nostr event kinds used by Common Credo

Written before signing code touches a new kind, so the protocol surface is
decided once and documented, not discovered by reading application code
later. Moved here from `issuer-tool/` when the shared `core/` package was
extracted (see the holder-tool plan) — this now covers every app that
depends on `core/`, not just the issuer tool.

| Kind | Purpose | Behaviour | Published where | Owned/signed by |
|---|---|---|---|---|
| `3388` | The CC record itself (Spec Part II) | regular | **Never published to a relay.** Held by the issuer, exported to the holder as a file. | issuer |
| `30300` | Cancellation list (Spec Part III / D6 / R2) | addressable (`d = "cc-cancellation-list"`) | relay | issuer |
| `30301` | Holder dispute of an issuer's cancellation (Spec D8) | addressable (`d = "cc-dispute-" + recordId`) | relay | **holder** |
| `30302` | Pending-cancellation durability mirror — **v1.1, not built** | addressable (`d = "cc-pending-" + recordId`) | relay | issuer |
| `30303` | Independent holder withdrawal — **new, this build's extension, not in the literal Spec text** | addressable (`d = "cc-withdrawal-" + recordId`) | relay | **holder** |
| `10002` | NIP-65 relay list (existing standard NIP, reused as-is) | replaceable | relay | issuer or holder (each publishes their own) |

## Why these choices

**Custom kinds, not NIP-78's `30078`.** NIP-78 ("arbitrary custom app data")
is meant for opaque per-client blobs sharing an addressable slot with
whatever else uses that convention under the same pubkey. Legal to reuse,
but semantically muddy and avoidable. Common Credo mints its own kinds
instead, documented here.

**`3388` is never relay-published.** Per the Nostr decision record
(28 Jul 2026): "Records stay on the holder's device; only the public
noticeboards go on the network." A record is built and signed with
`nostr-tools`' `finalizeEvent()` exactly like any Nostr event — this is
what gives Common Credo R1 (content-hash record ID) and the seal for free
— but it is exported to a file for the holder, never sent to a relay pool.

**`30300`/`30301`/`30303` satisfy R2-style freshness for free.** Nostr's
own addressable-event semantics mean a relay keeps only the latest version
per `(pubkey, kind, d-tag)`. The `created_at` of the current version *is*
the freshness/recency signal — no separate field needed, and refiling a
dispute or withdrawal simply replaces the prior version rather than
accumulating duplicates. (Implementation note: `holderActions.js` and
`cancellationList.js` both force `created_at` to be strictly greater than
any existing version at the same address — two publishes issued within the
same wall-clock second would otherwise tie, and a naive reader could keep
the *older* version as "latest." A real bug, caught and fixed in this
codebase, not a hypothetical.)

**`revocationPointer` inside a record never stores a fixed relay URL.**
Records are stored as `{issuerPubkey, kind: 30300, dTag:
"cc-cancellation-list"}` — permanently stable even if an issuer changes
relay providers, which a sealed record's contents cannot be edited to
reflect. A verifier resolves current relays via the issuer's own `10002`
(NIP-65) event, the standard Nostr mechanism for "where do I currently
publish," reused as-is rather than reinvented.

**30301 and 30303 are immediate-publish, no pending queue.** D8's 72h
window (`30300`) exists specifically to protect against the *issuer* as
potential perpetrator on a channel the holder can't stop. There is no
symmetric party the Spec protects from a holder's own actions on her own
addresses, so both publish immediately.

## Field placement inside a `3388` / `30300` event

- `content`: full JSON body (issuer, subject, claim, vouchType, stake,
  revocationPointer, `ccVersion: "0.3"`).
- `tags`: `["p", holderPubkeyHex]` (only if the holder has supplied one —
  issuer-tool's record form has an optional field for this), `["claim",
  claimType]`, `["polarity", outcome.polarity]` — light denormalization for
  the hold-and-show app's local filtering.
- Issuance date is the event's own `created_at`. Not duplicated as a
  separate ISO string field — one source of truth, never two that could
  silently disagree.

## `30301` / `30303` content shape

- **Dispute (`30301`):** `{recordId, category, detail, disputedAt}`.
  `category` is one of the fixed list in `holderActions.js`'s
  `DISPUTE_CATEGORIES` (Spec Part IV.4): `cancellation_factually_wrong`,
  `cancellation_retaliatory`, `record_never_authorised`.
- **Withdrawal (`30303`):** `{recordId, reason, withdrawnAt}`. No category
  — the Spec doesn't mandate one for this action.

`core/lib/verify.js`'s `checkStillValid` merges both into Check 2 when a
`holderPubkeyHex` is supplied. **Precedence:** a withdrawal always wins the
display status, regardless of the issuer's list — it's the holder's own
unambiguous signal. A dispute never flips a cancellation back to `valid`
(D8: "neither party can suppress the other's side") — it's shown alongside
the cancellation as context. `holderChecksCompleted: false` when no
holder pubkey was available at all — a verifier who never learns it gets
an honest "we couldn't check," never a silently-defaulted `valid`.

## Gap 3 — status after this build

**Closed for a holder who has set up holder-tool** — she can withdraw her
own record via `30303` independent of the issuer, unilaterally, with no
one else's cooperation. This is a real, deliberate protocol extension
beyond the literal current Spec text (D8 only specifies `30301`, for
disputing a cancellation, not for a holder's own unprompted withdrawal —
see the holder-tool plan for the reasoning).

**Not closed for a holder without holder-tool yet.** `issuer-tool/src/routes/holder-requests.js`'s
cooperation-dependent fallback (issuer receives and countersigns a
holder's request) still exists and still matters — plenty of holders will
not have a wallet on day one. Both paths coexist by design.

Full history: `toolkit/GAPS.md`, Gap 3.
