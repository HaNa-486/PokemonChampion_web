# Workstream: Add a full-site BD/WP theme switch between format and locale controls, defaulting to dark mode.

- Status: active
- Started: 2026-08-31T02:53:25Z
- Updated: 2026-08-31T03:09:49Z
- Branch: codex/dark-mode
- Base commit: 2f04fb164f3a77990a425a39f58621fb02a33b85
- Scope: Add a full-site BD/WP theme switch between format and locale controls, defaulting to dark mode.
- Files or areas at risk: ChampionsApp header, global theme tokens, dialogs, tables, type chart, admin, persistence, responsive/accessibility tests

## Coordination

- Overlap checked: no active workstream overlaps the header, theme tokens, or preference state. Two pre-existing uncommitted files only record the completed Type Chart production release and are preserved.
- Dependencies: exact candidate commit, Dev verification/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Added the BD/WP control in the requested header position; BD is the server and first-visit default, WP/BD persists locally, and shared theme tokens cover tables, filters, dialogs, builder, Type Chart, admin, mobile cards, alerts, and inputs. The standalone Type Chart follows and can change the same preference.
- Verification: `pnpm verify:deploy` passed with 17 Vitest files/133 tests, the production build, and 13 built-output/API tests. The focused component suite passed 49 tests; local preview returned HTTP 200. Typecheck and lint passed with 11 pre-existing warnings.
- Residual risks: Dev/UAT visual review at 390/768/1440 is pending. Existing unrelated F-006 PDOS records still fail strict state validation. No data mapping changed, so the live data audit is not applicable.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, deploy the exact commit to owner-only Champions Lab Dev, and request focused UAT.
