# Review: Team member editing and move selection UX

- Review ID: REV-20260820-team-builder-ux
- Mode: review-and-fix
- Status: in_progress
- Created: 2026-08-20T07:05:00Z
- Scope: floating team tray, Build Workbench, team persistence, move selection, responsive accessibility
- Release assessment: not-ready

## Findings

### F-001

- Severity: medium
- Confidence: high
- Status: implemented
- Evidence: Team cards exposed only a remove action, and `team-store` exposed add/remove/clear without an update operation.
- User impact: Any small change required deleting and rebuilding a complete member.
- Root cause: The original builder was modeled as an add-only flow.
- Recommended solution: Open the builder with the saved member, validate a replacement team, and update the same stable member in place.
- Alternatives and tradeoffs: Remove/re-add is simpler technically but loses position and creates unnecessary work and mistakes.
- Affected areas: `components/ChampionsApp.tsx`, `lib/team-store.ts`, team component tests.
- Acceptance criteria: Exact fields restore; save preserves ID, slot, count, and format; normal legality checks remain active.
- Verification: Store/component regressions and `pnpm verify:deploy` passed; Dev responsive UAT remains pending.
- Residual risk: Responsive placement requires Dev UAT at required widths.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260820-team-builder-ux-F001.md

### F-002

- Severity: medium
- Confidence: high
- Status: implemented
- Evidence: Four native move selects exposed an undifferentiated long name list with no text search or mechanics context.
- User impact: Experienced users search slowly; beginners cannot tell what a move does while choosing it.
- Root cause: Move selection reused a native select designed for small vocabularies.
- Recommended solution: Use localized searchable comboboxes with common-move-first ordering, mechanics summaries, effect text, clear action, and duplicate prevention.
- Alternatives and tradeoffs: A datalist is smaller but cannot present rich mechanics or reliably disable duplicates.
- Affected areas: `components/ChampionsApp.tsx`, `app/globals.css`, component tests.
- Acceptance criteria: Search by name/effect; option context is visible; selected duplicates are blocked; keyboard/mouse/touch and mobile dialog remain usable.
- Verification: Search/mechanics/duplicate component regression and `pnpm verify:deploy` passed; Dev responsive/touch UAT remains pending.
- Residual risk: Final popover geometry and touch feel require Dev UAT.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260820-team-builder-ux-F002.md
