# Workstream: Complete zh-Hant localization for official Pokemon names, move/ability/item names and descriptions, and fixed UI taxonomy across catalogs, details, tooltips, filters, and search

- Status: active
- Started: 2026-08-13T06:24:06Z
- Updated: 2026-08-13T06:52:00Z
- Branch: codex/traditional-chinese-localization
- Worktree: C:\Users\091\codex_workspace\BDWP\PokemonChampion
- Base commit: 29bea4dbb81b4630a2636756113b379fad41e8f3
- Scope: Complete zh-Hant localization for official Pokemon names, move/ability/item names and descriptions, and fixed UI taxonomy across catalogs, details, tooltips, filters, and search
- Files or areas at risk: localization,sync-pipeline,catalogs,tooltips,tests,documentation

## Coordination

- Overlap checked: complete; the prior item-thumbnail workstream is merged and not active on the current base.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Added complete committed `zh-Hant` catalog data for 358 Pokémon forms, 539 moves, 200 abilities, and 148 held items; official PokeAPI Traditional Chinese species/name sources; reviewed official form naming; provenance-recorded machine translations of effective Champions descriptions where official prose is unavailable; fail-closed sync rules; localized type/filter/resource taxonomy; and release/spec regression checks.
- Verification: `pnpm verify:deploy` passed with 17 test files / 99 tests and 10 built-worker checks. `pnpm data:audit:live` passed for 358 snapshot forms and 236 live forms across 18 metadata groups. Browser connection was unavailable locally, so final visual verification is deferred to the isolated Dev deployment.
- Residual risks: Machine-translated Champions-specific prose is functionally sourced from effective Showdown mechanics but still needs human editorial refinement over time. The Admin override workflow still creates drafts only and is outside this localization delivery.
- Next safe action: Commit the exact verified candidate, run `pnpm verify:dev`, deploy that commit to Champions Lab Dev, and request focused product-owner UAT before opening a PR.
