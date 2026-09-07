# Common Credo

**An open standard and free tools for portable proof of trust — built on Nostr.**

🔗 **Try it live:** [common-credo.pages.dev](https://common-credo.pages.dev) — the issuer, holder, and verifier tools, plus the full spec and background, all running there. No install needed to look around.

Spec: [Common_Credo_Standard_Spec_v0_3.md](./Common_Credo_Standard_Spec_v0_3.md)
Plain-English overview: [Common_Credo_Non_Technical_Brief_v3.md](./Common_Credo_Non_Technical_Brief_v3.md)

## Why this exists

I work in finance with NGOs, co-ops, and local contractors across Asia — the kind of businesses that are well known and trusted within their own community, but invisible outside it. Show up somewhere new — a bank, a new buyer, an aid agency's procurement process — and you're a stranger with no way to prove what everyone back home already knows about you.

Formal credit systems don't solve this either: too small and informal for a bank or a development finance institution, too commercial for microfinance. That gap is where a lot of otherwise capable, honest local businesses get stuck.

I'm not a developer. I built this with Claude, out of that gap — a way for the trust that already exists locally to travel with the person who earned it, instead of staying trapped in one place.

## What Common Credo does

A trusted local issuer (a trading counterparty, co-op, chamber — anyone who already has real dealings with someone) vouches for that person in a signed, tamper-evident record. The person holds that record themselves, on their own device, under their own key — not controlled by the issuer, not stored on a company's server. They can then show it to anyone: a bank, a new buyer, an NGO partner.

It's a format and a set of free tools, not a company or a platform. Nobody owns it, nobody can shut it down, and it charges nothing.

## The three tools

| Tool | What it's for | License |
|---|---|---|
| [`issuer-tool/`](./issuer-tool) | For the trusted party issuing a vouch — manage records, publish/cancel via Nostr relays | AGPL-3.0 |
| [`holder-tool/`](./holder-tool) | For the person holding their own record — independent key, can flag disputes without the issuer's cooperation | AGPL-3.0 |
| [`verifier-tool/`](./verifier-tool) | For anyone checking a record's validity — includes a single-file standalone version, no install required | AGPL-3.0 |
| [`core/`](./core) | Shared library — signing, record format, relay handling | Apache-2.0 |

Each tool folder has its own README/CONTRIBUTING notes and license file. All three are also live and usable right now at [common-credo.pages.dev](https://common-credo.pages.dev) — the fastest way to actually see how they work before reading code.

## Built on Nostr

Common Credo reuses Nostr's signing method, relay network, and tamper-evident message IDs for the one thing that needs to be public — the cancellation list. The actual record itself never touches Nostr or any network; it stays on the holder's device. If a better public network exists in future, the same standard can run on that instead — Common Credo doesn't depend on Nostr existing forever.

## Running a tool locally

Each tool is a standalone Node.js app:

```bash
cd issuer-tool   # or holder-tool, verifier-tool
npm install
npm start
```

The verifier also has a zero-install option — open `verifier-tool/standalone/index.html` directly in a browser.

## Status

Spec is at v0.3. All three tools are built and pass their automated test suites. This is a genuine early-stage project, not a finished product — it's public specifically to get real scrutiny.

## Feedback wanted

I'd genuinely value honest, critical review: where does this hold up, and where is it naive? Technical issues, protocol misunderstandings, and design flaws are all welcome — open an issue, or find me on Nostr.

## License

Split by component: the core library is Apache-2.0; the three white-label apps are AGPL-3.0. See each folder's LICENSE file.
