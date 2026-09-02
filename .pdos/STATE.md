# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 39
- Updated: 2026-09-03T00:30:53+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Follow-up learnable-move sorting and reverse-lookup correction implemented; exact-candidate verification pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: 84f3a995e4b9cc9d133e2c4a74d09cee83c7e144

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Restore contextual ordering on the third learnable-table header activation and open the complete shared Reverse Lookup from compatible-Pokémon counts.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: explicit product-owner Dev UAT approval before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: Follow-up UAT remediation makes each learnable-move header cycle contextual default → initial direction → opposite direction → contextual default. The compatible-Pokémon count in both Pokémon detail and scrapbook inline intelligence now opens the exact shared Move DB Reverse Lookup instead of remaining a display-only count.
- Verification evidence: TypeScript and the focused Pokémon-detail/scrapbook suites pass (2 files, 61 tests), including third-click default restoration, full Reverse Lookup launch from both entry points, nested-dialog close behavior, and add-to-scrapbook availability. Exact-candidate deployment verification remains pending.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Owner-only version 36 remains live at `https://champions-lab-dev.eddy8613.chatgpt.site`, but the new findings invalidate it as the current candidate. A replacement exact candidate must pass release checks and be deployed before UAT resumes.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Run exact-candidate verification, commit, run Dev verification, and deploy a replacement owner-only Dev version. No pull request or production action before explicit UAT approval.

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
