# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 10
- Updated: 2026-08-25T14:35:00Z
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

- What changed: Preserved all earlier builder work, required an explicit regular-form identity for each Mega Stone, and applied the owner's reviewed compatibility rule that every Mega reuses its regular form's battle source; `gallademega` is ignored at sync, catalog, API, and audit boundaries.
- Verification evidence: `pnpm verify:deploy` passed against the current source with 17 test files / 125 tests, a successful production build, form/localization audits, and 10 built-output/API checks. `pnpm data:audit:live` passed for 358 snapshot forms and accepts only the reviewed Mega Gallade → Gallade exception. Golden cases prove Mega Gallade never requests `gallademega`, every Mega resolves to its explicit regular form, and Galarian Slowbro cannot use Slowbronite.
- Not verified: exact-commit Dev deployment and product-owner acceptance that Mega Gallade displays the same seasonal data as Gallade.
- Residual risks: Responsive AP/picker geometry and external live data availability remain as documented; Clefable Doubles ranks 1–5 remain absent upstream.
- Next safe action: commit the exact candidate, run `pnpm verify:dev`, deploy it to Champions Lab Dev, and request only the focused Mega Gallade seasonal-data UAT; do not update or merge PR #7 before explicit acceptance.

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
