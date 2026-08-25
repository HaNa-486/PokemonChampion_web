# Review: Team member editing and move selection UX

- Review ID: REV-20260820-team-builder-ux
- Mode: review-and-fix
- Status: implemented
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

### F-004

- Severity: medium
- Confidence: high
- Status: implemented
- Evidence: Builder move choices exposed only the four automatically selected recommendations; ability, item, and nature choices did not expose their actual top-ten usage order. Live Clefable Doubles API and CSV both start move data at rank 6, while the UI had no missing-rank explanation. Type matchup groups retained canonical type order instead of severity order.
- User impact: Players could not quickly find the full current top ten, could misread incomplete upstream rankings as a website display bug, and could miss the strongest weakness or resistance at a glance.
- Root cause: Recommendation helpers intentionally truncated moves to four and returned only one choice for other resources; battle normalization did not model rank gaps; matchup grouping filtered without multiplier sorting.
- Recommended solution: Preserve rank-aware top-ten choices separately from four-move defaults, detect and disclose upstream rank gaps without fabrication, and sort defensive matchups by multiplier severity.
- Alternatives and tradeoffs: Filling Clefable ranks 1–5 from another source would look complete but would fabricate or mix incompatible data, violating the product data contract.
- Affected areas: battle recommendation mapping, builder selectors, battle normalization/detail UI, type matchups, tests, specification, generated Gallade form mapping.
- Acceptance criteria: Every mapped legal rank 1–10 is pinned with its actual rank in move/ability/item/nature selectors; Clefable preserves ranks 6–10 and names missing ranks 1–5; 4× precedes 2× and ¼× precedes ½×.
- Verification: Unit/component regressions and the full exact-candidate deployment gate are required; live form audit must pass.
- Residual risk: Real responsive selector geometry and the live Clefable disclosure require Dev UAT.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260825-team-builder-ux-F004.md

### F-005

- Severity: medium
- Confidence: high
- Status: in_progress
- Evidence: The Pokémon detail dialog listed AP usage ranks 1–10, but Build Workbench only applied the first valid spread and exposed no way to inspect or apply ranks 2–10 without leaving the editor.
- User impact: Players comparing common spreads had to move between dialogs and manually reproduce six values, making mistakes and in-place edits unnecessarily likely.
- Root cause: `recommendedAp` intentionally returned one spread and the builder rendered only six sliders, unlike the rank-aware move, ability, item, and nature controls.
- Recommended solution: Expose valid current-format AP ranks 1–10 in the builder with real rank, allocation, and usage; apply a choice atomically and mark any accepted slider edit as Custom.
- Alternatives and tradeoffs: A second AP modal would preserve the current layout but retains the context-switching problem; copying values manually is rejected as error-prone.
- Affected areas: battle recommendation mapping, Build Workbench, responsive styles, component/domain tests, specification.
- Acceptance criteria: Singles/Doubles choices remain isolated; ranks and gaps are preserved; a choice updates all six values; exact saved spreads are recognized; manual adjustment changes to Custom; invalid spreads are excluded.
- Verification: Domain/component regressions and `pnpm verify:deploy` pass with 17 test files / 118 tests, production build, and 10 rendered-output/API checks; exact committed Dev packaging and Dev UAT remain required.
- Residual risk: Long localized option labels and mobile layout need real Dev UAT.
- Autonomy class: auto-decide
- Remediation: remediations/REM-20260825-team-builder-ux-F005.md
