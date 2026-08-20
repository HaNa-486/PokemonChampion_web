# Remediation: Edit a team member in place

- Remediation ID: REM-20260820-team-builder-ux-F001
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-001
- Status: implemented
- Severity: medium
- Autonomy class: auto-decide
- Owner: Codex
- Updated: 2026-08-20T07:32:00Z
- Decision authority: product owner request
- Reason: Directly requested in the current task.
- Revisit condition: Reopen if a saved edit changes count/order/format or bypasses legality.

## Plan

- Recommended solution: Restore the selected member in Build Workbench and atomically replace it in the same team array position.
- Acceptance criteria: Preserve member ID, position, team count, format, and all validated fields.
- Verification plan: Store/component regression, full deployment gate, exact Dev candidate UAT.
- Rollback: Revert the edit action and store update while preserving existing saved-team schema.

## Evidence

- Implementation: `TeamState.update`, edit action on each team card, edit-aware builder initialization and replacement validation.
- Verification: Exact-field restoration, stable ID/order/count, save-in-place, and format-lock component regression passed; full `pnpm verify:deploy` passed.
- Residual risk: Dev responsive UAT pending.

## History

- 2026-08-20T07:05:00Z open: created from user-reported finding.
- 2026-08-20T07:20:00Z implemented: local implementation completed; verification pending.
- 2026-08-20T07:32:00Z verification: automated local acceptance and deployment gate passed; Dev UAT pending.
