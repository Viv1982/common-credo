# Contributing to Common Credo core

## Licence boundary — read before touching anything here

`core/` is Apache-2.0. It is the reusable, embeddable record/seal/verify/
cancellation-list/dispute/withdrawal/bundle logic — anyone should be able
to embed it into their own lending tool, proprietary or not, without a
network-copyleft obligation. This matches Common Credo's own principle
that building on the standard needs no permission.

The apps that ship on top of it (`issuer-tool/`, `holder-tool/`, and any
future "check"/verifier app) are AGPL-3.0. AGPL's network-copyleft clause
exists specifically so a vendor cannot fork one of the free white-label
apps into a closed, resold service without contributing changes back.

**The rule: `core/lib/` must never `require()` or `import` anything from
`issuer-tool/`, `holder-tool/`, or any other app.** The dependency arrow
only ever points one way — apps depend on `core/`, never the reverse. A
pull request that crosses this boundary breaks the licensing model, not
just a style rule, and should be rejected on that basis alone.

Before merging, grep `core/lib` for any import path reaching into a
sibling app directory and confirm there are none.
