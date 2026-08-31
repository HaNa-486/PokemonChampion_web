# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 24
- Updated: 2026-08-31T03:09:49Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Full-site dark-mode candidate verified locally; exact commit and Dev/UAT deployment pending

## Repository identity

- Branch: codex/dark-mode
- Observed commit: 2f04fb164f3a77990a425a39f58621fb02a33b85

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Every public and administrative surface remains readable in a consistent dark or light theme while preserving the dense competitive workflow.
- Critical journey: first visit loads BD dark mode -> switch to WP between format and locale controls -> navigate tables, dialogs, builder, and Type Chart -> refresh/remount and retain WP -> switch back to BD.
- Non-goals: changing data, battle formulas, catalog behavior, navigation structure, or automatic production promotion.

## Current work

- Current slice: Add a full-site BD/WP theme switch, defaulting to BD dark mode.
- Active workstreams: `workstreams/2026-08-31-site-dark-mode.md` is active.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact candidate commit, Dev verification/deployment, and product-owner UAT.
- Consequential open decisions: none for this release.

## Handoff

- What changed: Shared dark/light tokens now cover the site shell, tables, filters, dialogs, builder, Type Chart, admin controls, status surfaces, and responsive cards. The main header exposes a current-mode BD/WP button between format and language controls; the standalone Type Chart also exposes the preference. The default and server-rendered theme is BD dark mode, while explicit WP/BD choices persist locally across remounts and routes.
- Verification evidence: `pnpm verify:deploy` passed with 17 Vitest files/133 tests, the production build, and 13 built-output/API tests. The focused component suite passed 49 tests; typecheck and lint passed with only 11 pre-existing warnings. Local preview returned HTTP 200.
- Prior production baseline: Type Chart release remains deployed from merge commit `2f04fb164f3a77990a425a39f58621fb02a33b85` at `https://champions-lab.eddy8613.chatgpt.site`.
- Not verified: Dev deployment and product-owner visual UAT at 390/768/1440; no upstream/generated/form mapping changed, so `data:audit:live` is not applicable.
- Residual risks: theme color quality still requires product-owner visual judgment in Dev UAT; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the exact candidate, run `pnpm verify:dev`, deploy that commit to owner-only Champions Lab Dev, and request focused UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-31-site-dark-mode.md`
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
