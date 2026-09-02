# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-09-02T23:05:02+08:00
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Continuing UAT remediation by replacing both Pokémon-detail learnable-move surfaces with the Move DB table columns and sorting behavior except Properties, adding usable-Pokémon counts, and clarifying invested/zero AP and nature-raised/lowered stat effects. Version 35 is invalidated.
- Verification: `pnpm verify:deploy` passes with lint 0 errors/15 existing warnings, TypeScript, 358-form and Traditional Chinese audits, 18 Vitest files/145 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite passes 12 tests and the focused Pokémon-detail journey passes. Exact commit, Dev-manifest verification, and replacement Dev deployment remain pending.
- Residual risks: Scrapbooks remain intentionally device-local IndexedDB state with no account sync/export. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Run the complete candidate gates, commit, verify the exact Dev build, and deploy a replacement owner-only Dev version. Do not push, open a pull request, merge, or deploy to production until explicit acceptance.
