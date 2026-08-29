# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 11
- Updated: 2026-08-29T08:15:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: catalog filter and TOT candidate locally verified; exact-commit Dev deployment and UAT pending

## Repository identity

- Branch: codex/catalog-type-order-total-stat
- Observed commit: release-candidate branch HEAD (the commit hash is recorded by the deployment/version evidence rather than embedded in its own tree)

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Database filters use consistent domain ordering, can be reset quickly, and expose total base stats for comparison.
- Critical journey: compare Pokémon -> filter by individual or total base stats -> sort TOT in either direction -> open details -> scan/filter learnable moves in the same type order.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Align Move DB and Pokémon-detail move type order with Pokémon DB, add Move DB clear-all, and expose computed TOT filtering/sorting.
- Active workstreams: none; `workstreams/2026-08-29-catalog-type-order-total-stat.md` is completed locally and awaits Dev UAT.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact-commit Dev deployment and product-owner UAT; PR/check/review remain post-UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Move DB and Pokémon-detail filters now derive type chips from the shared `ALL_TYPES` order; learnable moves use that same type rank after category; Move DB has a one-click clear action; Pokémon DB computes TOT from all six base stats and exposes it as a minimum filter and sortable column.
- Verification evidence: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 127 tests, successful production build, and 10 built-output/API checks. The targeted component suite passed 43/43.
- Not verified: exact-commit Dev deployment, product-owner UAT, and browser visual QA at 390/768/1440; no upstream/generated/form mapping changed, so `data:audit:live` was not applicable.
- Residual risks: visual fit of the seventh minimum-stat input and added desktop TOT column still requires Dev UAT; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the exact verified candidate, run `pnpm verify:dev`, deploy that exact commit to Champions Lab Dev, and request focused UAT before opening a PR.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-29-catalog-type-order-total-stat.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `remediations/REM-20260825-team-builder-ux-F004.md`
- `remediations/REM-20260825-team-builder-ux-F005.md`
- `remediations/REM-20260825-team-builder-ux-F006.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
