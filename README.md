# Common Credo

**An open standard and free tools for portable proof of trust — built on Nostr.**

Live site: [common-credo.pages.dev](https://common-credo.pages.dev)
Spec: [Common_Credo_Standard_Spec_v0_3.md](./Common_Credo_Standard_Spec_v0_3.md)
Plain-English overview: [Common_Credo_Non_Technical_Brief_v3.md](./Common_Credo_Non_Technical_Brief_v3.md)

## The problem

A local trader, supplier, or contractor can be well known and trusted within their own community — but that trust doesn't travel. Show up somewhere new, and you're a stranger with no way to prove what everyone back home already knows about you. Formal credit systems don't reach this group either: too small for banks and DFIs, too informal for microfinance.

## What Common Credo does

Common Credo lets a trusted local issuer (a trading counterparty, co-op, chamber — anyone who already has real dealings with someone) vouch for that person in a signed, tamper-evident record. The person holds that record themselves, on their own device, under their own key — not controlled by the issuer, not stored on a company's server. They can then show it to anyone: a bank, a new buyer, an NGO partner.

It's a format and a set of free tools, not a company or a platform. Nobody owns it, nobody can shut it down, and it charges nothing.

## The three tools

| Tool | What it's for | License |
|---|---|---|
| [`issuer-tool/`](./issuer-tool) | For the trusted party issuing a vouch — manage records, publish/cancel via Nostr relays | AGPL-3.0 |
| [`holder-tool/`](./holder-tool) | For the person holding their own record — independent key, can flag disputes without the issuer's cooperation | AGPL-3.0 |
| [`verifier-tool/`](./verifier-tool) | For anyone checking a record's validity — includes a single-file standalone version, no install required | AGPL-3.0 |
| [`core/`](./core) | Shared library — signing, record format, relay handling | Apache-2.0 |

Each tool folder has its own README/CONTRIBUTING notes and license file.

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

I'm not a developer — I built this with Claude, working from real experience with NGOs and trading co-ops across Asia. I'd genuinely value honest, critical review: where does this hold up, and where is it naive? Technical issues, protocol misunderstandings, and design flaws are all welcome — open an issue or reach out.

## License

Split by component: the core library is Apache-2.0; the three white-label apps are AGPL-3.0. See each folder's LICENSE file.
