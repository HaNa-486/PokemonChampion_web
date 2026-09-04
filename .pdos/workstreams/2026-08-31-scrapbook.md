# Workstream: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。

- Status: active
- Started: 2026-08-31T16:42:56Z
- Updated: 2026-09-03T14:41:00+08:00
- Branch: codex/scrapbook
- Base commit: 0537cd498ef603960cb513f79ecb58af3d598bfd
- Scope: 新增可建立多本畫本、替寶可夢套用多標籤、由資料庫與關聯視窗加入，並在畫本分頁比較完整資料與可選當季對戰資訊的本機持久化功能。
- Files or areas at risk: ChampionsApp navigation, Pokémon/Move/Ability dialogs, local persistence, scrapbook comparison UI, filtering, drag ordering, localization, responsive/accessibility tests

## Coordination

- Overlap checked: complete; no other active workstream overlaps the scrapbook navigation, storage, comparison, or detail surfaces.
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Product owner explicitly passed Dev UAT for commit `5478d176b6f01af2bcda41c4ebaac3352904c6b9` and authorized PR, automatic review, non-forced merge, and post-merge production promotion. Artifact review of `ea1502b` found the final old Detail section Escape handler, which is now removed. Executor review then found closed BuildEditor pickers consumed later Escape keys; both picker types now consume Escape only while open, preserving the intended first-Escape-closes-picker, second-Escape-closes-editor sequence. Neither superseded replacement candidate was deployed.
- Verification: The final local correction passes TypeScript and 62 focused tests, including existing-book nested dialogs and the two-step picker/editor Escape sequence. Superseded `ea1502b` passed 146 tests, full build, and 13 render/API checks, but the new exact candidate must repeat full verification and Dev deployment.
- Residual risks: Scrapbooks remain intentionally device-local IndexedDB state with no account sync/export. Existing unrelated PDOS F-006 artifacts may still fail strict state validation.
- Next safe action: Verify and deploy the replacement exact commit to owner-only Dev, then obtain a new product-owner UAT pass before any PR action.

## Gated release plan

- Artifact scope: every path changed from `origin/main`, currently `.pdos/STATE.md`, this workstream, `.pdos/workstreams/2026-08-31-site-dark-mode.md`, `DEPLOYMENT_CHECKLIST.md`, `PROJECT_SPEC.md`, `app/globals.css`, `components/AddToScrapbookDialog.tsx`, `components/ChampionsApp.tsx`, `components/DatabaseViews.tsx`, `components/PokemonDetailDialog.tsx`, `components/PokemonUsersDialog.tsx`, `components/ScrapbookView.tsx`, `lib/scrapbook-store.ts`, `lib/use-dialog-escape.ts`, `tests/components.test.tsx`, `tests/scrapbook.test.tsx`, and `tests/setup.ts`. Recompute this list and bind the clean Git HEAD before release gates.
- Dev gate: run exact-candidate `pnpm verify:deploy` and `pnpm verify:dev`, deploy that exact commit to owner-only Champions Lab Dev, smoke test it, and require a fresh human UAT pass because the candidate changed.
- PR gate: record the fresh UAT and one-run human `open_pr` authority against the exact artifact; push the branch, open the PR, confirm PR head equals the artifact, and require GitHub `Deployment verification` success.
- Review/merge gate: use a fresh PR reviewer distinct from the release council to review the complete PR diff at the exact PR head. Require clean CI plus distinct council and PR-reviewer approvals, no unresolved material findings, current provider authority, and a non-forced merge. Any code change restarts verification, Dev deployment, and UAT.
- Autopilot boundary: the governed Autopilot run ends at merge. PDOS Autopilot v0.1 never authorizes production deployment.
- Separate production promotion: under the owner's explicit production authority, inspect the production Sites project and record its current saved version as the rollback target; fetch the merged commit, confirm the reviewed PR resolution and production environment identity, rerun `pnpm verify:deploy`, build with `.openai/hosting.json`, and package only that exact merged commit. Save one immutable production Sites version, deploy it, and record its commit/version/deployment identity.
- Production smoke/rollback: authenticated checks cover home, `/type-chart`, current ruleset, all primary database navigation, distinct Ninetales/Alolan Ninetales build data, Singles/Doubles persistence, Mega transformation, reverse lookup, pagination, and the no-scroll Type Chart. Any deployment failure, HTTP/API failure, wrong environment/manifest, missing critical navigation, or broken critical journey triggers immediate rollback to the recorded prior saved production version and a failed release report.
