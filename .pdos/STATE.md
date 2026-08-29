# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 17
- Updated: 2026-08-29T19:10:41Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: adaptive Type Chart labels and Speed Compare withdrawal locally verified; exact commit and replacement Dev deployment pending

## Repository identity

- Branch: codex/type-chart-tab
- Observed commit: dc8b8fdc8a5f12dccd0313165a7279d57d43d3b1

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Core reference tools, including the complete type matchup chart, are easy to find in one consistent primary navigation.
- Critical journey: open the Type Chart tab -> see all 18 attack rows and 18 defense columns together without internal scrolling at 390/768/1440 -> identify compact type codes through full accessible names -> switch back to another primary view.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Scale type labels and matchup multipliers to use their cells while retaining no-scroll completeness, and withdraw the Speed Compare UI.
- Active workstreams: `workstreams/2026-08-29-type-chart-tab.md` is active after a second product-owner UAT revision; the previously recorded catalog-session changes are preserved.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact candidate commit, Dev build/deployment, and restarted product-owner UAT; PR/check/review remain post-UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Type codes now fill substantially more of compact header/row cells and multiplier labels scale from a readable mobile minimum to 1rem on desktop. Color remains secondary to explicit `2×` / `½×` / `0×` text. The Speed Compare tab, React views, UI tests, and dedicated styles were removed; its tested domain/API capability remains dormant for possible future restoration.
- Verification evidence: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 132 tests, successful build, and 10 built-output/API checks. Browser geometry at 390×844, 768×1024, and 1440×900 confirmed 18 rows / 324 cells, equal client and scroll dimensions on both axes, no page-width overflow, the full table inside each viewport, adaptive multiplier font sizes of 9.92 / 11.904 / 15.75px, and no Speed Compare tab.
- Superseded deployment: Dev version 25 at exact commit `dc8b8fdc8a5f12dccd0313165a7279d57d43d3b1` does not include this second UAT revision and must not be approved.
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
