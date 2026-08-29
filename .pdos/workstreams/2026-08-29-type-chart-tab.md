# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: active
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-29T15:59:58Z
- Branch: codex/type-chart-tab
- Base commit: ea7c417902287d4fe908e98088a14712db55c024
- Scope: Replace the floating type matchup affordance with a first-class application tab.
- Files or areas at risk: ChampionsApp navigation, type chart rendering, responsive navigation, tests

## Coordination

- Overlap checked: `ChampionsApp` also changed in the catalog-session workstream, but that work is already merged into the current `main` base at `ea7c417`; this slice extends the merged navigation without reverting its state-retention behavior.
- Dependencies: exact candidate commit, Dev build/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Added a localized Type Chart tab between Held Item DB and Speed Compare, rendered the existing complete chart inside the application, and removed the desktop floating panel, mobile floating link, and their unused styles while preserving the standalone `/type-chart` route.
- Verification: `pnpm verify:deploy` passed with lint 0 errors, typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves / 200 abilities / 148 items, 17 test files / 133 tests, a successful production build, and 10 built-output/API checks. Focused Type Chart tests passed 2/2, including English-to-Traditional-Chinese tab behavior.
- Residual risks: responsive navigation fit and real scroll/sticky behavior at 390/768/1440 remain for Dev UAT; strict PDOS validation remains blocked by pre-existing unrelated malformed F-006 records.
- Next safe action: commit the exact verified candidate, run `pnpm verify:dev`, deploy that exact commit to Champions Lab Dev, and request focused UAT.
