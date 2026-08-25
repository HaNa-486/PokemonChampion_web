# Review: Team member editing and move selection UX

- Review ID: REV-20260820-team-builder-ux
- Mode: review-and-fix
- Status: in_progress
- Created: 2026-08-20T07:05:00Z
- Scope: floating team tray, Build Workbench, team persistence, move selection, responsive accessibility
- Release assessment: not-ready; expanded product-owner UAT findings implemented locally and awaiting exact-candidate verification and renewed Dev UAT

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
- Verification: Store/component regressions and `pnpm verify:deploy` passed. Independent PR review found and the candidate now fixes item-only edits overwriting unrelated saved fields; renewed Dev UAT remains pending.
- Residual risk: Renewed Dev UAT must confirm an ordinary item-only edit preserves moves and ability.
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
- Verification: Search/mechanics/duplicate component regression and `pnpm verify:deploy` passed. Independent PR review found and the candidate now implements active-option keyboard navigation, disabled-option skipping, Enter selection, and focus retention; renewed Dev UAT remains pending.
- Residual risk: Renewed Dev UAT must confirm keyboard navigation and final popover geometry.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260820-team-builder-ux-F002.md

### F-003

- Severity: medium
- Confidence: high
- Status: implemented
- Evidence: UAT showed locked Mega stones, long native ability/item lists, missing Other filter, modal Escape gaps, reset-to-English refreshes, opaque team AP/nature, incomplete battle-row localization, and hidden learnable-move mechanics.
- User impact: Users could not revise a Mega into a regular build, beginners still needed external references, and important build/localization information was not visible at decision time.
- Root cause: The first editing slice covered move selection and replacement persistence but did not yet apply the same interaction/accessibility/localization contract across related selectors and dialogs.
- Recommended solution: Treat selected stone as the form switch, use shared rich searchable ability/item pickers, persist independent display preferences and locale, centralize Escape behavior, and expose AP/nature/move mechanics inline.
- Alternatives and tradeoffs: Keeping native selects is smaller but cannot provide grouped mechanics-rich choices or a usable beginner flow.
- Affected areas: builder, team tray, item filters, Pokémon detail, type chart locale, dialog handling, component tests, product spec.
- Acceptance criteria: Mega can return to regular form; item/ability search and details work; Other is selectable; every modal closes from document Escape; locale persists/infers; AP/nature and move mechanics are visible; usage rows are localized.
- Verification: `pnpm verify:deploy` passes with 17 test files / 115 tests, production build, and 10 built-output/API checks; exact Dev UAT remains pending.
- Residual risk: Responsive popover geometry and all modal/locale journeys need exact-candidate Dev UAT.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260820-team-builder-ux-F003.md
