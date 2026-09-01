# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 33
- Updated: 2026-09-01T18:40:16+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Scrapbook correction candidate locally verified; commit and replacement Dev deployment pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: 604ed4ec14ed191f144f8cd42225ce66de7c1a52

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Replace the prior scrapbook data model and comparison UX with configurable build cards, cross-tag actions, direct tag/book management, and persisted page state.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: replacement candidate must pass exact-source checks and owner-only Dev deployment; then explicit product-owner Dev UAT approval is required before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: In-progress replacement adds neutral initial builds, multiple named configurations per Pokémon, shared versus independent copies, cross-tag moves, direct tag management, whole-book duplication, auto-saved Workbench edits, richer comparison rows, deterministic book preselection, and persisted finder/expansion/toggle state.
- Verification evidence: `pnpm verify:deploy` passes on the replacement source: lint 0 errors/15 warnings, TypeScript, 358-form and Traditional Chinese audits, 18 Vitest files/142 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite has 9 passing tests including auto-save through the real Workbench. Browser automation is temporarily blocked by the Codex Node REPL kernel-assets path error; no browser result is claimed.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Version 33 is superseded for acceptance by the clarified requirements and must not be approved. A replacement owner-only Dev version is pending.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Commit the exact locally verified candidate, run `verify:dev`, and deploy the replacement exact commit to owner-only Champions Lab Dev; use focused owner UAT to cover the browser journeys that the broken local automation kernel could not execute. No pull request or production action before new UAT approval.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-31-scrapbook.md`
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
