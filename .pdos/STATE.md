# PDOS state

Keep this file concise. Every fresh PDOS context reads it first.

- Protocol version: 0.3.0
- State revision: 5
- Updated: 2026-08-13T05:20:35Z
- State confidence: high
- Phase: post-review remediation and repeat Dev UAT

## Repository identity

- Branch: codex/item-thumbnails
- Worktree: C:\Users\091\codex_workspace\BDWP\PokemonChampion
- Commit: eff15daaf15c0cd11d17e94d291e88eadfeb29bb

## Product anchors

- Primary user: Competitive Champions Lab users scanning held items in catalogs, usage data, and team builds.
- Product outcome: Every user-visible held-item name is paired with a consistent local thumbnail when the UI can render one, with a safe fallback when it cannot.
- Critical journey: inspect held-item data -> recognize the item visually -> choose or verify it in a build -> see the same icon in usage data and the team tray.
- Non-goals: replacing native selects with custom comboboxes; mirroring all PokeAPI sprites; changing Pokemon sprite sourcing.

## Current work

- Current slice: Post-UAT PR review found two P2 issues; fixes are verified and must replace the Dev candidate for repeat product-owner UAT before merge.
- Active workstreams: `workstreams/2026-08-12-item-thumbnails.md`
- Blocking dependencies: The updated commit requires a new `verify:dev`, Champions Lab Dev deployment, and explicit product-owner UAT approval. PR #5 remains unmerged.
- Consequential open decisions: Product owner explicitly changed the durable release order to Dev UAT before PR. Production promotion remains a separate decision after post-UAT PR review and merge.

## Handoff

- What changed: Added a pinned PokeAPI item-sprite manifest and 148 local PNGs; shared item icon/display/tooltip UI; coverage in the item catalog, battle usage, builder, Mega notice, team tray, and Speed Compare; bounded and rollback-safe synchronization; workflow gates, attribution, documentation, and tests. Updated the durable release workflow: exact committed candidate goes to Dev UAT before PR; after owner approval Codex opens the PR, runs checks plus independent sub-agent auto review, addresses findings, and merges; production is separately approved.
- Verification evidence: Original Dev UAT was approved and PR #5's GitHub Deployment verification passed. Post-UAT sub-agent review found two P2 issues; both are fixed. The updated source passes `pnpm verify:deploy` with 16 test files / 94 tests plus 10 built-worker tests, and `pnpm data:audit:live` passes 358 snapshot forms / 236 live forms across 18 groups.
- Not verified: The updated commit has not yet passed `pnpm verify:dev`, repeat Dev deployment, repeat owner UAT, or final sub-agent confirmation. Original UAT is invalid because the candidate changed.
- Residual risks: PokeAPI sprites has no clearly declared image-content license in current project evidence; existing Pokemon IP/trademark legal review remains required.
- Next safe action: Commit and push the remediation to PR #5, rerun GitHub verification and independent review, run `pnpm verify:dev`, deploy the exact updated commit privately to Champions Lab Dev, then wait for repeat owner UAT approval before merge.

## Read next

- `plans/active.md` - current item-thumbnail implementation slices
- `workstreams/2026-08-12-item-thumbnails.md` - scoped progress and verification
- `../PROJECT_SPEC.md` - product behavior and release requirements
