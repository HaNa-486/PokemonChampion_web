# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 13
- Updated: 2026-08-29T15:59:58Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Type Chart navigation candidate locally verified; exact-commit Dev deployment and UAT pending

## Repository identity

- Branch: codex/type-chart-tab
- Observed commit: ea7c417902287d4fe908e98088a14712db55c024 plus the uncommitted Type Chart candidate

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Core reference tools, including the complete type matchup chart, are easy to find in one consistent primary navigation.
- Critical journey: open the Type Chart tab -> inspect the full 18×18 matrix in the current language -> scroll both axes while sticky labels remain usable -> switch back to another primary view.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Replace the obtrusive floating Type Chart control with a localized first-class application tab.
- Active workstreams: `workstreams/2026-08-29-type-chart-tab.md`; the previously recorded catalog-session changes are merged into current `main` and preserved in this candidate.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact-commit Dev deployment and product-owner UAT; PR/check/review remain post-UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: A localized Type Chart tab now sits between Held Item DB and Speed Compare; it renders the existing complete chart within the application. The desktop floating panel, mobile floating link, and obsolete styles were removed, while `/type-chart` remains available directly.
- Verification evidence: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 133 tests, successful production build, and 10 built-output/API checks. Focused Type Chart tests passed 2/2.
- Not verified: exact-commit Dev redeployment, product-owner UAT, and browser visual QA at 390/768/1440; no upstream/generated/form mapping changed, so `data:audit:live` was not applicable.
- Residual risks: responsive navigation fit plus real scroll/sticky behavior at 390/768/1440 require Dev UAT; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the exact verified expanded candidate, run `pnpm verify:dev`, redeploy that exact commit to Champions Lab Dev, and restart focused UAT before opening a PR.

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
