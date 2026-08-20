# Workstream: Complete zh-Hant localization for official Pokemon names, move/ability/item names and descriptions, and fixed UI taxonomy across catalogs, details, tooltips, filters, and search

- Status: completed
- Started: 2026-08-13T06:24:06Z
- Updated: 2026-08-13T10:15:00Z
- Branch: codex/traditional-chinese-localization
- Base commit: 29bea4dbb81b4630a2636756113b379fad41e8f3
- Scope: Complete zh-Hant localization for official Pokemon names, move/ability/item names and descriptions, and fixed UI taxonomy across catalogs, details, tooltips, filters, and search
- Files or areas at risk: localization,sync-pipeline,catalogs,tooltips,tests,documentation

## Move-name correction addendum

- Root cause: PokeAPI language id 4 is community-maintained and contained 34 Simplified-Chinese move names despite its `zh-Hant` label.
- Resolution: every one of the 539 legal move names now comes from the pinned PKHeX Traditional Chinese game-string mirror at revision `146172f61866f80aefc1f2993cb0a87080769b7b`.
- Guards: exact per-record provenance, seven golden names from user reports, and an audit that rejects unambiguous Simplified name characters.
- Verification: `pnpm verify:deploy` passed 17 files / 105 tests plus 10 built-worker checks; `pnpm data:audit:zh` and `pnpm data:audit:live` passed.
- Release status: completed, reviewed, merged, and deployed to production before this workstream began.

## Coordination

- Overlap checked: complete; the prior item-thumbnail workstream is merged and not active on the current base.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Added complete `zh-Hant` catalog data for 358 Pokémon forms, 539 moves, 200 abilities, and 148 held items; official PokeAPI Traditional Chinese names plus reviewed Champions-only/form mappings; complete-machine translations derived from effective Champions mechanics; per-record source provenance; reviewed semantic overrides for critical parity failures; and localized properties, ability categories, item controls, headers, effect classes, and single-use language.
- Verification: `pnpm verify:deploy` passed 17 files / 104 tests plus 10 built-worker checks. `pnpm data:audit:zh` passed all 887 descriptions with exact-source, numeric, rounding, multiplier, single-use, Taiwan Traditional Chinese, no-placeholder, and no-unapproved-English checks. `pnpm data:audit:live` passed 358 snapshot / 236 live forms across 18 groups. Local in-app browser binding was unavailable, so visual QA is deferred to isolated Dev UAT.
- Residual risks: Descriptions labeled `machine-translation-effective-showdown` still need progressive human editorial refinement even though automated semantic guards pass. The Admin override workflow still creates drafts only and is outside this delivery.
- Next safe action: Commit the exact verified candidate, run `pnpm verify:dev`, deploy that commit to Champions Lab Dev, and request focused product-owner UAT before opening a PR.
