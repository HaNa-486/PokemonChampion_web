# Workstream: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.

- Status: active
- Started: 2026-08-20T07:04:57Z
- Updated: 2026-08-25T09:36:00Z
- Branch: codex/team-member-edit-move-picker
- Base commit: 9322332253ed67cf6318b6e2c8515375aa661f1b
- Scope: Complete in-place editing and decision-time builder UX across form/item/ability/move/AP selection, rank-aware top-ten choices, transparent upstream gaps, matchup ordering, locale persistence, modal dismissal, and team summaries.
- Files or areas at risk: team-store,builder,team-tray,move-picker,resource-picker,locale,dialogs,responsive-ux,tests,spec

## Coordination

- Overlap checked: complete; prior item-thumbnail and localization workstreams are completed on the current `origin/main` base.
- Dependencies: obtain renewed product-owner UAT before opening/updating the pull request.
- Consequential conflicts: none.

## Handoff

- What changed: Extended the editor with Mega-to-regular switching, searchable detailed/compact ability and item pickers, grouped held items, rank-aware top-ten choices for all build resources including directly applicable AP spreads, explicit upstream rank-gap disclosure, severity-ordered matchups, global modal Escape, locale persistence/inference, localized battle rows, inline move mechanics, and AP/nature team summaries.
- Verification: `pnpm verify:deploy` and exact-commit `pnpm verify:dev` pass with form/localization audits, 17 test files / 118 tests, production/Dev builds, manifest assertion, and 10 rendered-output/API checks. Owner-only Dev deployment and HTTP/API smoke checks succeeded; product-owner UAT remains pending.
- Residual risks: Responsive AP/picker geometry, live Clefable rank-gap messaging, and complete mouse/keyboard/touch flows require exact-candidate Dev UAT.
- Next safe action: Product owner completes focused AP selector UAT on Champions Lab Dev; no PR before explicit approval.
