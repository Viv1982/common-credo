# The Common Credo Standard — Specification v0.3

*The reference manual: the openly published document that says exactly what a Common Credo record contains, how it is laid out, and how it is read. The most important artefact of the project, deliberately readable by anyone. A record that follows this document is a valid CC record; one that doesn't, isn't.*

*Status: v0.3 — all eight foundation design decisions (D1–D8) resolved jointly, plus three ratifications (R1–R3), 15 July 2026. Next step: rebuild the demo toolkit and visual against this spec, then warm-seed community review, then v1.0.*

---

## Part 0 — The design principle above all others

**The system is designed so that abusing it is most likely to harm the abuser.**

A holder who files false disputes marks their own record permanently. An issuer who cancels maliciously poisons its own public track record. A coordinated mob triggers a visible anomaly that throws suspicion on everyone involved, attackers included. The system does not need to catch everyone; it needs to make honesty the rational, cheaper path for every participant. Every mechanism below — stakes, visible reasons, dispute flags, track records, anomaly detection — is an application of this one principle. (Sometimes called *mutual destruction*: any attempt to damage another participant credibly risks damaging yourself, most likely more.)

CC itself enforces nothing. It makes behaviour visible, permanent, and priced — and lets the market do the rest.

---

## Part I — What this standard governs

This standard defines exactly three things:

1. **The Record** — the sealed unit of vouched trust. What it must contain, what it may contain, what it must never contain.
2. **The Checks** — how anyone verifies a record is genuine and still valid.
3. **The Bundle** — how multiple records are carried together and read as a person's standing.

It deliberately does **not** define: who may lend, how to score, what a "good" standing is, or who counts as a valid issuer in any region. Those live in the add-on layer, set by those who build on CC. **Structure is mandatory; tuning is flexible.**

A scope test used throughout: CC never *does* anything with data — it only defines the *shape* of a valid record. Every mandatory field below is a box the standard defines, an issuer fills, and a verifier reads. CC itself verifies no identity, holds no data, runs no register, and adjudicates no dispute.

---

## Part II — The Record

### 2.1 The three parties

Every record involves exactly three roles (the driver's-licence pattern):

- **Issuer** — the trusted local organisation who vouches: a trading counterparty, supplier, wholesaler, co-op, chamber of commerce, MFI, community business organisation, NGO, lender. Signs the record. *(Note: the strongest issuers are often trading counterparties — organisations that have bought from and sold to the holder — not lenders. The vouch-type field, 2.2 field 4, captures this distinction.)*
- **Holder** — the person or business the record is about. Carries the record themselves, on their own device.
- **Verifier** — anyone the holder shows it to. Checks the seal; prices what they see.

*(CC's users are the missing middle: small business owners, traders, co-ops, community business organisations, MFIs, chambers, supplier networks — organisations and businesspeople with ledgers and ordinary connectivity.)*

### 2.2 Mandatory fields — the core grammar

A record is not a valid CC record unless it contains ALL of the following:

**1. Named issuer, with declared issuer identity anchor.** *(Extended: D7)*
Who vouched, identified unambiguously — name, organisation type, location, public verification key, **and the issuer's own identity anchor**: the external, publicly checkable identifier that establishes the issuer is a real, accountable organisation. No anonymous issuers, ever. See Part II-A for the anchor ladder.

**2. The subject reference, with declared identity anchor.** *(Resolved: D1)*
Who the record is about — a pointer to an identity established elsewhere. CC does not verify identity. **Every record must declare what identity anchor the issuer used** — national ID, company registration, phone number, community register — so the verifier sees the binding strength at a glance and prices it. A record anchored to a company registration outweighs one anchored to a phone number, visibly. Nothing hidden, nobody excluded; fraud is priced, not pretended away.

**3. The claim.** *(Resolved: D2)*
What is being vouched, in structured form: claim type, amount (if applicable), period, outcome.
**Claim types come from a short fixed core list** that every implementation must understand — the working set (to be finalised with the warm-seed community): loan repaid; loan defaulted; trade credit honoured; trade credit defaulted; supplier payments record; savings record; membership in good standing; registration/licence fact; character vouch. **Plus a marked regional-extension slot** for local claim types, which distant verifiers may ignore. Thin core, open edges — the accordion. Extensions never replace core types; a claim expressible in a core type must use it.

**4. The vouch type.**
The format mandatorily distinguishes a *"saw the money move"* vouch (issuer witnessed the transactions directly — including as trading counterparty) from a *"knows their character"* vouch (issuer attests to conduct). Every record declares which it is.

**5. Recorded skin-in-the-game.** *(Resolved: D3)*
The issuer's stake — what the issuer stands to lose if the vouch proves false — is part of the record. The *presence* of the field is mandatory; amount and form are regional tuning. Stake may be financial or reputational (the issuer's own track record of accurate vouching is recognised stake).

**Zero stake is permitted only under a declared profile:** the issuer declares its type, and the claim is a *factual attestation* (membership, registration, tenure) rather than a *credit judgement*. This accommodates NGOs, chambers, and registries that legitimately cannot stake. A credit-judgement claim carrying zero stake remains *valid but flagged* — verifiers see a credit vouch nobody backed and price it accordingly, near zero. Zero-stake drift dies economically, not by prohibition.

**6. The seal, and the record's identity.** *(Extended: R1)*
The issuer's digital signature over the whole record. Tamper-evident: change one character and the seal breaks. The tally stick's two matching halves, rebuilt.

**The record's ID is the cryptographic fingerprint of its own contents** (SHA-256 content hash). Not a serial number; not chosen by the issuer or anyone. Three consequences: nobody assigns IDs so nobody can manipulate them; tampering is self-evident because a changed record no longer matches its own ID; and cancellation lists become unambiguous — a listed fingerprint can refer to exactly one document in the universe. **Corrections happen by visible cancel-and-reissue** (cancellation reason: *"superseded — corrected reissue"*), never by editing. History is never silently rewritten.

**7. Dates, and the memory rule.** *(Resolved: D4; extended: R3 seasoning)*
When issued, always prominent. Records are then treated asymmetrically, mirroring mature real-world credit systems:

- **Positive records never lapse.** Long good history is precisely what the economically invisible need most; good behaviour compounds. Verifiers see dates and may discount staleness — ageing is add-on-layer tuning.
- **Negative records lapse after a fixed period** (default 5–7 years; exact period is regional tuning). The real world grants a second chance; so does CC.
- **Lapsed means hidden, never deleted.** A lapsed negative record drops out of standard bundles but remains in the holder's possession; the holder may still *choose* to show it ("yes, I defaulted in 2020 — and here are five clean years since"). **CC never erases history; it dates it, hides it, and prices it.**
- **Record age is a declared trust signal ("seasoning").** A recently issued record is genuine but untested — most cancellations occur close to issuance, so fresh records carry higher residual cancellation risk. A record that has survived uncancelled for years has been tested by time. **Verifiers set their own seasoning thresholds according to their risk appetite; the standard mandates no waiting period.** A mandatory quarantine would punish exactly the new entrants CC exists to serve. The signal is mandatory; the judgment is free.

**8. The revocation pointer.**
The address, inside the record itself, where the issuer's cancellation list is published (Part III). The holder carries, within every record, the pointer to the noticeboard that could condemn it; removing the pointer breaks the seal.

### 2.3 What a record must NEVER contain

- The holder's transaction history beyond the single claim.
- Any data the holder did not consent to carry.
- Any field readable only by CC or any central party. There is no such party. Every field is readable by any verifier the holder shows it to.

### 2.4 Plurality

A standing is built from **many records from many issuers**. The format is designed for bundles, not single certificates. No single issuer's vouch is meant to be sufficient; anti-fakery comes from plurality — a collusion ring must corrupt many named, staked, tracked issuers, not one.

---

## Part II-A — Issuer legitimacy: the anchor ladder *(Resolved: D7)*

**The question:** a verifier has never heard of "Riverside Traders Co-op." The seal is genuine — but what stops anyone inventing an issuer, signing their own records, and handing them out?

**The answer:** CC builds no issuer registry and appoints no gatekeeper. Instead, **every issuer must declare an external identity anchor** — an identifier issued by infrastructure that already exists in almost every jurisdiction — and the verifier checks it against that jurisdiction's own public system. The countries maintain their own registries; CC just points to them.

**The anchor ladder** (in approximate order of binding strength — a working set, to be tuned with the warm-seed community):

1. National business registration (ABN, GSTIN, BIN, NIB, or local equivalent)
2. Tax / VAT / GST identifier
3. Cooperative, NGO, or association registration certificate
4. Bank account held in the entity's name
5. Mobile-money account held in the entity's name
6. Verified physical address registered with local government

**How verification works:** the record declares the issuer's country and anchor. The verifier's software checks it against that jurisdiction's public lookup (ABN Lookup, GSTIN verification, and equivalents — already public, online, and free in most jurisdictions). Where no online lookup exists, the check is manual. Either way, **CC is never in the loop.**

**Rules:**

- **Anonymous issuers are not permitted.** Every issuer must declare *something* externally verifiable. That is the line.
- **Informal issuers are included, not excluded.** A community group without formal registration anchors at a lower rung (bank account, mobile-money account, verified address) and the record declares it openly. The verifier sees the rung and weighs it — exactly as with holder identity anchors (D1). Not excluded; transparent.
- **CC does not decide which rung is good enough.** The verifier does, based on their own risk appetite. A lender needing high confidence requires rung 1–2 issuers; a lender comfortable with community trust accepts rung 4–5. CC makes the information visible and honest; the market prices it.
- **New issuers build weight through track record** (the D3 stake mechanism): an issuer's history of uncancelled, undisputed records is itself accumulating, visible stake. A new legitimate issuer and a new fraudulent issuer look similar on day one — the difference emerges, publicly, through performance over time.

**The principle at work:** CC invents nothing. Business registries, tax systems, bank KYC, and mobile-money onboarding have already done the work of establishing that organisations exist and are accountable. CC borrows that existing infrastructure — the same pattern as holder identity (D1), sealing mathematics (R1), and wallets.

---

## Part III — The Checks

A verifier performs exactly two checks, automatically, in about a second:

**Check 1 — Is it genuine?**
Verify the seal against the issuer's public key. Answered from the record itself, like a watermark. No phone call, no central query; no record contents leave the holder's device. *(With R1, this check also confirms the record matches its own fingerprint ID.)*

**Check 2 — Is it still valid?** *(Resolved: D6 — the signed published list; extended: R2 freshness)*
The verifier's software reads the revocation pointer out of the record itself and checks the issuer's **cancellation list**: a small signed file, published at the issuer's own address, containing only record IDs and cancellation status — no personal data, no claim contents.

Properties of the cancellation list:

- **Each issuer publishes its own.** There is no CC list, no CC website, no central register of any kind. CC wrote the rulebook for how issuers publish; it holds nothing.
- **The list exists from day one.** *(R2)* Becoming an issuer means two things happen as one act: generating your signing key and publishing your signed cancellation list — even if empty. No list, no valid records: every record must carry the list's address, so the sequencing is automatic. **Silence and "all clear" must mean different things.** An empty list says "nothing cancelled"; a missing list says "something is wrong."
- **Freshness stamp.** *(R2)* Every signing of the list — including the empty list — carries a date. A list must be re-signed at least every 90 days even if nothing changed (one automated act; any conforming tool does it without manual effort). A recent stamp tells the verifier the issuer is alive; a stale stamp is itself a signal — "this issuer may be dormant or defunct; weigh accordingly."
- **Tamper-proof by the same mechanism as records:** the list carries the issuer's seal. Nobody — including CC — can alter it. Anyone may copy and mirror it; the seal travels with the copies.
- **Event-driven beyond the freshness cycle.** An issuer touches its list only when it cancels something or when the 90-day re-sign falls due. Honest issuers' lists sit mostly empty.
- **Hosting may be delegated; signing never.** A small issuer may have its federation, chamber, or platform host its list — but only the issuer's key can sign it, so the host cannot tamper.

**Continuous watching for ongoing reliance.** *(R3)* Verification is a moment in time, but reliance often isn't. A verifier who extends a credit line, instalment terms, or repeat trade on the strength of a record **should re-check the issuer's cancellation list at intervals matching their exposure** — the lists are public precisely so this continuous watching is free and permissionless. The verifier's own software simply re-reads the public noticeboard on a schedule and alerts if a relied-upon record appears on it. This is not the issuer notifying the verifier (the issuer doesn't know the verifier exists) and not CC pushing anything (there is no centre) — it is the verifier's own tool re-reading a public file. **Honest residue:** post-cancellation alerts protect *ongoing* reliance; they cannot un-ship goods in a completed one-off transaction. That residual gap exists in every credit system on earth, and this standard does not pretend to abolish it. For one-shot decisions the protections are upstream: the freshness stamp, checking at the moment of decision, seasoning, and the issuer's track record.

**Scope of Check 2 (what the list is and isn't):** the cancellation list answers one narrow question — *is this specific record still valid.* It is not a news feed. New conduct, good or bad, enters the system as new records in the bundle, not as edits to old ones.

**Why the answer cannot live on the holder's device:** the record belongs to the person, on their device, and no one — issuer, CC, anyone — can write to it. The unavoidable flip side: a cancelled record still sits on a fraudster's phone looking perfect, its seal genuine (it genuinely *was* issued, like a cancelled passport still looks like a passport). Therefore the "still valid?" answer must live somewhere the holder does not control. That is the entire reason the cancellation list exists.

**Degraded-check rules (honest edges, named not hidden):**

- **Unreachable list ("dead issuer"):** if the issuer's list cannot be reached, the record is treated as *unverifiable* and priced accordingly — not rejected, not accepted. Good practice (recommended, not core): federations archive and mirror their members' lists, so an issuer's death does not orphan its honest holders' records. An archive run by many is not a centre.
- **Offline verification:** with no connectivity, Check 1 still completes (it needs only the record); Check 2 is best-effort, and the verifier's software must record which checks completed. Standard practice in payments.

---

## Part IV — Cancellation and dispute rules *(Resolved: D5, D8)*

**Who may cancel a record: the issuer, or the holder. No one else.**

- **The issuer** may cancel a record it signed — the legitimate grounds being fraud discovered after issue, genuine error (wrong amount, wrong person), or supersession (corrected reissue under R1).
- **The holder** may *request* cancellation of any record about themselves — stolen device, error, or the plain right to withdraw their own history from circulation. **v1 status:** without the holder's own independent key (arriving with the future hold-and-show app), this request depends on the issuer's cooperation to actually reach the public list — it is not yet a right the holder can exercise alone. This is named honestly, not hidden, and closing it — giving holders independent agency over their own record, not dependency on the issuer — is a stated priority for the hold-and-show app, not a someday maybe. Ownership you cannot exercise is not full ownership; "the record belongs to the person" is the destination this build is working toward.

**Every cancellation is visible, reasoned, and windowed. CC has no silent deletions and no instant condemnations:**

1. A cancellation must state a reason, permanently attached to the cancellation entry.
2. **The notification window.** *(D8)* When an issuer cancels, the holder is notified immediately — but the cancellation does not become visible to verifiers until a mandatory window has elapsed (default 72 hours; regional tuning). The holder cannot stop the cancellation; the window exists so the holder's dispute, if any, is published *before* any verifier ever sees "cancelled." Protection arrives with the harm, not after it.
3. **The dispute flag lives with the holder — never with the issuer.** *(D8, the core repair)* A holder disputing a cancellation publishes the dispute flag at an address only the holder controls, exactly as the issuer publishes its cancellation list at an address only the issuer controls. The conformant verification flow checks both: the issuer's cancellation list *and* the holder's dispute address. **Neither party can suppress the other's side.** The prior design — dispute flags travelling on the issuer's own list — is repealed: it placed the victim's protection under the control of the potential perpetrator.
4. **Dispute reasons are structured and public.** A dispute must declare a category from a short fixed list (working set): *cancellation factually wrong* (the record details are incorrect); *cancellation retaliatory* (unrelated to the credit facts); *record never authorised* (holder did not consent to issuance). Structured reasons make patterns legible: five disputes all declaring "retaliatory" against one issuer is a very different signal from five disputes with five unrelated reasons — and a coordinated false story is harder to sustain than a coordinated number.
5. A holder's own withdrawal shows as *"withdrawn by holder"* — visible, so a verifier can draw their own conclusion. Holder-cancellation is a right of withdrawal, never a delete-your-defaults button.
6. **Everything counts against everyone's own public track record — both directions.** An issuer with a pattern of disputed cancellations poisons its own credibility; its future vouches are priced down by every verifier. Equally, **a holder's dispute history is permanently part of their own record**: a holder who has filed disputes against multiple issuers carries that pattern visibly to every future verifier. Filing a false dispute is most damaging to the person filing it. (Part 0 in action.)
7. **Dispute patterns are visible in aggregate, anonymously.** Any verifier checking any record from a given issuer sees the issuer's count of active disputes — not the disputants' identities or details, just the pattern. The community polices the issuer without organising, voting, or being asked to.

**Anomaly detection and the yellow light.** *(D8)* The mirror threat to a malicious issuer is a malicious mob: coordinated actors filing false disputes to destroy a legitimate issuer. Defences, in order:

- **The mutual-destruction brake (structural, always on):** every false dispute permanently marks the disputant's own record. A mob must burn its own members' creditworthiness — the very thing CC exists to build — to run the attack.
- **Pattern watching (automated, continuous):** because all dispute and cancellation data is public, anomaly detection — including AI-based — can run over it continuously, by CC's stewards or by anyone. Signatures of coordination: clustered timing; disputing holders with no prior trading relationships to the issuer or each other; near-identical structured reasons; disputants with thin, new, low-stake records.
- **The yellow light (bounded intervention):** above a declared anomaly threshold, affected records — *on both sides, attackers' included* — are marked *"anomalous dispute pattern detected — under review."* Not cancelled, not cleared: yellow, not red or green. The market pauses. **No judgment, no verdict is ever attached.** A human review confirms only whether the anomaly pattern is real (not who is right); confirmed patterns are marked *"flagged as potentially coordinated,"* permanently, on the records of all participants in the cluster. The yellow light then clears and the market resumes pricing.
- **CC never adjudicates.** The intervention boundary is absolute: CC (or any steward running detection) may *surface* what the public data shows and *pause* visibility while it is checked — it may never rule on the underlying dispute. Anything past the yellow light rebuilds the judge, and the judge rebuilds the centre this project exists to abolish.

**Malice, priced not prevented (named honestly):** no rule of this standard can stop a spiteful issuer cancelling a truthful vouch, or a determined mob attempting a coordinated attack. The defences are structural: reasons are permanent, disputes are holder-controlled and visible, abuse marks the abuser, patterns are detectable in public data, and plurality dilutes all damage — one spiteful cancellation dents a standing built on many records; it cannot erase it. The residue: a holder or issuer in their first year, with few records, is most exposed. This is the Maghribi trade-off accepted knowingly — the network self-polices because the network remembers.

**Cross-issuer tampering is impossible by construction:** an issuer can only sign — and therefore only cancel — its own records. No community can touch another's.

---

## Part V — The Bundle and Standing

- A **bundle** is the set of records a holder chooses to present. The holder decides what to show — always. Selective presentation is the person's right, not fraud: what matters is that each shown record is genuine, anchored, staked (or declared unstaked), dated, and checkable.
- A **standing** is a verifier's reading of a bundle. The standard makes records weighting-compatible — vouch type, stake, identity-anchor strength (holder's *and* issuer's), dates and seasoning, dispute history, and check-status are all visible and machine-readable — **but does not define scoring.** Scores are regional add-ons. CC carries facts; users decide.

---

## Part VI — Conformance

An implementation "supports Common Credo" only if it:

1. Produces records containing all mandatory fields (Part II) — including declared holder identity anchor, declared issuer identity anchor (Part II-A), core-list claim type, declared stake, content-hash ID, and revocation pointer.
2. Refuses to treat as valid any record missing them.
3. Performs both checks (Part III) before relying on a record — including the holder's dispute address (Part IV.3) — and records which checks completed.
4. Never transmits record contents to any list, service, or third party during verification.
5. Applies the memory rule (positive permanent, negative lapse-and-hide) as specified.
6. Displays cancellations with their reasons, dispute flags (from the holder's address), seasoning dates, and any yellow-light status; never suppresses them.
7. Publishes and freshness-stamps its cancellation list from first issuance (R2), and honours the notification window before displaying cancellations (Part IV.2).
8. Never charges the holder for holding, presenting, disputing, or withdrawing their own records. *(Constitutional: the person's own reputation must never carry a toll.)*

---

## Part VII — Open items (not blocking v1.0 drafting)

- **Governance/voting mechanism** for changes to this standard — the keystone; separate document.
- **The final core claim-type list and dispute-category list** — to be locked with the first warm-seed community, not in the abstract.
- **Anomaly threshold tuning** — what dispute density/clustering triggers the yellow light; who runs detection at seed stage; parameters to be set with real data, not in the abstract.
- **First warm-seed community** — first issuer and first verifier in one close-knit network.
- **The untested bet:** will a *distant* verifier honour a community-issued record? The spec enables the test; it cannot answer it.

---

## Appendix — The foundation decisions and ratifications (record of resolution)

| # | Question | Resolution |
|---|----------|------------|
| D1 | Identity binding (holder) | Every record declares its identity anchor; verifiers price binding strength. Inclusion preserved, fraud priced. |
| D2 | Claim vocabulary | Short fixed core list all implementations must understand + marked regional extensions. The accordion. |
| D3 | Zero stake | Permitted only for declared issuer types making factual attestations; credit-judgement claims with zero stake are valid but flagged and priced near zero. |
| D4 | Memory | Positive records permanent; negative records lapse (5–7 yrs, regional) and are hidden, never deleted. CC never erases history — it dates, hides, and prices it. |
| D5 | Cancellation rights | Issuer or holder only. All cancellations visible, reasoned, disputable; they count against the issuer's own track record. Malice is priced and diluted, not prevented. |
| D6 | Where "still valid?" lives | Each issuer publishes its own small signed cancellation list at its own address; the record carries the pointer. No CC register, no centre, nothing to capture. Hosting delegable; signing never. |
| D7 | Issuer legitimacy | Issuers declare an existing external identity anchor (business registration, tax ID, co-op certificate, bank/mobile-money account, verified address — the anchor ladder), checked against each jurisdiction's own public registry. No CC registry, no gatekeeper. Informal issuers included at lower rungs, declared openly; verifiers set their own bar. New issuers build weight through public track record. |
| D8 | Disputes and holder protection | Dispute flag lives at an address only the holder controls — never on the issuer's list. 72-hour notification window before cancellations become visible. Structured public dispute reasons. Abuse marks the abuser, both directions (mutual destruction, Part 0). Continuous public-data anomaly detection (AI-assisted) with a yellow-light pause above threshold: pattern surfaced, never adjudicated. CC never judges. |
| R1 | Record identity | A record's ID is the SHA-256 content hash of its own contents. No assigned or serial IDs. Corrections by visible cancel-and-reissue, never by editing. |
| R2 | List from day one | Key generation and empty-list publication are one act; no list, no valid records. Lists carry a freshness stamp and are re-signed at least every 90 days; staleness is itself a signal. Silence and "all clear" mean different things. |
| R3 | Ongoing reliance and seasoning | Verifiers with ongoing exposure re-check cancellation lists at intervals matching that exposure (lists are public precisely to make watching free). Record age is a declared trust signal — fresh records carry higher residual cancellation risk; seasoned records have been tested by time. Verifiers set their own seasoning thresholds; the standard mandates no waiting period. |

*v0.3 — 15 July 2026. Supersedes v0.2 (4 July 2026, retained). Companion to: Non-Technical Brief v2, Session Notes and Addendum, Foundations & Lineage, What We're Actually Building.*
