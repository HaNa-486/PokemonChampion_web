# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-09-03T00:30:53+08:00
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Continuing UAT remediation by adding third-click restoration of each learnable table's contextual default order and wiring compatible-Pokémon counts in Pokémon detail and scrapbook intelligence to the same shared Move DB Reverse Lookup. Dev version 36 is invalidated.
- Verification: TypeScript and focused Pokémon-detail/scrapbook suites pass (2 files, 61 tests). Exact-candidate deployment and Dev verification remain pending.
- Residual risks: Scrapbooks remain intentionally device-local IndexedDB state with no account sync/export. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Complete exact-candidate release checks, commit, and deploy a replacement owner-only Dev version for focused product-owner UAT. Do not push the branch, open a pull request, merge, or deploy to production until explicit acceptance.
