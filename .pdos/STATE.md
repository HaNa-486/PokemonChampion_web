# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 6
- Updated: 2026-08-25T07:10:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: rank-aware UAT remediation locally verified; exact commit and renewed Dev/UAT deployment pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: cd99c6ae7b54321c9c9b3320f575fafd1f55bcfe

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Existing members are editable in place, and all build choices are searchable and understandable without external lookup.
- Critical journey: open selected team -> edit member -> switch form/item if needed -> search/read/select moves/ability/item -> adjust AP/nature -> save -> same team slot updates.
- Non-goals: strategic move recommendations, drag-reordering, or automatic production promotion.

## Current work

- Current slice: Complete in-place editing, rich selectors with real top-ten usage ranks, transparent upstream gaps, locale/modal consistency, and readable build summaries.
- Active workstreams: `workstreams/2026-08-20-team-member-edit-move-picker.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`
- Blocking dependencies: exact commit, Dev verification/deploy, renewed product-owner UAT, PR check, and clean independent review.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Added Mega-to-regular editing, searchable grouped ability/item pickers with persisted detailed/compact styles, real current-format top-ten ranks across move/ability/item/nature selectors, upstream rank-gap disclosure without fabricated rows, severity-ordered matchups, the live Mega Gallade battle key, Other item filtering, document Escape for dialogs, locale persistence/browser inference, localized battle rows, visible move mechanics, and AP/nature team summaries.
- Verification evidence: Final `pnpm verify:deploy` passed, including form/localization audits, 17 test files / 117 tests, production build, and 10 built-output/API checks. `pnpm data:audit:live` passed for 358 snapshot forms after reconciling Mega Gallade's current `gallademega` key. PDOS review/remediation validation passed.
- Not verified: complete deployment gate, exact Dev build/deploy, and real keyboard/touch/responsive UAT.
- Residual risks: Picker geometry, the live Clefable rank-gap disclosure, matchup ordering, and all dialog/locale journeys must be checked on the isolated Dev site. Clefable Doubles ranks 1–5 remain absent upstream.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, and deploy that commit to Champions Lab Dev for renewed UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `remediations/REM-20260825-team-builder-ux-F004.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
