# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 8
- Updated: 2026-08-25T09:36:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: AP spread remediation deployed to isolated Dev; product-owner UAT pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: 1334a681eedbd356bba282bc619b2126524af2b9

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Existing members are editable in place, and all build choices are searchable and understandable without external lookup.
- Critical journey: open selected team -> edit member -> switch form/item if needed -> search/read/select moves/ability/item -> adjust AP/nature -> save -> same team slot updates.
- Non-goals: strategic move recommendations, drag-reordering, or automatic production promotion.

## Current work

- Current slice: Complete in-place editing, rich selectors with real top-ten usage ranks, transparent upstream gaps, locale/modal consistency, and readable build summaries.
- Active workstreams: `workstreams/2026-08-20-team-member-edit-move-picker.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`
- Blocking dependencies: renewed product-owner UAT, PR check, and clean independent review.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Added Mega-to-regular editing, searchable grouped ability/item pickers with persisted detailed/compact styles, real current-format top-ten ranks across move/ability/item/nature/AP selectors, direct AP spread application with Custom fallback, upstream rank-gap disclosure without fabricated rows, severity-ordered matchups, the live Mega Gallade battle key, Other item filtering, document Escape for dialogs, locale persistence/browser inference, localized battle rows, visible move mechanics, and AP/nature team summaries.
- Verification evidence: Final `pnpm verify:deploy` passed, including form/localization audits, 17 test files / 118 tests, production build, and 10 built-output/API checks. `pnpm data:audit:live` passed for 358 snapshot forms after reconciling Mega Gallade's current `gallademega` key. AP domain/component regressions cover rank 2/rank 10, exact saved-rank recognition, atomic six-stat application, and Custom fallback.
- Not verified: real keyboard/touch/responsive UAT and product-owner acceptance of the AP selector.
- Residual risks: Long localized AP labels and mobile AP layout, picker geometry, the live Clefable rank-gap disclosure, matchup ordering, and all dialog/locale journeys must be checked on the isolated Dev site. Clefable Doubles ranks 1–5 remain absent upstream.
- Next safe action: Product owner tests the AP preset and Custom journeys on Champions Lab Dev; do not open a PR until explicit UAT approval.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `remediations/REM-20260825-team-builder-ux-F004.md`
- `remediations/REM-20260825-team-builder-ux-F005.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
