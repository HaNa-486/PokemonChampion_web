# Workstream: Align move and Pokémon-detail move type ordering with the Pokémon catalog, add clear filters, and add total base stat filtering/sorting/display.

- Status: completed
- Started: 2026-08-29T07:55:34Z
- Updated: 2026-08-29T08:08:56Z
- Branch: codex/catalog-type-order-total-stat
- Base commit: 4b310f70dd365619e2da89fdc570b1775cc6968d
- Scope: Align move and Pokémon-detail move type ordering with the Pokémon catalog, add clear filters, and add total base stat filtering/sorting/display.
- Files or areas at risk: catalog filters, Pokémon detail modal, Pokémon table, localization, tests

## Coordination

- Overlap checked: pending
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Move DB and Pokémon-detail move filters now follow the Pokémon DB ALL_TYPES order; learnable move type sorting uses that order; Move DB has one-click filter clearing; Pokémon DB shows, filters, and sorts computed TOT.
- Residual risks: No browser screenshot/DOM/responsive visual QA was run because it was not explicitly requested; Dev UAT should check 390, 768, and 1440 widths. Existing unrelated PDOS F-006 validation errors remain.
