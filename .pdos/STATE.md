# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 5
- Updated: 2026-08-25T05:00:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: expanded UAT remediation locally verified; exact commit and renewed Dev/UAT deployment pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: 2e24f91593a7fdf86f3cf0ea19710629521a0837

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Existing members are editable in place, and all build choices are searchable and understandable without external lookup.
- Critical journey: open selected team -> edit member -> switch form/item if needed -> search/read/select moves/ability/item -> adjust AP/nature -> save -> same team slot updates.
- Non-goals: strategic move recommendations, drag-reordering, or automatic production promotion.

## Current work

- Current slice: Complete in-place editing, rich selectors, locale/modal consistency, and readable build summaries.
- Active workstreams: `workstreams/2026-08-20-team-member-edit-move-picker.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`
- Blocking dependencies: exact commit, Dev verification/deploy, renewed product-owner UAT, PR check, and clean independent review.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Added Mega-to-regular editing, searchable grouped ability/item pickers with persisted detailed/compact styles, Other item filtering, document Escape for dialogs, locale persistence/browser inference, localized battle rows, visible move mechanics, and AP/nature team summaries.
- Verification evidence: `pnpm verify:deploy` passed after final code/spec cleanup, including form/localization audits, 17 test files / 115 tests, production build, and 10 built-output/API checks.
- Not verified: complete deployment gate, exact Dev build/deploy, and real keyboard/touch/responsive UAT.
- Residual risks: Picker geometry and all dialog/locale journeys must be checked on the isolated Dev site.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, and deploy that commit to Champions Lab Dev for renewed UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
