# Workstream: Allow editing an existing team member in place and replace native move selects with a searchable beginner-friendly move picker.

- Status: active
- Started: 2026-08-20T07:04:57Z
- Updated: 2026-08-25T12:08:00Z
- Branch: codex/team-member-edit-move-picker
- Base commit: 9322332253ed67cf6318b6e2c8515375aa661f1b
- Scope: Complete in-place editing and decision-time builder UX across form/item/ability/move/AP selection, rank-aware top-ten choices, transparent upstream gaps, matchup ordering, locale persistence, modal dismissal, and team summaries.
- Files or areas at risk: team-store,builder,team-tray,move-picker,resource-picker,locale,dialogs,responsive-ux,tests,spec

## Coordination

- Overlap checked: complete; prior item-thumbnail and localization workstreams are completed on the current `origin/main` base.
- Dependencies: commit and deploy the review-remediated exact candidate to Dev, then obtain renewed product-owner UAT before updating the pull request.
- Consequential conflicts: none.

## Handoff

- What changed: Extended the editor with the earlier UX slice, then corrected review exceptions so shared base/Mega usage is reused, distinct `battleDataKey` transitions refresh their ranks, and Mega Stones transform only their explicit compatible base form.
- Verification: `pnpm verify:deploy` passes with form/localization audits, 17 test files / 121 tests, production build, and 10 rendered-output/API checks. New shared-key, distinct-key, and regional-form regressions pass.
- Residual risks: Exact-commit Dev deployment and focused product-owner UAT remain required after the candidate change.
- Next safe action: Commit, run `pnpm verify:dev`, deploy to Champions Lab Dev, and obtain renewed UAT before updating PR #7.
