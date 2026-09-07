# Common Credo — A Non-Technical Brief (v3)

*What we are building, in plain language. Updated 28 July 2026 to incorporate all eight foundation design decisions (D1–D8) and the three ratifications (R1–R3). The technical companion is the Standard Specification v0.3.*

---

## Start here: the problem this exists to solve

Imagine you run a small trading business in Bangladesh. You've been buying and selling reliably for eight years. Your suppliers trust you. Your customers pay on time. The local market association knows your name — your word is good.

You go to a bank for a loan. The bank asks: can you prove you're creditworthy?

You have nothing to show them. No formal credit history. No registered collateral. No audited accounts. The bank says no.

**The trust exists. It just can't travel.**

That's the whole problem. Hundreds of millions of small businesses across South Asia, Southeast Asia, and Africa are in exactly this position. They're not bad credit risks — they're *invisible* credit risks. Banks can't lend to invisible people, not because they're untrustworthy but because there's no shared language for what the community already knows about them. Every time a bank can't lend, that business can't grow, can't hire, can't invest.

Common Credo is the thing that lets the market association's knowledge — "this person pays their debts, here are three years of evidence" — become something a bank in the next city can actually read and rely on. The trader doesn't need the bank to trust them from scratch. They just need to carry proof of what people who already know them already believe.

**And the reason it has to be a free, open standard — not one company's app or bureau — is that the trust already lives in the community, not in any company.** If one company owns the record, the community depends on that company forever — and that company can sell the data, shut down, or price people out. A shared open standard means a co-op in Dhaka and a chamber of commerce in Jakarta can both issue records in the same language, and a lender anywhere can read both. Nobody owns it. It belongs to everyone who uses it.

---

## The one sentence

**Common Credo is a free, shared foundation that lets a person carry their own proof of creditworthiness — so anyone can build lending tools on top of it, but no one can own, sell, or control the reputation itself.**

That's it. Everything below explains what that means and why it's built the way it is.

---

## Who it is for

CC serves the **missing middle**: small business owners, traders, contractors, co-ops, and the organisations around them — microfinance institutions, chambers of commerce, community business organisations, supplier networks. People and organisations with real ledgers, real trading histories, and ordinary connectivity — who are nonetheless invisible to formal credit because their history has never had a portable, verifiable form.

---

## What the project actually ships — three things

Common Credo delivers three things, and it's worth being exact about them because it's an easy point to get wrong:

1. **The rulebook** — the open Standard Specification (currently v0.3). The agreed shape of a record and the rules for reading it.
2. **The building-block code** — free, open libraries that do the cryptographic work: create a record, seal it, check it, cancel it.
3. **The white-label software** — free, open-source, rebrandable apps for the three jobs a real user actually needs: **issue** a vouch, **hold and show** it, **check** it. A co-op can stand this up and run it as their own, the way anyone can stand up WordPress.

Others can still build their own tools on top — a lender's own app, an MFI's platform. The white-label software is the floor that lets the first real communities start, not a ceiling.

> An earlier version of this brief said CC was "the plumbing, not the tap" and built no software of its own. That was wrong and has been corrected: the standard stays thin, but the project ships working software so the people it's built for — who won't hire developers — can actually use it.

---

## Start with what it is NOT

Clearing away what people will assume it is:

- It is **not a lender.** It never gives out money.
- It is **not a credit bureau.** It does not hold a giant central file on everyone and sell scores to banks.
- It is **not a consumer app you log into as a customer**, and it is **not a company** that owns your data. It holds no data and runs no server in the checking path.

What it *is*: the free rulebook, the free code, and the free white-label software described above — the thin, shared middle that everything else is built on and around.

---

## The idea, using something you already understand

Think about the paper driver's licence in your wallet. Three roles make it work:

```
   ISSUES IT           HOLDS IT            CHECKS IT
 ┌────────────┐    ┌────────────┐    ┌────────────┐
 │ Government │ →  │    YOU     │ →  │  Bartender │
 │  (issuer)  │    │  (holder)  │    │ (verifier) │
 └────────────┘    └────────────┘    └────────────┘
```

The clever part: when the bartender checks your licence, **they don't phone the government.** They just look at the card, trust the official seal, and hand it back. *You* carry your own proof. The government keeps no record of where you went.

Common Credo applies that exact pattern to **creditworthiness** instead of age:

```
      ISSUES IT               HOLDS IT             CHECKS IT
 ┌──────────────────┐   ┌──────────────┐   ┌──────────────────┐
 │ A co-op, supplier│   │ The borrower │   │  The next lender │
 │ or lender signs: │ → │ carries their│ → │  reads it and    │
 │ "repaid $10k on  │   │ own record   │   │  trusts it       │
 │  time" (issuer)  │   │  (holder)    │   │   (verifier)     │
 └──────────────────┘   └──────────────┘   └──────────────────┘
```

The borrower carries their own repayment history, sealed so it can't be faked or altered. The next lender can trust it without phoning anyone, and without CC sitting in the middle as a gatekeeper that owns the data.

**The record belongs to the person. Not to a company. Not to us.**

---

## Why this shape: a common standard (a shared language)

The closest real-world thing to what the *standard* is isn't a machine — it's **a shared rulebook that everyone agrees to follow.**

The clearest example is the rulebook that runs the internet (called TCP/IP). It is not hardware and it is not an app. It is simply an *agreed format* — how a message is packaged and addressed — that every device on Earth follows. Because they all follow the same format, a phone, a laptop, and a giant server can all talk to each other. Nobody owns it. Nobody charges for it. It stays small on purpose. It is the thin, free *common language* in the middle that lets everything above it work together.

**That is what the CC standard is: a free, common format that lets anyone collect and exchange proof of creditworthiness in the same agreed way** — and, because unsophisticated users can't be left with a rulebook alone, the project also ships free software that speaks it. Here is the whole picture:

```
   WHAT OTHERS BUILD AND RUN   (their own apps, on top)
 ┌───────────┬────────────┬─────────────────┐
 │ A lender's│  An MFI's  │ A chamber's or  │
 │ app in    │  platform  │ co-op network's │
 │ Dhaka     │            │ own tool        │
 └─────┬─────┴──────┬─────┴────────┬────────┘
       │            │              │
       ▼            ▼              ▼
 ┌─────────────────────────────────────────┐
 │   COMMON CREDO                          │
 │   • the RULEBOOK (the shared standard)  │
 │   • the free BUILDING-BLOCK CODE        │
 │   • free WHITE-LABEL SOFTWARE for the   │
 │     three jobs (issue / hold / check)   │
 │                                         │
 │   It does NOT itself lend, decide, hold │
 │   data, or run a register.              │
 └─────────────────────────────────────────┘
                  ▲ draws from / sits on
 ┌─────────────────────────────────────────┐
 │   THE RAW MATERIAL UNDERNEATH           │
 │   • identity rails (national ID, MOSIP, │
 │     company & business registries)      │
 │   • community & commercial vouches      │
 │     (chamber, MFI, supplier, co-op)     │
 │   • the person's own wallet & records   │
 └─────────────────────────────────────────┘
```

**Read it bottom to top:**

1. **The bottom layer is raw and messy** — identity systems, scattered vouches that differ from place to place, the person's own held records. It already exists; we don't rebuild it.
2. **CC is the shared standard in the middle, plus the free code and software that speak it.** It turns that messy raw material into *one agreed format* — and provides the plumbing, the seal-check, and usable apps — so anything built on top can read it without understanding the mess underneath. CC never pools the data in a centre.
3. **Above CC, others build and run their own visible things** — a lender's app, an MFI's platform — each through the one shared standard.

---

## So what exactly IS the standard? (The part to read twice)

If you remember one thing: **the standard is deliberately small. It is three things, and it borrows everything else.**

**1. The record format.**
An agreed, standard shape for a single piece of credit history. As of Spec v0.3, a valid record must contain: *a named issuer (never anonymous) with its own declared identity anchor; a subject reference with a declared identity anchor; a structured claim from an agreed core list; the vouch type ("saw the money move" vs "knows their character"); the issuer's declared stake; a tamper-evident seal; the record's own fingerprint as its ID; dates; and the address where its cancellation status can be checked.* A *shared shape* is the only reason a record created in one country can be read and trusted in another. No shared shape, no portability — and portability is the whole point.

**2. The reputation logic.**
The open, public rules for turning a pile of individual records into something a lender can read as "this person can be trusted." This is where **vouching** lives: who may vouch, what a vouch is worth, what happens to the *voucher* if the person lets them down, how old history fades. CC *publishes* these rules; the organisations on top *apply* them.

**3. The constitution.**
The short list of unchangeable principles (below), plus the agreed process for changing the rules that *are* allowed to change. Not software — but part of the standard, because it is what keeps the first two things honest and stops anyone capturing them.

### What it DOES — four plain verbs

- **Define** — sets the standard shape of a record, so everyone speaks the same language.
- **Verify** — lets anyone confirm a record is genuine and current, without phoning a central office.
- **Enable** — gives others the shared rules, the code, and working white-label software so they can issue, hold, and check in one agreed way.
- **Protect** — guarantees the whole thing stays free, open, and owned by no one.

### What it RELIES ON — and why the standard stays small

CC stands on layers that **already exist** and builds almost none of them itself:

- **Identity** (proving who a person is) — relies on national IDs, MOSIP, company registers, wallets. *CC does not build this.* Every record simply *declares which anchor it used*, so a verifier sees the binding strength and weighs it.
- **Issuer legitimacy** (proving the vouching organisation is real) — relies on countries' own business, tax, and co-op registries. *CC does not build this either* (see D7 below).
- **The wallet** (where a person keeps their records) — existing technology. *CC does not build this.*
- **The unforgeable seal** — existing, public, internationally-agreed cryptography. *CC uses this; it does not invent it.*

> **The thinness of the standard is the strategy.** The less the standard builds, the less can be captured, the cheaper it is to run, and the easier it is for others to adopt. The white-label software is a thin, free reference build on top of that small standard — not a thickening of the core.

---

## How checking works — the questions, answered without a centre

A verifier's software runs its checks automatically, in about a second.

**Question 1 — Is this record genuine?**
Answered from the record itself, like checking the watermark on a banknote. The seal either matches the named issuer's public key or it doesn't — and (R1) the record's contents match its own fingerprint ID, so any tampering is self-evident. No phone call, no central query; the record's contents never leave the holder's device.

**Question 2 — Is the issuer real?** *(D7)*
A genuine seal isn't enough on its own — anyone could invent an issuer and sign their own records. So every record carries the issuer's **external anchor**: an identifier from infrastructure that already exists — a business registration, tax ID, co-op certificate, or even a bank or mobile-money account — which the verifier checks against *that country's own public registry*. CC keeps no list of issuers and appoints no gatekeeper; the countries already maintain the registries, and the standard just points at them. Informal groups aren't excluded — they anchor at a lower rung, declared openly, and the verifier weighs it.

**Question 3 — Is it still valid, or has it been cancelled?** *(D6, R2)*
Records sometimes have to be cancelled after they're issued — fraud discovered, a genuine error, a stolen phone. But because the record lives on the *holder's* device and no one can reach into that device, a cancelled record can go on sitting there looking perfect. So the "still valid?" answer must live somewhere the holder does not control.

**Where it lives: each issuer publishes its own small, signed cancellation list** — just record IDs and "cancelled," nothing personal — at its own address. Every record **carries, inside itself, the address of its own issuer's list** (removing it breaks the seal). And that list exists from day one and carries a freshness stamp (R2): an empty list means "nothing cancelled," a *missing* list means "something is wrong," and a stale stamp says "this issuer may be dormant." The verifier's software reads the address out of the record and checks it automatically.

**A worked example.** Bob the sole trader holds a record — *"trade credit honoured, 2023–24"* — signed by Widgets XYZ Pty Ltd. In 2026 Widgets XYZ discovers the underlying documents were forged and cancels it, adding one line to its own published list: *record #4471 — cancelled — reason: fraud.* Next month Bob shows the record to a new supplier. Their software runs the checks: *genuine?* — yes, seal and fingerprint match. *issuer real?* — yes, Widgets XYZ's registration checks out against the public registry. *still valid?* — it reads the list-address out of Bob's own record, checks Widgets XYZ's list, finds #4471 cancelled. Bob is carrying the pointer to the noticeboard that condemns him, and he can't remove it without breaking the record.

**Why this and not a central register:** there is deliberately **no CC list, no CC website, no central database.** A central register would be the one thing a government could pressure, a company could capture, or a failure could take down — the exact centre this project exists to abolish.

**And when reliance continues over time (R3):** a lender who keeps extending credit on the strength of a record simply has their own software re-read the public list on a schedule and alert them if it ever appears — free, because the lists are public. A brand-new record is genuine but untested; one that has survived uncancelled for years has been tested by time. Verifiers set their own comfort level; the standard forces no waiting period.

**The rules of cancelling** *(D5, D8)*: only the issuer or the holder may cancel a record — no one else. Every cancellation must state a reason, permanently. When an issuer cancels, the holder is notified immediately, but a **72-hour window** passes before verifiers see it — so the holder's side is visible first. Crucially, **the holder's dispute flag is published at an address only the holder controls** — never on the issuer's list — so the party being accused can't suppress the accused's defence. Every cancellation counts against the *issuer's* own public track record; and every dispute counts against the *holder's* — filing a false dispute is most damaging to the person filing it. Where suspicious coordinated attacks appear in the public data, a bounded **"yellow light"** can pause the affected records while the pattern is checked — but CC never rules on who is right.

---

## Memory and second chances

How long does history follow you? CC answers the way mature credit systems do, with a deliberate asymmetry:

- **Good records never lapse.** A long, clean history is precisely what the economically invisible need most. Good behaviour compounds. (Old records always show their date; how much a stale record counts is up to the verifier.)
- **Bad records lapse after a fixed period** (5–7 years, tuned regionally) — the real world grants a second chance, and so does CC.
- **Lapsed means hidden, never deleted.** A lapsed record drops out of what's normally shown, but the person still holds it and may *choose* to show it — "yes, I defaulted in 2020, and here are five clean years since" is a story deletion would destroy.
- **Record age is itself a signal ("seasoning," R3).** A fresh record is genuine but untested; a seasoned one has been tested by time. This is shown, not enforced — verifiers weigh it themselves.

> **CC never erases history. It dates it, hides it, and prices it.**

---

## How the common standard solves our hardest problem

We kept hitting a wall: **every region assesses credit differently.** A cash-based market in rural Bangladesh and a digital one in a city judge trust in completely different ways. Trying to build one system that works everywhere felt impossible.

A shared standard dissolves this. The standard holds only the **universal core** — the record format, the anchor ladder, the unchangeable principles. The **regional differences live in the layer above**, built by people who actually know that region. Even the *claims* work this way: a short core list of claim types every implementation understands (loan repaid, trade credit honoured, membership standing, and so on), plus a marked slot for regional extensions that distant verifiers may ignore.

> One common standard underneath. Many regional "flavours" on top. A record built in one place is still readable in another, because they all share the same core.

This is exactly how the internet works: one shared base standard, thousands of different services built on top. You do not have to solve every region. You define the small universal middle, and let others solve their own region on top.

---

## The discipline this demands — and what "stays small" really means

A common standard only works if its *shared core* stays small. But "small" needs a precise meaning, because it does **not** mean CC can only ever do a few things.

Picture an **accordion**, or an hourglass: a narrow, rigid waist in the middle, with everything fanning out above and below. The internet itself is built this way — one thin, almost-never-changed standard at the centre, and infinite variety plugged in around it. **The waist stays thin precisely so the ends can be endless.**

So CC has two parts that follow opposite rules:

- **The core** (the record format, the constitution) — the one thing *everyone* must share. This stays minimal, stable, and is changed only rarely and deliberately.
- **The add-ons** — optional modules anyone can build around the core: a region's scoring flavour, an NGO's special attestation type, a lender's compliance layer. This ecosystem can be *enormous*. It is meant to grow. The project's own white-label software sits here too — a free reference build, not part of the mandatory core.

Two rules keep this healthy:

1. **Building an add-on needs no permission.** The moment you require permission to build, you've rebuilt the gatekeeper the whole project exists to abolish.
2. **Promoting an add-on *into* the shared core is slow and governed** — like amending a constitution.

> Easy to build on the edge. Hard to change the centre. That asymmetry is the design.

---

## What CC actually provides — the checklist

1. **A record** of creditworthiness that the person owns and carries themselves, that cannot be forged or secretly altered — and that carries, built in, the way to check it hasn't been revoked.
2. **The open rules** for how that record is built, read, and cancelled — public, so anyone can audit them.
3. **Free building-block code and white-label software** so the people it's built for can actually issue, hold, and check records without hiring anyone.
4. **A constitution** — a few unchangeable principles that guarantee it stays free and uncapturable, no matter who runs it later.

It does not lend. It does not decide. It does not guarantee. It is the trustworthy foundation others build on.

---

## Where does the trust come from? (CC does not invent it)

If CC isn't a bank and doesn't lend, how does it know who's creditworthy? It doesn't — **CC gives a portable form to trust that close-knit communities and trading networks already produce.**

When Ireland's banks closed for months in 1970, the economy kept running. People paid each other with cheques the banks couldn't process — and the local pubs and small shops quietly *became* the banking system, vouching for and clearing those cheques. Why them? Because a shopkeeper who has dealt with you for years already knows whether you're good for the money. The knowledge was always there; the closure just revealed it.

CC works the same way. The organisations that vouch — the **issuers** — are existing local figures who already see how a person conducts themselves:

- **Commercial nodes** who have seen money actually move: the wholesaler who fronts a contractor materials, the supplier who extends trade credit, the mobile-money agent, the microfinance group, the co-op. (These are often the strongest issuers — they've watched the money, not just the person.)
- **Community nodes** of any kind — a chamber of commerce, trade association, cooperative, civic or religious body. Every culture has its "pub equivalent"; it just looks different from place to place.

Design rules keep this fair:

- **Many nodes, never one.** Because anyone can be vouched for by *several* kinds of node, no single institution is a gatekeeper. This protects the outsider, the minority, the newcomer — and stops any one node abusing a monopoly.
- **Different vouches carry different weight.** Someone who has seen your money move counts for more than someone who has seen only your good character. The record declares which kind it is.
- **Every vouch records what the voucher stands to lose.** Where an organisation genuinely can't stake (an NGO or registry attesting a plain fact), the record says so openly — and the market weighs an unbacked vouch accordingly.

And it grows the way trust historically travelled: **start inside one tight community**, prove it works, then **let good standing become portable between communities** — so a reputation earned in one place can open a door in the next.

---

## The constitution (the "unchangeable principles")

The candidate non-negotiables — the part that can never be amended, that protects the mission from everyone, including us:

- The standard is **free, forever** — a person's own reputation never carries a toll, not for holding, showing, disputing, or withdrawing it.
- The record **belongs to the person**, controlled by their consent.
- The rules are **public and auditable** — no secret scoring.
- **No lender, government, or funder controls** how creditworthiness is judged.
- Revenue is **never tied to whether a loan is approved or repaid.**
- The **core stays small** — it does not become a lender or a bureau.
- **CC holds no data and runs no register.** Verification never requires a record's contents to leave the holder's device.
- **History is never erased** — only dated, hidden, and priced.

---

## One more thing it quietly solves

People worry: *what happens when a borrower loses their phone, and with it their records?*

Because CC is built on **vouching** — your standing is partly held by the people who know you — the answer is built in. If you lose everything, your community can re-vouch you back into existence. **The same mechanism that builds your reputation is the one that recovers it.** Most systems bolt recovery on as an afterthought; for CC it comes for free, because it's the same idea. This matters most for exactly the people CC exists for: the displaced, the stateless, those whose own government may not vouch for them.

---

*Companion documents: the **Standard Specification v0.3** (the authoritative reference — all eight foundation decisions D1–D8 and the three ratifications R1–R3 are recorded there), "What We're Actually Building" (the concrete build), "Foundations and Lineage" (the why), and the "Session Notes" (the reasoning and the map).*
