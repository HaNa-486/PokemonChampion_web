# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 4
- Updated: 2026-08-24T04:00:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: independent PR review fixes locally verified; new exact commit and renewed Dev/UAT deployment pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: 2e24f91593a7fdf86f3cf0ea19710629521a0837

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Existing members are editable in place, and move selection is searchable and understandable without external lookup.
- Critical journey: open selected team -> edit member -> search/read/select legal moves -> adjust fields -> save -> same team slot updates.
- Non-goals: strategic move recommendations, drag-reordering, or automatic production promotion.

## Current work

- Current slice: In-place team member editing and beginner-friendly searchable move picker.
- Active workstreams: `workstreams/2026-08-20-team-member-edit-move-picker.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`
- Blocking dependencies: new exact commit, Dev verification/deploy, renewed product-owner UAT, PR re-check, and clean independent re-review.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: In addition to the original editor and searchable move picker, ordinary item-only edits now preserve saved moves/ability, while Mega transitions reconcile legality; the combobox now supports active options, Arrow/Home/End navigation, Enter selection, duplicate-disabled skipping, and focus retention.
- Verification evidence: `pnpm verify:deploy` passed, including lint (pre-existing warnings only), typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves/200 abilities/148 items, 17 unit-test files / 109 tests, production build, and 10 rendered/API tests.
- Not verified: new exact Dev build/deploy and renewed real keyboard/responsive UAT.
- Residual risks: Item-only preservation and move-picker keyboard behavior must be checked on the isolated Dev site.
- Next safe action: Commit the new exact candidate, run `pnpm verify:dev`, and deploy that commit to Champions Lab Dev for renewed UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
