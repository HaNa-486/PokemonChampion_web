# PDOS state

Keep this concise. Every fresh PDOS context reads it first.

- Protocol version: 0.4.0-alpha.1
- State revision: 42
- Updated: 2026-09-03T10:12:00+08:00
- State confidence: reconciled with current branch, user request, repository evidence, and tests
- Phase: General topmost-dialog Escape correction implemented locally; replacement candidate verification and Dev UAT pending

## Repository identity

- Branch: codex/scrapbook
- Observed commit: a0a2163aa94ade5eb1b8da773eb95c19af36ac7e

## Product anchors

- Primary user: competitive and new Pokémon Champions players building legal Singles/Doubles teams.
- Product outcome: Players can collect interesting Pokémon into named, device-local scrapbooks and compare complete competitive information without juggling multiple database windows.
- Critical journey: add Pokémon from a database or reverse lookup -> choose or create a scrapbook and tags -> open the Scrapbooks tab -> compare grouped rows, actual stats, and defensive matchups -> expand a Pokémon for intelligence, build controls, type-aware moves, and optional season data.
- Non-goals: account or cross-device synchronization, public sharing/export, changing upstream Pokémon or battle data, or automatic production promotion.

## Current work

- Current slice: Ensure Escape closes only the topmost dialog across Pokémon detail, Reverse Lookup, and Add-to-Scrapbook nesting, then replace the invalidated Dev candidate.
- Active workstreams: `workstreams/2026-08-31-scrapbook.md`
- Active review: `reviews/REV-20260820-team-builder-ux.md`
- Active remediations: `remediations/REM-20260820-team-builder-ux-F001.md`, `remediations/REM-20260820-team-builder-ux-F002.md`, `remediations/REM-20260820-team-builder-ux-F003.md`, `remediations/REM-20260825-team-builder-ux-F004.md`, `remediations/REM-20260825-team-builder-ux-F005.md`, `remediations/REM-20260825-team-builder-ux-F006.md`
- Blocking dependencies: explicit product-owner Dev UAT approval before push or pull request.
- Consequential open decisions: Production remains separately approval-gated after PR checks, independent review, and merge.

## Handoff

- What changed: A second artifact review showed the selector-specific Reverse Lookup fix did not cover Add-to-Scrapbook nesting. Escape handling now uses a shared mount-order stack so only the topmost registered dialog closes, without selector exceptions; the Reverse Lookup section-level duplicate handler was removed. A regression covers Detail -> Add and Detail -> Reverse Lookup -> Add with successive Escapes.
- Verification evidence: TypeScript passes and focused Pokémon-detail/scrapbook suites pass (2 files, 62 tests), including each nested layer closing in topmost order. Full exact-candidate verification remains pending.
- Release: Not released. Branch is local and no pull request is open. Production remains untouched.
- Dev UAT: Owner-only version 37 remains live, but both Escape corrections change the candidate and invalidate its UAT result for release. A replacement exact commit must be verified, deployed, and explicitly accepted.
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

- Active runs: `scrapbook-release-20260903-v5` (plan_approved, revision 5)
- Resume source: `.pdos/autopilot/active.json` and the referenced run ledger; validate before acting.
- External status: ledger gates are governance eligibility only, never provider authorization or execution proof.
<!-- PDOS-AUTOPILOT:END -->
