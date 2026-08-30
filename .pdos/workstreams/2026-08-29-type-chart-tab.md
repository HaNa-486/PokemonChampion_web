# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: active
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-30T01:39:00Z
- Branch: codex/type-chart-tab
- Base commit: ea7c417902287d4fe908e98088a14712db55c024
- Scope: Refine the first-class Type Chart tab through UAT, including adaptive cell content and temporary withdrawal of the Speed Compare UI.
- Files or areas at risk: ChampionsApp navigation, database views, type chart rendering, responsive navigation, product specification, deployment checklist, tests

## Coordination

- Overlap checked: `ChampionsApp` also changed in the catalog-session workstream, but that work is already merged into the current `main` base at `ea7c417`; this slice extends the merged navigation without reverting its state-retention behavior.
- Dependencies: exact candidate commit, Dev build/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: The second independent PR review found a stale README feature bullet plus missing built-route coverage for identical speed ties with non-default modifiers. The feature claim is removed and a built-output fixture now verifies stable tied input order plus returned calculation traces.
- Verification: `pnpm verify:deploy` passed with 132 unit tests and 13 built-output/API tests. Dev version 27 passed UAT but is superseded because these fixes create a new exact candidate.
- Residual risks: Physical readability below the supported 390px width cannot be guaranteed; a replacement Dev deployment, renewed minimal product-owner UAT, and final re-review are pending. Unrelated legacy F-006 PDOS records still fail strict validation.
- Next safe action: Commit the second review fixes, run `pnpm verify:dev`, deploy the exact replacement candidate to owner-only Dev, then request renewed minimal product-owner UAT.
