# Workstream: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.

- Status: active
- Started: 2026-08-20T07:04:57Z
- Updated: 2026-08-20T07:32:00Z
- Branch: codex/team-member-edit-move-picker
- Base commit: 9322332253ed67cf6318b6e2c8515375aa661f1b
- Scope: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.
- Files or areas at risk: team-store,builder,team-tray,move-picker,responsive-ux,tests,spec

## Coordination

- Overlap checked: complete; prior item-thumbnail and localization workstreams are completed on the current `origin/main` base.
- Dependencies: exact Dev deployment and product-owner UAT before PR.
- Consequential conflicts: none.

## Handoff

- What changed: Added in-place team-member editing and a shared searchable move picker with localized mechanics, common-move ordering, clear action, and duplicate prevention.
- Verification: `pnpm verify:deploy` passed, including the data audits, all 17 unit-test files / 107 tests, production build, and 10 rendered/API checks.
- Residual risks: Popup geometry and touch feel require exact-candidate Dev UAT at 390, 768, and 1440 px.
- Next safe action: Commit the exact candidate, run Dev verification, and deploy privately for UAT.
