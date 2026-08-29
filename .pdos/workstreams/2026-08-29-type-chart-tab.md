# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: active
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-29T19:32:33Z
- Branch: codex/type-chart-tab
- Base commit: ea7c417902287d4fe908e98088a14712db55c024
- Scope: Refine the first-class Type Chart tab through UAT, including adaptive cell content and temporary withdrawal of the Speed Compare UI.
- Files or areas at risk: ChampionsApp navigation, database views, type chart rendering, responsive navigation, product specification, deployment checklist, tests

## Coordination

- Overlap checked: `ChampionsApp` also changed in the catalog-session workstream, but that work is already merged into the current `main` base at `ea7c417`; this slice extends the merged navigation without reverting its state-retention behavior.
- Dependencies: exact candidate commit, Dev build/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Independent PR review found three consistency/coverage issues. Public metadata no longer advertises Speed Compare, built-output tests now exercise the retained speed API contract, and the later E2E/load/milestone specification consistently defers the withdrawn UI.
- Verification: focused production build and 12 built-output tests passed. Version 26 and its UAT are superseded because this exact candidate changes after UAT; full gates and Dev deployment must repeat.
- Residual risks: Physical readability below the supported 390px width cannot be guaranteed; renewed product-owner UAT and final re-review are pending. Unrelated legacy F-006 PDOS records still fail strict validation.
- Next safe action: Run the full gate, commit and deploy the exact review-fix candidate to owner-only Dev, then request renewed product-owner UAT.
