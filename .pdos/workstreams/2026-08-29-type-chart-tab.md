# Workstream: Replace the floating type matchup affordance with a first-class application tab.

- Status: completed
- Started: 2026-08-29T15:51:33Z
- Updated: 2026-08-30T02:31:00Z
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
- Verification: Owner-only Dev version 28 at exact candidate `1c19e97074d300548eedd441c249d4d34b35b92e` passed product-owner UAT; GitHub verification passed; the final independent review was clean. `pnpm verify:deploy` passed again on exact merge commit `2f04fb164f3a77990a425a39f58621fb02a33b85` with 132 unit tests and 13 built-output/API tests.
- Release: PR #9 merged as `2f04fb164f3a77990a425a39f58621fb02a33b85`; public Champions Lab version 31 deployed successfully. Production smoke testing confirmed the homepage, five-tab navigation, no Speed Compare entry, and the complete 18-row/18-column Type Chart.
- Residual risks: Physical readability below the supported 390px width cannot be guaranteed. Unrelated legacy F-006 PDOS records still fail strict validation.
- Next safe action: Monitor normal production use; open a new scoped workstream for any follow-up change.
