# Contributing to the Common Credo holder tool (hold-and-show)

## Licence boundary — read before adding a dependency

This app is **AGPL-3.0** — see `LICENSE-AGPL-3.0`. It depends on the
shared `../core/` package (Apache-2.0, via the `common-credo-core`
`file:../core` dependency in `package.json`) for all record/seal/verify/
cancellation-list/dispute/withdrawal/bundle logic. See
`../core/CONTRIBUTING.md` for that package's own licence-boundary rule.

This app's own code (`src/`) may freely
`require('common-credo-core/lib/...')`. It must never duplicate that
logic into a local `lib/` here — if something reusable is missing from
`core/`, add it there so `issuer-tool/` and any future verifier app can
use it too.
