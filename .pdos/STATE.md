# PDOS state

Keep this file concise. Every fresh PDOS context reads it first.

- Protocol version: 0.3.0
- State revision: 7
- Updated: 2026-08-13T08:20:00Z
- State confidence: high
- Phase: verified candidate awaiting exact commit and isolated Dev/UAT deployment

## Repository identity

- Branch: codex/traditional-chinese-localization
- Worktree: C:\Users\091\codex_workspace\BDWP\PokemonChampion
- Base commit: 29bea4dbb81b4630a2636756113b379fad41e8f3

## Product anchors

- Primary user: Traditional Chinese Champions Lab users comparing current-Regulation Pokémon, moves, abilities, and held items.
- Product outcome: Switching to Traditional Chinese produces a genuinely Chinese catalog and interaction flow, without English descriptions masquerading as localized data.
- Critical journey: switch to zh-Hant -> browse/filter catalogs -> inspect Pokémon/forms -> read move/ability/item tooltips and current-season usage -> build a team.
- Non-goals: full Admin publish/revert workflow; human copy-editing of every machine-translated Champions-specific sentence in this release.

## Current work

- Current slice: Complete zh-Hant catalog and UI taxonomy localization.
- Active workstream: `workstreams/2026-08-13-traditional-chinese-localization.md`
- Blocking dependency: Exact commit must pass `pnpm verify:deploy` and `pnpm data:audit:live`, then pass `pnpm verify:dev` and be deployed privately to Champions Lab Dev for product-owner UAT before PR.
- Consequential open decision: Production promotion remains a separate approval after PR checks, independent review, and merge.

## Handoff

- What changed: Rebuilt zh-Hant descriptions from complete effective Champions mechanics; protected official entity names; added per-record provenance, semantic/numeric/no-English/no-placeholder audits, reviewed critical overrides, and completed Chinese taxonomy/table/filter/item-single-use UI coverage.
- Verification evidence: `pnpm verify:deploy` passed 17 files / 104 tests plus 10 built-worker checks; `pnpm data:audit:zh` passed 539 moves / 200 abilities / 148 items; `pnpm data:audit:live` passed 358 snapshot / 236 live forms across 18 groups.
- Not verified: Dev artifact, Dev deployment, and product-owner visual UAT. Local in-app browser binding was unavailable, so visual QA moves to the isolated Dev deployment.
- Residual risks: Raw machine translations remain clearly identified and require progressive editorial review; Admin approval/audit/revert remains a separate P1 workstream.
- Next safe action: Commit the exact verified candidate, run `pnpm verify:dev`, deploy that commit to Champions Lab Dev, and provide focused UAT checks.

## Read next

- `workstreams/2026-08-13-traditional-chinese-localization.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
