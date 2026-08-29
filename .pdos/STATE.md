# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 19
- Updated: 2026-08-29T19:32:33Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: PR #9 independent-review findings addressed locally; replacement exact commit, Dev deployment, and renewed UAT pending

## Repository identity

- Branch: codex/type-chart-tab
- Observed commit: c9ce46e390fe4ae11f0fa2bfe62cecb940e4d58f

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Core reference tools, including the complete type matchup chart, are easy to find in one consistent primary navigation.
- Critical journey: open the Type Chart tab -> see all 18 attack rows and 18 defense columns together without internal scrolling at 390/768/1440 -> identify compact type codes through full accessible names -> switch back to another primary view.
- Non-goals: changing upstream data, battle formulas, strategic recommendations, or automatic production promotion.

## Current work

- Current slice: Scale type labels and matchup multipliers to use their cells while retaining no-scroll completeness, and withdraw the Speed Compare UI.
- Active workstreams: `workstreams/2026-08-29-type-chart-tab.md` is active to address independent PR review findings; the previously recorded catalog-session changes are preserved.
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: exact review-fix commit, repeat checks/Dev deployment, and renewed product-owner UAT; PR merge remains blocked until that exact candidate passes UAT.
- Consequential open decisions: the product owner explicitly authorized production deployment after clean review and merge in the current conversation; deployment remains blocked until all earlier gates pass.

## Handoff

- What changed: PR #9 independent auto review found stale public metadata, missing direct coverage for the intentionally retained speed API, and contradictory later spec requirements. The metadata now advertises available type-matchup functionality, built-output tests cover normal/Trick Room ordering, invalid/unknown input, response version/shape, and `no-store`, and the spec consistently defers Speed Compare UI/load journeys.
- Verification evidence: focused production build plus 12 built-output tests passed, including the new speed-contract and metadata assertions. Earlier Type Chart geometry and full gate evidence remain applicable to unchanged UI code; the full gate will be repeated on the exact review-fix candidate.
- Superseded deployment: Dev version 26 at exact commit `c9ce46e390fe4ae11f0fa2bfe62cecb940e4d58f` predates these review fixes and its UAT approval is invalidated by policy.
- Not verified: full exact-candidate gate, replacement Dev deployment, renewed product-owner UAT, final independent re-review, merge, and production smoke test; no upstream/generated/form mapping changed, so `data:audit:live` is not applicable.
- Residual risks: physical readability below the supported 390px viewport cannot be guaranteed; existing unrelated PDOS F-006 artifacts fail strict state validation.
- Next safe action: run the full gate, commit and deploy the exact review-fix candidate to owner-only Dev, then request renewed product-owner UAT before continuing PR merge.

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
