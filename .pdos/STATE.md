# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 37
- Updated: 2026-09-02T23:05:02+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Scrapbook learnable-move-table and stat-legibility UAT correction in verification

## Repository identity

- Branch: codex/scrapbook
- Observed commit: 3a0b97dd90f60d11c73981603456047f993a04c8

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Replace Pokémon detail and scrapbook learnable-move layouts with the Move DB table language and clarify scrapbook AP/nature effects.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: explicit product-owner Dev UAT approval before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: In-progress UAT corrections give Pokémon detail and scrapbook inline intelligence the same sortable learnable-move columns as Move DB except the Move-DB-only Properties column, add usable-Pokémon counts, preserve contextual scrapbook default ordering, and make invested/zero AP plus raised/lowered nature effects visually distinct.
- Verification evidence: `pnpm verify:deploy` passes: lint 0 errors/15 existing warnings, TypeScript, 358-form integrity audit, Traditional Chinese audit for 539 moves/200 abilities/148 items, 18 Vitest files/145 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite passes 12 tests, including first-click descending Power sort, usable-Pokémon count, absence of the Properties column, and distinct AP/nature semantics. The focused Pokémon-detail journey passes with the shared table and first-click descending Accuracy sort.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Owner-only version 35 remains live at `https://champions-lab-dev.eddy8613.chatgpt.site` but is invalidated by the latest product-owner findings. A replacement exact candidate must be verified and deployed before UAT resumes.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Complete full verification, commit the exact candidate, verify the Dev manifest, and deploy a replacement owner-only Dev version. No pull request or production action before explicit approval.

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
