# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 3
- Updated: 2026-08-20T07:32:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: team-builder UX remediation locally verified; exact commit and Dev/UAT deployment pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: 9322332253ed67cf6318b6e2c8515375aa661f1b

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
- Blocking dependencies: exact commit, Dev verification/deploy, product-owner UAT.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Team store can replace a member without changing its ID/position; every team card has Edit; builder edit mode restores saved fields and validates the full replacement team; four native move selects were replaced with localized searchable rich comboboxes.
- Verification evidence: `pnpm verify:deploy` passed, including lint (pre-existing warnings only), typecheck, 358-form integrity audit, Traditional Chinese semantic audit for 539 moves/200 abilities/148 items, 17 unit-test files / 107 tests, production build, and 10 rendered/API tests.
- Not verified: exact Dev build/deploy and real responsive/touch UAT.
- Residual risks: Move-result panel geometry and touch feel must be checked on the isolated Dev site at 390, 768, and 1440 px.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, and deploy that commit to Champions Lab Dev for UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
