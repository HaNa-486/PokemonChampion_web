# Remediation: Searchable beginner-friendly move picker

- Remediation ID: REM-20260820-team-builder-ux-F002
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-002
- Status: implemented
- Severity: medium
- Autonomy class: auto-decide
- Owner: Codex
- Updated: 2026-08-20T07:32:00Z
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
- Verification: Search-by-effect, mechanics context, duplicate disabling, clear/dismiss behavior, and full `pnpm verify:deploy` passed.
- Residual risk: Dev touch and responsive UAT pending.

## History

- 2026-08-20T07:05:00Z open: created from user-reported finding.
- 2026-08-20T07:20:00Z implemented: local implementation completed; verification pending.
- 2026-08-20T07:32:00Z verification: automated local acceptance and deployment gate passed; Dev UAT pending.
