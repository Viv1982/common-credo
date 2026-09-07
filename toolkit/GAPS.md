# Common Credo — GAPS.md
### Spec gaps surfaced by the demo build (toolkit v0, built against Standard Spec v0.2)
*Written 6 July 2026, from direct reading of the toolkit source. These are inputs to the co-founder design review. Numbering continues the spec's decision series: the review should produce D7 and D8, plus two ratifications, feeding Spec v0.3.*

---

## GAP 1 → Decision D7: The issuer trust root
**The question:** how does a verifier *first* learn that a public key genuinely belongs to "Riverside Traders Co-operative" and not an impostor who invented the name? The seal proves "the holder of key X signed this" — it cannot prove key X belongs to who the record says it does.

**How the demo handles it:** a local directory file mapping issuer names to keys, explicitly commented in the code as *scaffolding, not a CC component*.

**Why it's real:** every trust system has a bootstrapping problem — passports work because governments cross-recognise; TLS works because browsers ship a list of trusted authorities. CC must say where its root of trust lives without rebuilding a centre. Candidate directions for the review: federation-published directories (chambers/MFI networks attest their members' keys — plural, no single root); web-of-issuers cross-signing (issuers vouch for each other's keys — vouching all the way down); anchor in the identity rails CC already relies on (a company register that lists a verification key). Likely answer is plural, like everything else in CC — but it needs deciding, not assuming.

**Status: open design decision. The largest of the three.**

---

## GAP 2 → Ratification: Record IDs
**The question:** the spec's cancellation list refers to "record IDs" but Part II never defines the ID as a field or says how it's made.

**How the demo handles it:** the ID is a content-hash — a fingerprint computed from the record's own contents before sealing. Elegant property: the ID cannot be forged or reassigned, because it *is* the record; two different records can never share an ID, and an ID can't be quietly pointed at different contents.

**Recommendation: ratify into Spec v0.3 as the defined mechanism** (Part II gains field: record ID = content hash, computed before sealing). Low controversy; the review just needs to say yes.

---

## GAP 3 → Decision D8: The holder-cancellation pipe (the real fork)
**The question:** D5 grants the holder the right to cancel any record about themselves. D6/Part III says the only thing a verifier ever checks is a list *only the issuer's key can sign*. So a holder cannot, alone, make their cancellation visible to any verifier — the right exists with no mechanism. The code models this honestly: a holder "cancellation" is an unsigned request that changes nothing until the issuer countersigns. Uncooperative, slow, or dead issuer = right unexercisable.

**Sharper still — found in the code, not in the session's own summary:** the *dispute flag* has the same defect. Part IV's protection against a malicious issuer ("the holder's dispute travels with the cancellation") is *also* published only under the issuer's key. **The victim's protection is published by the perpetrator.** A vindictive issuer cancels a truthful record AND simply declines to publish the dispute flag. As specified, D5's malice defence partially depends on the malicious party's cooperation.

**The fork (both honest, pick one):**
- **(a) Give the holder real teeth:** holders have their own signing keys; verifiers must check a second artefact (a holder-signed withdrawal / dispute) alongside the issuer's list. Philosophically pure — "the record belongs to the person" finally has mechanics. Costs: key management lands on the least-technical participant; lost keys = lost rights; verification gains a moving part.
- **(b) Honest downgrade:** rename the holder's right to what the mechanism can actually deliver — a *right to request*, with issuer non-cooperation made visible and priced (e.g. unanswered requests appear on the issuer's public track record the same way disputed cancellations do). Keeps one list and zero holder key-management; concedes the holder's ownership is mediated.
- The middle ground — keeping the "right to cancel" language over a request-only mechanism — is the one thing the spec must not do; that's the current state, and it's pretending.

**Also on the table:** whatever is chosen must fix the dispute-flag routing, which may need its own channel even under option (b).

**Status: open design decision — values-laden, founders' call.**

---

**UPDATE, 3 August 2026 (hold-and-show build):** Spec v0.3's D8 resolved
the *dispute-flag* half of this gap exactly as fork (a) above describes —
holders get their own signing key, and the dispute flag moves to an
address only the holder controls (`core/lib/holderActions.js`, kind
`30301`). But D8's text covers disputing an *issuer's cancellation*
specifically — it does not, on its own, give the holder a mechanism for
her own *unprompted* withdrawal (the `D5` right this Gap 3 write-up is
actually about). The holder-tool build closed that separately, as a
small, deliberate protocol extension beyond the literal Spec text: a
second holder-controlled address, kind `30303`, for independent
withdrawal — same pattern as `30301`, applied to a second action. See
`core/NOSTR-KINDS.md` for the full mechanism and precedence rules.

**Net status: closed for a holder who has set up `holder-tool/`** — she
can withdraw her own record with zero issuer involvement, proven live
against real relays and in `holder-tool/test/e2e.test.js`. **Still open
for a holder without one yet** — `issuer-tool/src/routes/holder-requests.js`'s
cooperation-dependent fallback (fork (b), in effect) remains the only
path for her until she has her own wallet. Both paths coexist by design,
not as an unresolved compromise.

---

## FIX 4 → Ratification: The empty list at onboarding
**Found during build:** a brand-new, never-cancelled record initially showed "unverifiable" because *no list existed yet* — the code couldn't distinguish "issuer never published a noticeboard" (dead-issuer case, price down) from "honest noticeboard with nothing on it" (fine). The spec implies but never states the fix.

**How the demo handles it:** issuers publish a signed, empty cancellation list the moment they begin vouching. Consistent with the spec's own words ("honest issuers' lists sit mostly empty" — they exist and are empty, not absent).

**Recommendation: ratify into Spec v0.3 as an explicit conformance requirement** (Part VI: an issuer must publish its signed list, even if empty, from first issuance).

---

## Review agenda (proposed)
1. **D8** — the fork above, including the dispute-flag routing. Hardest, most values-laden; take first while fresh.
2. **D7** — the trust root. Largest, but options are more architectural than moral.
3. **Ratify** Gap 2 (content-hash IDs) and Fix 4 (empty list at onboarding).
4. Output: **Spec v0.3**; then the toolkit gets rebuilt against it.

*Everything above is grounded in the toolkit source at `toolkit/lib/` — see especially the comments in `cancel.js` (Gap 3, Fix 4) and `record.js` (Gap 2, plus the D2 working claim list marked as placeholder pending the warm-seed community).*
