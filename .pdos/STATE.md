# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 41
- Updated: 2026-09-03T09:32:00+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: Release-council Escape finding corrected locally; replacement candidate verification and Dev UAT pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: 5478d176b6f01af2bcda41c4ebaac3352904c6b9

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Ensure Escape closes only the topmost Reverse Lookup when opened over a Pokémon detail modal, then replace the invalidated Dev candidate.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: explicit product-owner Dev UAT approval before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: The release council requested changes before PR because nested Reverse Lookup Escape was intercepted by the underlying Pokémon detail listener. Escape handling now allows an unhandled outer listener to pass the event to the topmost dialog; focused modal and inline tests assert topmost-only dismissal. The release plan now covers the full branch diff, rollback, environment identity, merged-source verification, and the Autopilot production boundary.
- Verification evidence: TypeScript and focused Pokémon-detail/scrapbook suites pass (2 files, 61 tests), including nested Escape closing Reverse Lookup while preserving its parent modal. Full exact-candidate verification remains pending.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Owner-only version 37 remains live, but the Escape correction changes the candidate and invalidates its UAT result for release. A replacement exact commit must be verified, deployed, and explicitly accepted.
- Residual risks: Scrapbooks intentionally remain device-local IndexedDB state; no account sync/export is included. Existing unrelated PDOS F-006 artifacts still fail strict state validation.
- Next safe action: Run full checks, commit the replacement candidate, deploy it to owner-only Dev, and request focused Escape UAT. No pull request before that new pass.

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

<!-- PDOS-AUTOPILOT:START -->
## PDOS Autopilot continuity

- Active runs: `scrapbook-release-20260903-v4` (plan_approved, revision 5)
- Resume source: `.pdos/autopilot/active.json` and the referenced run ledger; validate before acting.
- External status: ledger gates are governance eligibility only, never provider authorization or execution proof.
<!-- PDOS-AUTOPILOT:END -->
