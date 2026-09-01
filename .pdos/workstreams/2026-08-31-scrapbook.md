# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-09-01T18:40:16+08:00
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Replacing the first Dev candidate with configurable scrapbook build cards: neutral initial values, multiple named builds per Pokémon, shared and independent tag copies, cross-tag moves, direct tag create/rename/delete, whole-book duplication, auto-saved Workbench editing, saved-build summaries, deterministic book preselection, and per-book page-state persistence. Specification, checklist, persistence migration, responsive styling, and tests are being updated together.
- Verification: `pnpm verify:deploy` passes on the uncommitted replacement source: lint 0 errors/15 warnings, TypeScript, 358-form integrity audit, Traditional Chinese audit for 539 moves/200 abilities/148 items, 18 Vitest files/142 tests, Vinext build, and 13 built-output/API tests. The focused scrapbook suite has 9 passing tests including real-Workbench auto-save. Browser automation is blocked by a Codex Node REPL kernel-assets path error after reset/retry, so responsive and drag journeys are not claimed yet. Commit, `verify:dev`, replacement Dev deployment, and smoke checks remain pending. The prior Dev version 33 is invalidated for UAT.
- Residual risks: Scrapbooks remain intentionally device-local IndexedDB state with no account sync/export. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Complete tests and browser QA, commit the exact candidate, run `verify:dev`, and deploy it to owner-only Champions Lab Dev. Do not push, open a pull request, merge, or deploy to production until explicit acceptance of the replacement Dev version.
