# Remediation: Complete builder decision-time UX and modal/locale consistency

- Remediation ID: REM-20260820-team-builder-ux-F003
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-003
- Status: implemented
- Severity: medium
- Autonomy class: auto-decide
- Owner: Codex
- Updated: 2026-08-25T05:00:00Z
- Decision authority: product owner UAT findings
- Reason: Directly requested after testing the prior Dev candidate.
- Revisit condition: Reopen if form identity, selector content, locale, modal dismissal, or build summaries diverge from the saved build.

## Plan

- Recommended solution: Derive the effective form from the selected family stone; share searchable mechanics-rich selectors; centralize Escape handling and locale persistence; expose AP, nature, and move mechanics inline.
- Acceptance criteria: All F-003 review criteria pass in automated checks and the exact Dev candidate at desktop and mobile widths.
- Verification plan: Component regressions, typecheck/lint, full deployment gate, exact committed Dev deployment, focused product-owner UAT.
- Rollback: Revert F-003 UI/state changes without changing the versioned team persistence schema.

## Evidence

- Implementation: Shared resource comboboxes, family-stone form derivation, Other item classification, dialog Escape hook, persisted/browser-inferred locale, localized usage entries, inline learnable-move mechanics, and AP/nature team summaries.
- Verification: `pnpm verify:deploy` passes with the localization/data audits, 17 test files / 115 tests, production build, and 10 built-output/API checks.
- Residual risk: Real-browser responsive and touch behavior remains for Dev UAT.

## History

- 2026-08-25T05:00:00Z open: created from product-owner UAT findings.
- 2026-08-25T05:00:00Z implemented: local implementation and targeted automated verification completed.
- 2026-08-25T05:30:00Z verification: complete local deployment gate passed; exact Dev deployment and UAT pending.
