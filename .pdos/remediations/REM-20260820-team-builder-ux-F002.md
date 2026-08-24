# Remediation: Searchable beginner-friendly move picker

- Remediation ID: REM-20260820-team-builder-ux-F002
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-002
- Status: implemented
- Severity: medium
- Autonomy class: auto-decide
- Owner: Codex
- Updated: 2026-08-24T04:00:00Z
- Decision authority: product owner request
- Reason: Directly requested in the current task.
- Revisit condition: Reopen if legal moves are unreachable, duplicates can be selected, or mobile menus clip.

## Plan

- Recommended solution: Replace native selects with searchable localized comboboxes and rich move rows.
- Acceptance criteria: Search names/effects; show type/category/Power/Accuracy/priority/effect; common moves first; clear and duplicate prevention work.
- Verification plan: Component regression, accessibility/static checks, full deployment gate, exact Dev candidate UAT.
- Rollback: Restore native move fields without changing persisted team DTOs.

## Evidence

- Implementation: Shared `MovePicker` used by all four slots with deterministic ordering and responsive menu CSS.
- Verification: Search-by-effect, mechanics context, duplicate disabling, clear/dismiss behavior, Arrow/Home/End navigation, Enter selection, disabled-option skipping, focus retention, and full `pnpm verify:deploy` passed with 109 tests.
- Residual risk: Renewed Dev keyboard, touch, and responsive UAT pending after the independent review fix.

## History

- 2026-08-20T07:05:00Z open: created from user-reported finding.
- 2026-08-20T07:20:00Z implemented: local implementation completed; verification pending.
- 2026-08-20T07:32:00Z verification: automated local acceptance and deployment gate passed; Dev UAT pending.
- 2026-08-24T04:00:00Z independent review: keyboard selection was incomplete; implementation corrected and regression verified locally.
