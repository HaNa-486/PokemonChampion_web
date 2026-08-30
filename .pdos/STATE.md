# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 21
- Updated: 2026-08-30T01:39:00Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: PR #9 second independent-review findings addressed locally; replacement exact commit, Dev deployment, and renewed minimal UAT pending

## Repository identity

- Branch: codex/type-chart-tab
- Observed commit: 41e55b5f18369543f45b433a88a4e35e209bbbf2

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Core reference tools, including the complete type matchup chart, are easy to find in one consistent primary navigation.
- Critical journey: open the Type Chart tab -> see all 18 attack rows and 18 defense columns together without internal scrolling at 390/768/1440 -> identify compact type codes through full accessible names -> switch back to another primary view.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Scale type labels and matchup multipliers to use their cells while retaining no-scroll completeness, and withdraw the Speed Compare UI.
- Active workstreams: `workstreams/2026-08-29-type-chart-tab.md` is active to close the second independent-review findings; the previously recorded catalog-session changes are preserved.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact second-review-fix commit, repeat Dev verification/deployment, and renewed minimal product-owner UAT; PR merge remains blocked until that exact candidate passes UAT.
- Consequential open decisions: the product owner explicitly authorized production deployment after clean review and merge in the current conversation; deployment remains blocked until all earlier gates pass.

## Handoff

- What changed: After product-owner UAT passed on Dev version 27, the second independent review found one stale README feature bullet and one built-route coverage gap for identical speed ties with non-default modifiers. The stale feature claim is removed; a built-output API fixture now verifies both tied rows, stable input indices, final/modified speeds, stage, multiplier, version, and `no-store` behavior.
- Verification evidence: `pnpm verify:deploy` passed with 17 Vitest files/132 tests and 13 built-output/API tests. A repository-wide product-copy search leaves only intentional dormant-contract references.
- Superseded deployment: owner-only Champions Lab Dev version 27 at exact commit `41e55b5f18369543f45b433a88a4e35e209bbbf2` passed product-owner UAT, but is superseded by the second review fixes under the exact-commit release rule.
- Not verified: exact second-review-fix commit, `pnpm verify:dev`, replacement Dev deployment, renewed minimal product-owner UAT, final independent re-review, merge, and production smoke test; no upstream/generated/form mapping changed, so `data:audit:live` is not applicable.
- Residual risks: physical readability below the supported 390px viewport cannot be guaranteed; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: commit the second review fixes, run `pnpm verify:dev`, deploy the exact replacement candidate to owner-only Dev, then request renewed minimal product-owner UAT.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-29-type-chart-tab.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `remediations/REM-20260825-team-builder-ux-F004.md`
- `remediations/REM-20260825-team-builder-ux-F005.md`
- `remediations/REM-20260825-team-builder-ux-F006.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
