# Workstream: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.

- Status: active
- Started: 2026-08-20T07:04:57Z
- Updated: 2026-08-25T05:00:00Z
- Branch: codex/team-member-edit-move-picker
- Base commit: 9322332253ed67cf6318b6e2c8515375aa661f1b
- Scope: Complete in-place editing and decision-time builder UX across form/item/ability/move selection, rank-aware top-ten choices, transparent upstream gaps, matchup ordering, locale persistence, modal dismissal, and team summaries.
- Files or areas at risk: team-store,builder,team-tray,move-picker,resource-picker,locale,dialogs,responsive-ux,tests,spec

## Coordination

- Overlap checked: complete; prior item-thumbnail and localization workstreams are completed on the current `origin/main` base.
- Dependencies: complete the deployment gate, commit the exact candidate, deploy it to Dev, and obtain renewed product-owner UAT before opening/updating the pull request.
- Consequential conflicts: none.

## Handoff

- What changed: Extended the editor with Mega-to-regular switching, searchable detailed/compact ability and item pickers, grouped held items, rank-aware top-ten choices for all build resources, explicit upstream rank-gap disclosure, severity-ordered matchups, global modal Escape, locale persistence/inference, localized battle rows, inline move mechanics, and AP/nature team summaries.
- Verification: Final `pnpm verify:deploy` passes with 17 test files / 117 tests, production build, and 10 built-output/API checks. `pnpm data:audit:live` passes for all 358 snapshot forms after reconciling Mega Gallade's current `gallademega` key.
- Residual risks: Responsive picker geometry, live Clefable rank-gap messaging, and complete mouse/keyboard/touch flows require exact-candidate Dev UAT.
- Next safe action: Complete the exact-candidate gate, commit, verify Dev packaging, and deploy privately for renewed UAT.
