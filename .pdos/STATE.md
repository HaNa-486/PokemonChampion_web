# PDOS state

Keep this file concise. Every fresh PDOS context reads it first.

- Protocol version: 0.3.0
- State revision: 4
- Updated: 2026-08-12T09:22:00Z
- State confidence: high
- Phase: release candidate preparation

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

- Current slice: Commit the exact verified candidate and deploy it to Champions Lab Dev for product-owner UAT before opening a pull request.
- Active workstreams: `workstreams/2026-08-12-item-thumbnails.md`
- Blocking dependencies:
- Consequential open decisions: Product owner explicitly changed the durable release order to Dev UAT before PR. Production promotion remains a separate decision after post-UAT PR review and merge.

## Handoff

- What changed: Added a pinned PokeAPI item-sprite manifest and 148 local PNGs; shared item icon/display/tooltip UI; coverage in the item catalog, battle usage, builder, Mega notice, team tray, and Speed Compare; bounded and rollback-safe synchronization; workflow gates, attribution, documentation, and tests. Updated the durable release workflow: exact committed candidate goes to Dev UAT before PR; after owner approval Codex opens the PR, runs checks plus independent sub-agent auto review, addresses findings, and merges; production is separately approved.
- Verification evidence: `pnpm verify:deploy` passed on the final source with 16 test files / 93 tests, a production build, and 10 built-worker integration tests; offline audit passed 358 forms; `pnpm data:audit:live` passed against 236 live forms / 18 metadata groups; manifest audit passed 148/148 assets and every current Mega Stone; independent review reports no material finding.
- Not verified: Responsive browser QA at 390/768/1440 was blocked locally and is the primary Dev UAT task. `pnpm verify:dev`, Dev deployment, and product-owner UAT are current actions. PR checks and post-UAT sub-agent review intentionally wait for owner approval. A final no-change `data:sync:items` rerun was blocked by Codex external-operation usage limits after the original 148-file sync had succeeded.
- Residual risks: PokeAPI sprites has no clearly declared image-content license in current project evidence; existing Pokemon IP/trademark legal review remains required.
- Next safe action: Commit this candidate, run `pnpm verify:dev`, deploy the exact commit privately to Champions Lab Dev, and give the owner the URL plus focused UAT steps. Do not open a PR until the owner says UAT is OK.

## Read next

- `plans/active.md` - current item-thumbnail implementation slices
- `workstreams/2026-08-12-item-thumbnails.md` - scoped progress and verification
- `../PROJECT_SPEC.md` - product behavior and release requirements
