# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 9
- Updated: 2026-08-25T12:36:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: review exception remediation committed and verified; exact-candidate Dev handoff and renewed UAT pending

## Repository identity

- Branch: codex/team-member-edit-move-picker
- Observed commit: release-candidate branch HEAD (the commit hash is recorded by the deployment/version evidence rather than embedded in its own tree)

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Existing members are editable in place, and all build choices are searchable and understandable without external lookup.
- Critical journey: open selected team -> edit member -> switch form/item if needed -> search/read/select moves/ability/item -> adjust AP/nature -> save -> same team slot updates.
- Non-goals: strategic move recommendations, drag-reordering, or automatic production promotion.

## Current work

- Current slice: Complete in-place editing, rich selectors with real top-ten usage ranks, transparent upstream gaps, locale/modal consistency, and readable build summaries.
- Active workstreams: `workstreams/2026-08-20-team-member-edit-move-picker.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: renewed product-owner UAT, updated PR check, and clean independent review.
- Consequential open decisions: production deployment remains human-only and is outside the pre-UAT phase.

## Handoff

- What changed: Preserved all earlier builder work and corrected review exceptions by caching usage per `battleDataKey`, loading only genuinely distinct form keys, and requiring an explicit regular-form identity for each Mega Stone.
- Verification evidence: `pnpm verify:dev` passed against committed source with 17 test files / 121 tests, two successful builds, form/localization audits, 10 built-output/API checks, and a Dev manifest assertion. `pnpm data:audit:live` also passed for 358 snapshot forms. New golden cases cover shared-key Blastoise, distinct-key Mega Gallade, and incompatible Galarian Slowbro/Slowbronite.
- Not verified: product-owner acceptance of the three focused transition journeys on isolated Dev.
- Residual risks: Responsive AP/picker geometry and external live data availability remain as documented; Clefable Doubles ranks 1–5 remain absent upstream.
- Next safe action: product owner completes the focused Mega transition UAT on Champions Lab Dev; do not update or merge PR #7 before explicit acceptance.

## Read next

- `AUTONOMY.md`
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
