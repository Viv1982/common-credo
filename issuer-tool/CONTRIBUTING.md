# Contributing to the Common Credo issuer tool

## Licence boundary — read before adding a dependency

This app is **AGPL-3.0** (`src/`, `bin/`) — see `LICENSE-AGPL-3.0`. AGPL's
network-copyleft clause exists specifically so a vendor cannot fork the
free app into a closed, resold service without contributing changes back.

The reusable record/seal/verify/cancellation-list/dispute/withdrawal/
bundle logic this app depends on no longer lives here — it moved to the
shared `../core/` package (Apache-2.0, depended on via `common-credo-core`
in `package.json`, a `file:../core` local dependency), so it can also be
embedded in `../holder-tool/` and any future verifier app without an
AGPL obligation reaching them. See `../core/CONTRIBUTING.md` for that
package's own licence-boundary rule (its logic must never import from
this app or any other).

This app's own code (`src/`, `bin/`) may freely `require('common-credo-core/lib/...')`
— that direction is fine. It must never be duplicated back into a local
`lib/` here; if something reusable is missing from `core/`, add it there.
