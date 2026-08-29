# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 12
- Updated: 2026-08-29T09:17:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: expanded catalog interaction candidate locally verified; exact-commit Dev redeployment and UAT pending

## Repository identity

- Branch: codex/catalog-type-order-total-stat
- Observed commit: release-candidate branch HEAD (the commit hash is recorded by the deployment/version evidence rather than embedded in its own tree)

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Database filters use consistent domain ordering, reset quickly, preserve per-view state until reload, and expose intuitive comparison sorting.
- Critical journey: filter one database -> switch among catalog and speed views without losing state -> clear filters when desired -> sort numeric/mechanic columns descending with one click.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Add clear actions to remaining catalogs, default the team tray closed, make selected sort columns descending-first, and preserve all five view states until reload.
- Active workstreams: `workstreams/2026-08-29-catalog-session-memory-sort-defaults.md` is locally verified; it supersedes the previous Dev v19 UAT candidate while retaining the completed TOT/type-order work.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact-commit Dev deployment and product-owner UAT; PR/check/review remain post-UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: In addition to shared type ordering, Move DB clear-all, and computed TOT filtering/sorting, Ability and Held Item databases now clear all filters in one action; the team tray starts collapsed; selected Pokémon and move columns sort descending on first click; every main view retains its React state while inactive views emit no hidden DOM.
- Verification evidence: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 132 tests, successful production build, and 10 built-output/API checks. The full component suite passed 48/48 and the focused regression set passed 8/8.
- Not verified: exact-commit Dev redeployment, product-owner UAT, and browser visual QA at 390/768/1440; no upstream/generated/form mapping changed, so `data:audit:live` was not applicable.
- Residual risks: responsive visual fit, collapsed-tray discoverability, and interaction feel require Dev UAT; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the exact verified expanded candidate, run `pnpm verify:dev`, redeploy that exact commit to Champions Lab Dev, and restart focused UAT before opening a PR.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-29-catalog-type-order-total-stat.md`
- `workstreams/2026-08-29-catalog-session-memory-sort-defaults.md`
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
