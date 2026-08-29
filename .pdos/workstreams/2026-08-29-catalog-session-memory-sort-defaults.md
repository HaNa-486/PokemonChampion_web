# Workstream: Add clear actions for ability/item catalogs, collapse team tray by default, make circled stat/mechanic columns sort descending on first click, and retain all tab state until reload.

- Status: active
- Started: 2026-08-29T08:54:38Z
- Updated: 2026-08-29T09:17:00Z
- Branch: codex/catalog-type-order-total-stat
- Base commit: 4767be2260fa563bbeb0e5bf0d2b16c674e85144
- Scope: Add clear actions for ability/item catalogs, collapse team tray by default, make circled stat/mechanic columns sort descending on first click, and retain all tab state until reload.
- Files or areas at risk: ChampionsApp tab lifecycle, database view state, sorting, team tray, tests

## Coordination

- Overlap checked: current branch and active PDOS records inspected; changes extend the same catalog candidate without touching unrelated F-006 remediation files
- Dependencies:
- Consequential conflicts:

## Handoff

- What changed: Ability and Held Item databases gained one-click clear actions; the team tray now starts collapsed; requested Pokémon stat and move-mechanic columns start descending; all five main views stay mounted while inactive views return no UI, preserving in-memory state without rendering hidden tables.
- Verification: TypeScript passed; targeted regression set passed 8/8; full component suite passed 48/48; `pnpm verify:deploy` passed with 17 files / 132 tests, both data audits, production build, and 10 rendered-output/API checks.
- Residual risks: responsive visual fit and interaction feel still require Dev UAT; strict PDOS validation remains blocked by pre-existing unrelated malformed F-006 records.
- Next safe action: commit the exact verified candidate, run `pnpm verify:dev`, deploy that commit to Champions Lab Dev, and request focused UAT.
