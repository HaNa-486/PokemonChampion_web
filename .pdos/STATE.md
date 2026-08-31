# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 31
- Updated: 2026-08-31T17:38:58Z
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Scrapbook feature candidate validated locally; Dev/UAT deployment pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: working candidate based on 0537cd498ef603960cb513f79ecb58af3d598bfd; candidate commit pending

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Exact candidate is locally verified; commit, Dev build, and owner-only Dev deployment remain.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: none before Dev deployment.
- Consequential open decisions: Product-owner Dev UAT is required before any push or pull request; production remains separately approval-gated.

## Handoff

- What changed: Added the Scrapbooks tab between Pokémon and Moves; multi-book, multi-tag local persistence; four requested add entry points; collapsible/reorderable tag groups and Pokémon; actual-stat and defensive comparison rows; inline intelligence/build details; type-aware move ordering; and six optional season-data categories.
- Verification evidence: Exact working candidate passed `pnpm verify:deploy` with lint 0 errors, TypeScript, both repository data audits, 18 Vitest files/138 tests, Vinext production build, and all 13 built-output/API tests. Browser QA covered all add entry points and responsive 390/768/1440 layouts.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Pending exact committed candidate deployment to the owner-only Champions Lab Dev project.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Local browser QA exercised the safe neutral zero-AP stat fallback because hosted battle context was unavailable. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Commit the exact candidate, run `pnpm verify:dev`, deploy the exact commit to Champions Lab Dev, and provide focused UAT notes.

## Read next

- `AUTONOMY.md`
- `workstreams/2026-08-31-scrapbook.md`
- `workstreams/2026-08-31-site-dark-mode.md`
- `workstreams/2026-08-29-type-chart-tab.md`
- `workstreams/2026-08-20-team-member-edit-move-picker.md`
- `reviews/REV-20260820-team-builder-ux.md`
- `remediations/REM-20260820-team-builder-ux-F001.md`
- `remediations/REM-20260820-team-builder-ux-F002.md`
- `remediations/REM-20260820-team-builder-ux-F003.md`
- `remediations/REM-20260825-team-builder-ux-F004.md`
- `remediations/REM-20260825-team-builder-ux-F005.md`
- `remediations/REM-20260825-team-builder-ux-F006.md`
- `../PROJECT_SPEC.md`
- `../DEPLOYMENT_CHECKLIST.md`
