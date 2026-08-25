# Remediation: Directly applicable current-format AP spreads

- Remediation ID: REM-20260825-team-builder-ux-F005
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-005
- Severity: medium
- Status: implemented
- Updated: 2026-08-25T09:36:00Z
- Autonomy class: auto-decide
- Owner: Codex
- Decision authority: project owner explicitly authorized this feature; implementation details are auto-decide
- Reason: Product-owner testing found that ranks 2–10 were visible only in a separate modal and could not be applied directly while building or editing.
- Revisit condition: Reopen if ranks are renumbered, formats share AP choices, manual edits retain a misleading preset label, or invalid AP spreads become selectable.

## Scope

- Expose every valid reported current-format AP rank 1–10 inside Build Workbench.
- Show real rank, six-stat allocation, and usage percentage.
- Apply a selected spread atomically and preserve later manual adjustments as Custom.
- Recognize an exact ranked spread when editing a saved member.

## Acceptance evidence

- Domain regression covers rank preservation, rank 10, percentages, and exclusion beyond rank 10.
- Component regressions cover applying rank 2, updating all six sliders, switching to Custom after manual adjustment, and recognizing an exact saved rank.
- `pnpm verify:deploy` passed: lint with zero errors, typecheck, form and Traditional Chinese audits, 17 test files / 118 tests, production build, and 10 rendered-output/API checks.
- Exact committed Dev packaging, owner-only deployment, and HTTP/API smoke checks passed; product-owner UAT remains pending.

## Residual risk

- Long translated spread labels and the stacked 390 px layout require exact-candidate Dev UAT.

## History

- 2026-08-25T09:00:00Z in_progress: created from product-owner feedback and implementation started.
- 2026-08-25T09:25:00Z implemented: rank-aware AP choices, atomic application, saved-spread recognition, Custom fallback, responsive layout, and regressions completed; Dev UAT remains required.
- 2026-08-25T09:36:00Z implemented: exact candidate deployed privately to Champions Lab Dev and smoke-tested; awaiting product-owner UAT.
