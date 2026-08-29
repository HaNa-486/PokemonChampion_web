# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: active
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-29T18:17:21Z
- Branch: codex/type-chart-tab
- Base commit: ea7c417902287d4fe908e98088a14712db55c024
- Scope: Replace the floating type matchup affordance with a first-class application tab.
- Files or areas at risk: ChampionsApp navigation, type chart rendering, responsive navigation, tests

## Coordination

- Overlap checked: `ChampionsApp` also changed in the catalog-session workstream, but that work is already merged into the current `main` base at `ea7c417`; this slice extends the merged navigation without reverting its state-retention behavior.
- Dependencies: exact candidate commit, Dev build/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Product-owner UAT requested a no-scroll, full-matrix responsive presentation, superseding version 24. The revision uses a fixed-layout matrix, viewport-derived row height, compact localized type codes below desktop width, and removes internal overflow while retaining full accessible names.
- Verification: `verify:deploy` passed with lint 0 errors, typecheck, both data audits, 17 test files / 133 tests, production build, and 10 rendered/API checks; focused Type Chart tests pass 2/2. Browser geometry at 390×844, 768×1024, and 1440×900 confirmed 18 rows / 324 cells, equal client/scroll dimensions on both axes, no page-width overflow, and the complete table inside each viewport.
- Residual risks: A literal guarantee for arbitrary tiny viewports conflicts with readable labels; target supported widths are 390/768/1440 with adaptive abbreviations and density.
- Next safe action: Commit the exact candidate, run `verify:dev`, replace the owner-only Dev deployment, and restart focused UAT.
