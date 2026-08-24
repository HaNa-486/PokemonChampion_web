# Workstream: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.

- Status: active
- Started: 2026-08-20T07:04:57Z
- Updated: 2026-08-24T04:00:00Z
- Branch: codex/team-member-edit-move-picker
- Base commit: 9322332253ed67cf6318b6e2c8515375aa661f1b
- Scope: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.
- Files or areas at risk: team-store,builder,team-tray,move-picker,responsive-ux,tests,spec

## Coordination

- Overlap checked: complete; prior item-thumbnail and localization workstreams are completed on the current `origin/main` base.
- Dependencies: commit the independently reviewed fixes, deploy the new exact candidate to Dev, and obtain renewed product-owner UAT before merging PR #7.
- Consequential conflicts: none.

## Handoff

- What changed: Added in-place team-member editing and a shared searchable move picker with localized mechanics, common-move ordering, clear action, and duplicate prevention.
- Verification: After independent PR review, `pnpm verify:deploy` passed again, including both new regressions, all 17 unit-test files / 109 tests, production build, and 10 rendered/API checks.
- Residual risks: Item-only preservation and complete keyboard navigation require renewed exact-candidate Dev UAT.
- Next safe action: Commit the new exact candidate, run Dev verification, and deploy privately for renewed UAT.
