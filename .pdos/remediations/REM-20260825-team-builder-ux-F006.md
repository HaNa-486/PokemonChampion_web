# REM-20260825-team-builder-ux-F006

- Finding: F-006 — effective-form usage keys and explicit Mega compatibility
- Status: implemented; exact-candidate Dev UAT pending
- Owner: Codex
- Updated: 2026-08-25T12:08:00Z

## Problem

An earlier review recommended reloading battle data for every base/Mega form change. The product owner confirmed that all Mega forms must instead reuse their explicitly mapped regular form's usage data and that the upstream `gallademega` source is erroneous for this product. The same transition logic also treated every form sharing `speciesKey` as a valid Mega precursor, which could let a regional sibling such as Galarian Slowbro use Slowbronite.

## Resolution

- Cache and select recommendation data by the authoritative regular-form `battleDataKey`; reject `gallademega` during synchronization and audits.
- Reuse one response when base and Mega share a key; fetch the effective form only when its key genuinely changes.
- Map each Mega Stone to one explicit compatible regular-form ID; retain `speciesKey` only for duplicate-team legality.
- Reconcile illegal moves/abilities after a distinct-key response without overwriting user item, nature, or AP choices.
- Show the aggregated-statistics note only when the Mega and its explicit base actually share a key.

## Evidence

- Dedicated regressions cover Blastoise → Mega Blastoise one-key reuse, Gallade → Mega Gallade distinct-key loading, and Galarian Slowbro rejecting Slowbronite transformation.
- `pnpm verify:deploy` passed: 17 files / 121 tests, production build, form and Traditional Chinese audits, and 10 built-output/API checks.

## Remaining gate

Commit the exact candidate, run `pnpm verify:dev`, deploy that commit to Champions Lab Dev, and obtain renewed focused product-owner UAT before updating PR #7.
