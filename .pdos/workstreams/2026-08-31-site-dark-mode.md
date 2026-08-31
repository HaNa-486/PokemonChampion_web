# Workstream: Add a full-site BD/WP theme switch between format and locale controls, defaulting to dark mode.

- Status: active
- Started: 2026-08-31T02:53:25Z
- Updated: 2026-08-31T03:44:35Z
- Branch: codex/dark-mode
- Base commit: 2f04fb164f3a77990a425a39f58621fb02a33b85
- Scope: Add a full-site BD/WP theme switch between format and locale controls, follow the system theme on first use, and resolve dark-mode UAT contrast/action-control findings.
- Files or areas at risk: ChampionsApp header, global theme tokens, dialogs, tables, type chart, admin, persistence, responsive/accessibility tests

## Coordination

- Overlap checked: no active workstream overlaps the header, theme tokens, or preference state. Two pre-existing uncommitted files only record the completed Type Chart production release and are preserved.
- Dependencies: exact candidate commit, Dev verification/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: BD/WP is now a two-option segmented control with clear active state and retained hover guidance. First use and unoverridden live changes follow the system theme, while manual choices persist. SPE/TOT and add-to-team colors use dedicated dark-mode semantics.
- Verification: `pnpm verify:deploy` passed with 17 Vitest files/133 tests, the production build, and 13 built-output/API tests; the 49 focused component tests cover system-theme behavior and the revised control. Dev version 29 is superseded by these changes.
- Residual risks: Replacement Dev/UAT visual review at 390/768/1440 is pending. Existing unrelated F-006 PDOS records still fail strict state validation. No data mapping changed, so the live data audit is not applicable.
- Next safe action: Commit the replacement candidate, run `pnpm verify:dev`, deploy the exact replacement to owner-only Champions Lab Dev, and request focused UAT.
