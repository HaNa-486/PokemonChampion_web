# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-08-31T17:38:58Z
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Added a local, multi-book scrapbook workflow with book-scoped multi-tags; add actions from Pokémon rows/details and move/ability reverse lookups; collapsible and reorderable tag groups; computed comparison rows with defensive matchups; inline combined Pokémon intelligence/build details; type-aware move ordering; and per-category battle-data visibility controls. Updated Traditional Chinese/English navigation, responsive styling, tests, specification, and deployment checklist.
- Verification: Exact working candidate passed `pnpm verify:deploy`: lint with 0 errors (15 non-blocking warnings), TypeScript, 358-form integrity audit, Traditional Chinese audit for 539 moves/200 abilities/148 items, 18 Vitest files/138 tests, Vinext production build, and 13 built-output/API tests. Browser QA covered add flows from all four requested surfaces, 390/768/1440 layouts, empty quick finder, group expansion/reordering affordances, inline details, move ordering, toggles, and defensive comparisons.
- Residual risks: Scrapbooks are intentionally device-local IndexedDB state with no account sync or export in this slice. Local development lacked hosted battle API context, so actual-stat rows exercised the documented neutral zero-AP fallback while the built API suite verified calculation contracts. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, and deploy that exact commit to the owner-only Champions Lab Dev project for product-owner UAT.
