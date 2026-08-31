# Workstream: Add a full-site BD/WP theme switch between format and locale controls, defaulting to dark mode.

- Status: completed
- Started: 2026-08-31T02:53:25Z
- Updated: 2026-08-31T08:31:00Z
- Branch: codex/dark-mode
- Base commit: 2f04fb164f3a77990a425a39f58621fb02a33b85
- Scope: Add a full-site BD/WP theme switch, resolve theme/language preference flashes and stat contrast findings, and expose localized move effects directly in the mobile Move DB table.
- Files or areas at risk: ChampionsApp header, global theme/locale bootstrap, database tables, type chart shell, preference persistence, mobile horizontal scrolling, responsive/accessibility tests

## Coordination

- Overlap checked: no active workstream overlaps the header, theme tokens, or preference state. Two pre-existing uncommitted files only record the completed Type Chart production release and are preserved.
- Dependencies: exact candidate commit, Dev verification/deployment, and product-owner UAT
- Consequential conflicts: none

## Handoff

- What changed: Stored theme and language preferences are applied before first paint; saved Chinese no longer exposes the English app while hydration catches up. SPE/TOT use the regular stat color in both BD and WP. Move DB displays localized Effect between Target and Properties, sized for direct mobile reading without opening the move tooltip.
- Verification: Product-owner Dev UAT approved exact candidate `947cf4eb8ce3e56306c2f9fa7b14b29f3995c0aa`; PR #10 `Deployment verification` and independent auto review passed. `pnpm verify:deploy` passed again on exact merge commit `0537cd498ef603960cb513f79ecb58af3d598bfd` with lint (0 errors), typecheck, form and Traditional Chinese audits, 17 Vitest files/133 tests, production build, and 13 built-output/API tests. Production smoke confirmed localized Effect placement and identical WP HP/SPE/TOT colors.
- Release: PR #10 merged as `0537cd498ef603960cb513f79ecb58af3d598bfd`; Champions Lab production version 32 deployed successfully at `https://champions-lab.eddy8613.chatgpt.site` from that exact merge commit.
- Residual risks: Traditional Chinese content may remain briefly hidden until hydration on unusually slow devices. Existing unrelated F-006 PDOS records still fail strict state validation. No data mapping changed, so the live data audit was not applicable.
- Next safe action: Monitor production feedback; open a new workstream for any follow-up.
