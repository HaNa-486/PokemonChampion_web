# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-09-02T00:02:36+08:00
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Continuing UAT remediation by removing duplicate inline base stats, bounding the learnable-move list with internal scrolling, splitting scrapbook save from explicit selected-team addition, surfacing per-stat AP/nature effects, and localizing quick-finder type/form labels. Version 34 is invalidated.
- Verification: `pnpm verify:deploy` passes on the correction source: lint 0 errors/15 warnings, TypeScript, 358-form integrity audit, Traditional Chinese audit for 539 moves/200 abilities/148 items, 18 Vitest files/144 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite passes 11 tests covering the corrected workflows. Commit, `verify:dev`, replacement Dev deployment, and smoke checks remain pending.
- Residual risks: Scrapbooks remain intentionally device-local IndexedDB state with no account sync/export. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Complete full checks, commit the exact candidate, run `verify:dev`, and deploy the corrected owner-only Dev version. Do not push, open a pull request, merge, or deploy to production until explicit acceptance.
