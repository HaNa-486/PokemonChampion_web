# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 15
- Updated: 2026-08-29T18:17:21Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: no-scroll responsive Type Chart revision locally verified; exact commit, Dev build, and replacement deployment pending

## Repository identity

- Branch: codex/type-chart-tab
- Observed commit: 6fbb4f0d08c7295bb726be46ebba9ef1ec3284e3

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Core reference tools, including the complete type matchup chart, are easy to find in one consistent primary navigation.
- Critical journey: open the Type Chart tab -> see all 18 attack rows and 18 defense columns together without internal scrolling at 390/768/1440 -> identify compact type codes through full accessible names -> switch back to another primary view.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Fit the complete localized 18×18 Type Chart into supported viewports without internal horizontal or vertical scrolling.
- Active workstreams: `workstreams/2026-08-29-type-chart-tab.md` is active after product-owner UAT feedback; the previously recorded catalog-session changes are merged into current `main` and preserved in this candidate.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: full local gate, exact-commit replacement Dev deployment, and restarted product-owner UAT; PR/check/review remain post-UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: The Type Chart uses a fixed-layout responsive matrix, viewport-derived row height, compact localized type codes below desktop width, tighter explanatory framing, and no internal overflow container. The complete 18×18 relationship remains in one view while full type names remain accessible.
- Verification evidence: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 133 tests, successful production build, and 10 built-output/API checks. Focused Type Chart tests passed 2/2. Browser geometry at 390×844, 768×1024, and 1440×900 confirmed 18 rows / 324 cells, equal client and scroll dimensions on both axes, no page-width overflow, and the full table bottom inside each viewport.
- Superseded deployment: Dev version 24 at exact commit `6fbb4f0d08c7295bb726be46ebba9ef1ec3284e3` does not include this UAT revision and must not be approved.
- Not verified: exact committed Dev build, replacement Dev deployment, and product-owner UAT; no upstream/generated/form mapping changed, so `data:audit:live` is not applicable.
- Residual risks: physical readability below the supported 390px viewport cannot be guaranteed; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the exact candidate, run `verify:dev`, replace the owner-only Dev deployment, and restart focused UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-29-type-chart-tab.md`
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
