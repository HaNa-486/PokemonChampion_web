# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: active
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-29T19:10:41Z
- Branch: codex/type-chart-tab
- Base commit: ea7c417902287d4fe908e98088a14712db55c024
- Scope: Refine the first-class Type Chart tab through UAT, including adaptive cell content and temporary withdrawal of the Speed Compare UI.
- Files or areas at risk: ChampionsApp navigation, database views, type chart rendering, responsive navigation, product specification, deployment checklist, tests

## Coordination

- Overlap checked: `ChampionsApp` also changed in the catalog-session workstream, but that work is already merged into the current `main` base at `ea7c417`; this slice extends the merged navigation without reverting its state-retention behavior.
- Dependencies: exact candidate commit, Dev build/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Second UAT revision scales compact type codes and explicit multiplier labels with their cells while retaining accessible text and the no-scroll matrix. Speed Compare navigation, React views, UI tests, and dedicated CSS were removed; the dormant domain/API contract remains.
- Verification: `verify:deploy` passed with lint 0 errors, typecheck, both data audits, 17 test files / 132 tests, build, and 10 rendered/API checks. Browser geometry at 390x844, 768x1024, and 1440x900 confirmed 18 rows / 324 cells, equal client/scroll dimensions, no page-width overflow, full matrix inside each viewport, responsive multiplier fonts, and no Speed Compare tab.
- Residual risks: Physical readability below the supported 390px width cannot be guaranteed; product-owner UAT and replacement Dev deployment are pending. Unrelated legacy F-006 PDOS records still fail strict validation.
- Next safe action: Commit the exact candidate, run `verify:dev`, replace the owner-only Dev deployment, and restart focused UAT.
