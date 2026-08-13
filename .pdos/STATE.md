# PDOS state

Keep this file concise. Every fresh PDOS context reads it first.

- Protocol version: 0.3.0
- State revision: 6
- Updated: 2026-08-13T06:52:00Z
- State confidence: high
- Phase: verified candidate awaiting isolated Dev/UAT deployment

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
- Blocking dependency: Exact commit must pass `pnpm verify:dev`, be deployed privately to Champions Lab Dev, and receive explicit product-owner UAT before PR.
- Consequential open decision: Production promotion remains a separate approval after PR checks, independent review, and merge.

## Handoff

- What changed: Complete names/descriptions for 358 Pokémon forms, 539 moves, 200 abilities, and 148 items; official Pokémon naming source; committed translation provenance; localized filters/table taxonomy/tooltips; fail-closed localization synchronization and tests.
- Verification evidence: `pnpm verify:deploy` passed (17 files / 99 tests plus 10 built-worker checks); `pnpm data:audit:live` passed 358 snapshot / 236 live forms across 18 groups.
- Not verified: Dev artifact, Dev deployment, and product-owner visual UAT.
- Residual risks: Machine translations require progressive editorial review; Admin approval/audit/revert remains a separate P1 workstream.
- Next safe action: Commit exact source, run `pnpm verify:dev`, deploy exact commit to Champions Lab Dev, and provide focused UAT steps.

## Read next

- `workstreams/2026-08-13-traditional-chinese-localization.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
