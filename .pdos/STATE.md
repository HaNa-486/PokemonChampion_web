# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 26
- Updated: 2026-08-31T03:44:35Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Dark-mode UAT feedback addressed locally; replacement exact commit and Dev deployment pending

## Repository identity

- Branch: codex/dark-mode
- Observed commit: f5a1137e0303d4d5b4a21bbaa95fd74f50117b52

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Every public and administrative surface remains readable in a consistent dark or light theme while preserving the dense competitive workflow.
- Critical journey: first visit follows the system theme -> see BD and WP together between format and locale controls with the current mode selected -> manual choice persists -> dark tables retain neutral stat values and a recognizable add-to-team action.
- Non-goals: changing data, battle formulas, catalog behavior, navigation structure, or automatic production promotion.

## Current work

- Current slice: Resolve dark-theme UAT findings and follow the system theme on first use.
- Active workstreams: `workstreams/2026-08-31-site-dark-mode.md` is active.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: replacement exact candidate commit, repeat Dev verification/deployment, and renewed product-owner UAT.
- Consequential open decisions: none for this release.

## Handoff

- What changed: BD and WP now appear together as an accessible segmented control with an explicit current state and preserved hover text. First use follows `prefers-color-scheme`, including live system changes while no manual override exists; a manual choice persists. Dark-mode SPE/TOT values now use the normal stat color, and the add-to-team control uses dedicated action colors instead of the light text token.
- Verification evidence: `pnpm verify:deploy` passed with 17 Vitest files/133 tests, the production build, and 13 built-output/API tests. The focused component suite passed 49 tests, including system-theme changes, explicit override persistence, both visible labels, ordering, and hover text. Local preview returned HTTP 200.
- Superseded Dev deployment: Owner-only Champions Lab Dev version 29 at `f5a1137e0303d4d5b4a21bbaa95fd74f50117b52` is invalidated by the UAT fixes and must not be approved.
- Prior production baseline: Type Chart release remains deployed from merge commit `2f04fb164f3a77990a425a39f58621fb02a33b85` at `https://champions-lab.eddy8613.chatgpt.site`.
- Not verified: replacement exact commit, `pnpm verify:dev`, replacement Dev deployment, and renewed product-owner visual UAT at 390/768/1440; no upstream/generated/form mapping changed, so `data:audit:live` is not applicable.
- Residual risks: theme color quality still requires product-owner visual judgment in Dev UAT; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the replacement candidate, run `pnpm verify:dev`, deploy that exact commit to owner-only Champions Lab Dev, and request renewed focused UAT.

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
