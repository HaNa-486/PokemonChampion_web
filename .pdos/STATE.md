# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 35
- Updated: 2026-09-02T00:02:36+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Scrapbook UAT correction locally verified; commit and replacement Dev deployment pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: 4b6c05e0d4f8dc6d650c84c7c9469017abf861d2

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Fix five UAT findings covering inline detail density, Workbench/team action separation, AP/nature visibility, and quick-finder localization.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: corrected exact candidate must pass checks and replace Dev version 34; explicit product-owner UAT approval is then required before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: In-progress UAT corrections remove duplicate inline base stats, constrain the move list to internal scrolling, separate scrapbook save from explicit team addition, show per-stat AP/nature effects, and localize quick-finder type/form options.
- Verification evidence: `pnpm verify:deploy` passes on the correction source: lint 0 errors/15 warnings, TypeScript, 358-form and Traditional Chinese audits, 18 Vitest files/144 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite passes 11 tests, including save-without-team-mutation, explicit team addition, inline base-stat omission, AP/nature visibility, and Chinese quick-finder labels.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Version 34 is superseded by the five reported UAT findings and must not be approved. A corrected owner-only Dev version is pending.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Commit the exact locally verified correction, run `verify:dev`, and deploy a corrected owner-only Dev version. No pull request or production action before explicit approval.

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
