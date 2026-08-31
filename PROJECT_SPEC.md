# Pokemon Champions Team Builder — Implementation Specification

> Status: as-built v1 specification and commercial-scale target
> Audience: software engineers and coding LLM agents  
> Last updated: 2026-08-03 (Asia/Taipei)

## 0. Instructions for an implementing LLM

This file is the source of truth for the shipped v1 behavior and its commercial-scale target. Before changing code, read it completely and inspect the repository. For the existing repository, preserve its working Next.js/vinext/Sites architecture unless a separately approved migration milestone explicitly replaces it. Preserve unrelated user changes, treat every **MUST** as an acceptance requirement, and never invent game formulas, Regulation rules, translations, source data, or licensing rights.

Before handing work to the product owner for UAT, run every applicable local automated quality gate in this document, commit the exact candidate on a `codex/*` branch, and deploy that commit to the isolated, owner-only **Champions Lab Dev** Sites project before opening a pull request. Deliver the Dev URL, exact commit, reports, known limitations, migration notes, and UAT checklist. After UAT approval, open the pull request, run its checks plus an independent sub-agent auto review, address material findings, and merge only when those gates are clean. Production deployment is a separate promotion requiring explicit product-owner approval. If this file marks something unresolved, validate it with reliable Pokémon Champions examples before enabling that production feature.

## 1. Product objective

Build a global, commercial-ready, unofficial Pokémon Champions database and team-building web application. It should be fast, information-dense, responsive, accessible, and convenient for competitive players.

Reference sites and data sources:

- UX inspiration only: <https://gamewith.ai/pokemon-champions/en>
- Champions Battle Data: <https://championsbattledata.com/>
- API guide: <https://championsbattledata.com/api_guide.html>
- API rules: <https://championsbattledata.com/api-rules/>
- Pokémon Showdown source: <https://github.com/smogon/pokemon-showdown>
- Pokémon Showdown Champions moves: <https://github.com/smogon/pokemon-showdown/blob/master/data/mods/champions/moves.ts>
- Pokémon Showdown Champions abilities: <https://github.com/smogon/pokemon-showdown/blob/master/data/mods/champions/abilities.ts>
- Pokémon Showdown Champions items: <https://github.com/smogon/pokemon-showdown/blob/master/data/mods/champions/items.ts>
- PokeAPI docs: <https://pokeapi.co/docs/v2>
- PokeAPI source: <https://github.com/PokeAPI/pokeapi>
- PokeAPI sprites source: <https://github.com/PokeAPI/sprites>

GameWith may inspire interaction patterns only. **Do not copy** its CSS, layout, wording, recommendations, images, proprietary data, or branding. The product must state that it is unofficial and not affiliated with or endorsed by Pokémon, Nintendo, GAME FREAK, Creatures Inc., or The Pokémon Company.

## 2. Confirmed decisions

| Topic | v1 decision |
|---|---|
| Game scope | Only data legal in the current Pokémon Champions Regulation is usable |
| Formats | Singles and Doubles |
| Languages | English (`en`) and Traditional Chinese (`zh-Hant`) |
| Team size | Maximum 6 Pokémon |
| Duplicate Pokémon | Forms sharing one `species_clause_key` cannot coexist: base + Mega and sibling Mega branches such as X/Y are duplicates |
| Duplicate items | Non-null held items cannot repeat; empty item slots may repeat |
| Mega Pokémon | Mega Pokémon from different species families may coexist; each must hold its dedicated Mega Stone |
| Moves | Maximum 4 unique legal moves per Pokémon |
| AP | Total maximum 66; maximum 32 per stat |
| Nature | One non-HP stat may receive +10%, another -10%; neutral nature changes none |
| Anonymous users | Team stored locally in versioned IndexedDB |
| Anonymous scrapbooks | Multiple scrapbooks, per-book tags, ordering, and Pokémon membership stored locally in versioned IndexedDB |
| Accounts | Cloud sync/cross-device teams are phase 2, not v1 |
| Images | Champions Battle Data for Pokémon/form assets; pinned PokeAPI sprites for locally bundled held-item thumbnails |
| Included | Complete paginated catalogs, details, tooltips, reverse lookup, advanced filters, type chart, usage-based build defaults, builder/tray, admin overrides |
| Excluded | Speed comparison UI (temporarily withdrawn), damage calculator, AI/strategy recommendations, team analysis, tier lists, community content |
| Commercial intent | Yes; privacy, consent, attribution, security, and legal-review readiness are required |

The v1 usage-based defaults are deterministic: for the chosen Singles or Doubles format, apply the highest-ranked legal held item, ability, nature, AP spread, and up to four legal unique moves from current Champions battle data. They are editable starting values, not strategic recommendations. Future-only AI recommendations may use the complete legal Pokémon/move/ability/item/Regulation/battle dataset and a user's natural-language goal. Do not implement an LLM feature in v1, but keep normalized data and domain APIs suitable for future retrieval.

## 3. v1 pages and non-goals

Required pages:

1. Home/current Regulation overview
2. Pokémon database
3. Pokémon comparison scrapbooks
4. Pokémon detail
5. Move database
6. Ability database
7. Held item database
8. Team builder
9. Full 18×18 type matchup chart
10. Data sources, attribution, and data date
11. Privacy, terms, cookie settings, and unofficial-project notice
12. Protected admin override interface

Non-goals: damage calculation, AI/strategy recommendations, team synergy analysis, tier lists, user comments/voting, public raw-data mirror, bulk-data download, competing general-purpose data API, and native apps.

## 4. Data ownership, precedence, and legal use

### 4.1 Champions Battle Data is authoritative for

- Current Champions Regulation availability
- Champions-specific Pokémon/form stats
- Singles/Doubles battle usage, seasons, and daily snapshots
- Common moves, items, abilities, natures, AP spreads, and teammates
- Champions sprites/type assets
- Showdown IDs and `saved_name` asset/file mapping

Known endpoints:

```text
GET /api
GET /api/index
GET /data/pokemon-index.json
GET /api/pokemon/:name
GET /api/battle/:format/:name
GET /api/metadata/:name
```

API routes use Showdown-like identifiers; asset paths may use human-readable `saved_name` values.

### 4.2 Pokémon Showdown is authoritative for move, ability, and held-item mechanics

For every move that Champions Battle Data marks legal, merge the following pinned-revision sources in this order:

1. `data/moves.ts` for base move structure and mechanics.
2. `data/text/moves.ts` for complete base English descriptions.
3. `data/mods/champions/moves.ts` for Champions-specific overrides.
4. `data/mods/champions/scripts.ts` for reviewed global Champions rules, including the PP cap and calculation.

Abilities and held items use the equivalent pinned base data, text, and `data/mods/champions` override tables. The complete held-item catalog is the merged Showdown base/Champions set whose effective `isNonstandard` value is null; battle usage determines rankings and defaults only and MUST NOT determine catalog membership. The importer MUST parse these TypeScript data tables without executing downloaded source. Champions overrides and nested Champions text win over base fields. Champions PP is calculated with the reviewed Champions rule, not copied from a main-series dataset. A missing legal entity, missing English description, invalid mechanic, incomplete legal item set, or changed global rule rejects the snapshot for review.

### 4.3 PokeAPI is used to enrich

- Stable IDs and taxonomy
- Localization and alias mapping
- Held-item sprite assets selected from the separate PokeAPI sprites repository at a fixed commit

Only catalog-matched held-item PNGs are bundled locally; the application must not fetch a third-party item image during hover or rendering. PokeAPI must never supply or overwrite authoritative Champions move, ability, or held-item mechanics, availability, or behavior. PokeAPI supplies IDs, aliases, and community-maintained localization candidates; its locale label is not proof that a string is authoritative or even correctly Traditional Chinese. Move names use a pinned Traditional Chinese game-string source mirrored by PKHeX and must match it exactly. Champions-specific or otherwise missing prose is translated from the effective Showdown Champions description, committed with provenance, and reviewed independently. A `zh-Hant` catalog build must fail closed rather than silently publish English or Simplified Chinese as Traditional Chinese.

### 4.4 Manual overrides

Published admin overrides have highest precedence for mapping fixes, reviewed translations, Champions corrections, availability fixes, and temporarily disabling bad records.

Display precedence:

```text
published manual override
→ active Champions Regulation legality, form data, and usage
→ Pokémon Showdown Champions entity override/global rule
→ Pokémon Showdown base entity data and English text
→ pinned Traditional Chinese game-string name when available
→ reviewed PokeAPI localization candidate or explicit reviewed mapping otherwise
→ committed, provenance-recorded translation of effective Champions mechanics
→ import failure when required `zh-Hant` content is still missing
→ explicit “Data unavailable”
```

Never fabricate missing data.

### 4.5 Volatility and attribution

Live observations already show that API guide examples may differ from current responses in counts, stats, forms, dates, and fields. Therefore never hard-code current counts/example values. Accept unknown optional fields, reject/quarantine invalid required fields, record versions/checksums/source URLs, import through staging, and atomically publish immutable snapshots. If import fails, keep serving the last valid snapshot.

Public attribution must link Pokémon Champions Battle Data and Pokémon Showdown where their data is displayed or used, and must identify PokeAPI sprites as the held-item image source. Reasonable caching is allowed, but do not expose raw responses as a permanent mirror, dump, bulk-download product, or competing API. Cache PokeAPI responsibly and preserve all applicable upstream license notices. Confirm the image-rights position before commercial release rather than inferring rights from repository availability.

## 5. Architecture: shipped v1 and scale target

### 5.1 Shipped v1 architecture

The existing repository is authoritative for v1 implementation shape. It uses pnpm, Next.js/React, strict TypeScript, vinext, Cloudflare-compatible Sites output, Zustand plus versioned IndexedDB, Floating UI, Vitest/Testing Library, and a committed generated Champions/Showdown/PokeAPI snapshot. API/BFF routes live in the same application. Preserve `.openai/hosting.json`, the current lockfile, build pipeline, and Sites deployment packaging.

Domain calculations, legality, normalization, and recommendation mapping MUST remain deterministic and independently testable outside React components. External boundaries must be validated and must not become arbitrary upstream proxies.

### 5.2 Commercial-scale target

The following modular-monolith layout is a future migration target for account sync, durable historical data, scheduled imports, larger operational scale, and stronger isolation. Do not rewrite the shipped application into this topology without an explicitly approved migration plan, compatibility tests, data migration, rollback plan, and unchanged user-visible behavior.

```text
apps/
  web/          Next.js user/admin UI
  api/          NestJS REST API/BFF
  worker/       scheduled imports and BullMQ jobs
packages/
  domain/       pure calculations and legality rules
  contracts/    Zod DTOs and OpenAPI types
  database/     Prisma schema, migrations, seeds
  ui/           accessible reusable UI
  config/       shared TS/lint/test config
fixtures/
  champions-api/
  pokeapi/
  golden/
docs/
  architecture/
  runbooks/
  test-reports/
```

Commercial-scale target choices:

| Area | Technology |
|---|---|
| Workspace | pnpm with committed frozen lockfile |
| Web | Next.js, React, strict TypeScript |
| API | NestJS REST + OpenAPI |
| Worker | NestJS application context + BullMQ |
| Database | PostgreSQL + Prisma migrations |
| Cache/queue | Redis |
| Assets | S3-compatible storage/CDN subject to source rules |
| Validation | Zod at every external boundary |
| Client data | TanStack Query |
| Tables | TanStack Table; virtualize large results |
| Local state | Zustand + versioned IndexedDB |
| i18n | next-intl |
| Tooltips | Floating UI |
| Unit/component | Vitest + Testing Library |
| HTTP fixtures | MSW or deterministic fixture adapter |
| Integration | Testcontainers with real PostgreSQL/Redis |
| E2E | Playwright: Chromium, Firefox, WebKit |
| Accessibility | axe-core plus manual keyboard checks |
| Load | k6 |
| Observability | OpenTelemetry + Sentry-compatible reporting |

Use supported stable versions pinned by the lockfile. Domain code must not depend on React, NestJS, Prisma, or browser APIs. Until the scale migration is approved, new v1 work MUST use the shipped architecture in section 5.1 rather than introducing a parallel backend stack.

Deployment: CDN/WAF in front; SSR/ISR web; stateless horizontally scalable API; PostgreSQL system of record; Redis disposable cache/queue; independently deployable worker; isolated local/test/staging/production.

## 6. Database/domain model

Internal entities use application UUIDs. External IDs, slugs, Showdown IDs, names, and `saved_name` are mappings, never primary keys. Mutable tables have timestamps; published snapshots are immutable.

The shipped snapshot/runtime form DTO MUST keep these identities separate:

```text
id             stable internal/UI form id
speciesKey     family legality key used to prevent duplicate base/Mega branches
battleDataKey  Champions Showdown id used by /api/battle/:format/:name
savedName      metadata/CSV/asset display and filename mapping
```

`speciesKey` MUST NOT be used as the battle API lookup key. Regional, gender, breed, appliance, and other independently indexed non-Mega forms use their own `battleDataKey`. Every Mega form uses the battle source of the one regular form explicitly mapped by its dedicated Mega Stone. The upstream `gallademega` source is a reviewed compatibility exception and MUST be ignored; Mega Gallade uses `gallade`. Ambiguous mappings fail the import; they are never resolved by last-write-wins behavior.

### 6.1 Provenance and mappings

```text
data_sources(
  id UUID PK, code UNIQUE, base_url, license_url, attribution_text,
  last_success_at NULL, last_failure_at NULL
)

external_identifiers(
  id UUID PK, entity_type, entity_id UUID, source_id FK,
  external_id NULL, external_key NULL, external_name NULL
)
```

Add unique indexes scoped by source/entity type. Support PokeAPI ID/slug, Showdown ID/name, Champions slug/base name/`saved_name`.

### 6.2 Pokémon and types

```text
pokemon_species(
  id UUID PK, national_dex_no NULL, canonical_slug UNIQUE,
  generation NULL, is_legendary, is_mythical
)

pokemon_forms(
  id UUID PK, species_id FK, canonical_slug UNIQUE, form_name NULL,
  is_default, height NULL, weight NULL, champions_saved_name NULL,
  champions_showdown_id NULL, species_clause_key,
  sprite_asset_id NULL
)

types(id UUID PK, code UNIQUE, sort_order)

pokemon_form_types(
  pokemon_form_id FK, type_id FK, slot CHECK 1..2,
  PK(pokemon_form_id, slot)
)
```

Forms are first-class entities. Mega and regional/breed/gender forms cannot be stored only as unstructured display text.

### 6.3 Rulesets and stats

```text
rulesets(
  id UUID PK, code UNIQUE, name, game_version, season_code,
  effective_from NULL, effective_to NULL,
  status draft|active|archived, calculation_version,
  source_snapshot_id NULL
)

ruleset_pokemon_stats(
  ruleset_id FK, pokemon_form_id FK,
  hp, attack, defense, special_attack, special_defense, speed,
  source_id FK, source_updated_at NULL,
  PK(ruleset_id, pokemon_form_id)
)

ruleset_pokemon_availability(
  ruleset_id FK, pokemon_form_id FK, is_available,
  species_clause_key, reason NULL,
  PK(ruleset_id, pokemon_form_id)
)
```

Exactly one public default ruleset. Historical values remain queryable and are never overwritten. `species_clause_key` identifies the underlying team-legality family: a base form and all of its Mega branches share the same key and cannot coexist. Mega Pokémon from different families have different keys and may coexist.

### 6.4 Moves

```text
moves(
  id UUID PK, canonical_slug UNIQUE, type_id FK,
  damage_class physical|special|status,
  power NULL, accuracy NULL, pp NULL,
  priority SMALLINT NOT NULL, target_code, effect_chance NULL
)

move_flags(move_id FK, flag, PK(move_id, flag))

ruleset_move_overrides(
  ruleset_id FK, move_id FK, power NULL, accuracy NULL, pp NULL,
  priority NULL, target_code NULL, effect_text_override NULL,
  is_available, source_id FK, PK(ruleset_id, move_id)
)

pokemon_learnable_moves(
  ruleset_id FK, pokemon_form_id FK, move_id FK,
  learn_method NULL, is_legal, source_id FK,
  PK(ruleset_id, pokemon_form_id, move_id)
)
```

Effective move values apply the ruleset override over normalized base data. Store priority as an integer; positive/zero/negative are query classifications, not stored strings.

### 6.5 Abilities, items, localization

```text
abilities(id UUID PK, canonical_slug UNIQUE, short_effect NULL, effect_text NULL)

pokemon_abilities(
  ruleset_id FK, pokemon_form_id FK, ability_id FK,
  slot NULL, is_hidden, is_available,
  PK(ruleset_id, pokemon_form_id, ability_id)
)

items(
  id UUID PK, canonical_slug UNIQUE, category NULL,
  short_effect NULL, effect_text NULL, sprite_asset_id NULL
)

ruleset_items(
  ruleset_id FK, item_id FK, is_available,
  acquisition_method NULL, regulation_code NULL,
  effect_override NULL, source_id FK,
  PK(ruleset_id, item_id)
)

localized_texts(
  id UUID PK, entity_type, entity_id UUID, locale en|zh-Hant,
  name, short_description NULL, description NULL, source_id FK,
  review_status imported|machine|reviewed|published
)
```

### 6.6 Battle snapshots

```text
battle_snapshots(
  id UUID PK, ruleset_id FK, format singles|doubles,
  season_code, snapshot_date DATE, source_id FK, source_url,
  source_data_version NULL, source_checksum, imported_at,
  status staging|active|rejected|superseded,
  validation_report JSONB,
  UNIQUE(source_id, format, season_code, snapshot_date, source_checksum)
)
```

Use separate fact tables with `snapshot_id`, `pokemon_form_id`, referenced entity, `rank`, numeric `percentage`, and nullable `sample_size`:

- `battle_move_usage`
- `battle_item_usage`
- `battle_ability_usage`
- `battle_nature_usage`
- `battle_teammate_usage`
- `battle_ap_spread_usage` with six AP columns plus stat-up/stat-down

Do not store searchable battle data only in JSON. Blank upstream percentages remain null, never silently become 0.

### 6.7 Assets

```text
assets(
  id UUID PK, kind, source_id FK, upstream_url, cdn_url NULL,
  content_type, width NULL, height NULL, checksum NULL,
  status upstream|cached|missing|blocked
)
```

Fetch only from explicit allowlists with timeout/size/type limits. Normalize path separators and URL-encode segments. Broken assets show accessible placeholders.

The shipped v1 keeps a generated held-item sprite manifest separate from the gameplay snapshot. It records the fixed PokeAPI sprites commit, each catalog item ID, selected repository path, local public URL, and an explicit unavailable state. Item PNGs are validated before atomic publication, and a missing or broken asset falls back to a neutral local icon without removing the item name.

### 6.8 Teams

The same versioned Team DTO is used by IndexedDB and future server persistence.

```text
teams(
  id UUID PK, owner_user_id NULL, public_id UNIQUE NULL, name,
  ruleset_id FK, format, locale, revision, is_public,
  created_at, updated_at
)

team_members(
  id UUID PK, team_id FK, slot CHECK 1..6, pokemon_form_id FK,
  ability_id NULL, item_id NULL, nature_code NULL,
  ap_hp, ap_attack, ap_defense, ap_special_attack, ap_special_defense, ap_speed,
  final_hp NULL, final_attack NULL, final_defense NULL,
  final_special_attack NULL, final_special_defense NULL, final_speed NULL,
  calculation_version, memo NULL,
  UNIQUE(team_id, slot)
)

team_member_moves(
  team_member_id FK, slot CHECK 1..4, move_id FK,
  PK(team_member_id, slot), UNIQUE(team_member_id, move_id)
)
```

Final stats are reproducibility snapshots, not trusted input. Domain/backend recalculates them from base stats, AP, nature, and calculation version.

### 6.9 Admin overrides

```text
data_overrides(
  id UUID PK, entity_type, entity_id UUID, ruleset_id NULL,
  field_path, locale NULL, old_value JSONB NULL, new_value JSONB,
  reason, status draft|published|reverted,
  created_by, reviewed_by NULL, created_at, published_at NULL
)
```

Admin changes require authentication, authorization, validation, preview, explicit publish, audit log, and revert. The UI must not expose arbitrary raw-row editing.

## 7. Domain rules and calculation blocker

All rules live as deterministic, versioned pure functions in `packages/domain`.

### 7.1 AP/nature

- Each AP is an integer `[0,32]`.
- Six-stat sum is `[0,66]` while editing.
- Builds below 66 may save locally but are marked incomplete.
- UI displays remaining AP.
- HP is never nature-modified.
- Neutral nature modifies none.
- Non-neutral nature has exactly one non-HP `1.1` stat and one different non-HP `0.9` stat.

### 7.2 Versioned final-stat formula (`champions-v1`)

The formula has been validated against the supplied Mega Charizard X reference image and the sampled Champions Garchomp values:

```text
HP = base HP + 75 + HP AP
other stat = floor((base stat + 20 + stat AP) × nature multiplier)
nature multiplier = 1.1 for the increased stat, 0.9 for the decreased stat, otherwise 1.0
```

Golden fixture: Mega Charizard X with base `78-130-111-130-85-100`, AP `2-32-0-0-0-32`, Adamant nature produces `155-200-131-135-105-152`. Zero-AP neutral Garchomp produces `183-150-115-100-105-122`. Preserve these as immutable tests and version future formula changes instead of rewriting old builds.

### 7.3 Team legality

The structured validator MUST enforce:

- Maximum six members.
- No duplicate `species_clause_key`: base + Mega and sibling Mega branches such as X/Y are mutually exclusive.
- Distinct legal Mega Pokémon from different species families are allowed.
- No duplicate non-null item.
- Every Mega form holds its dedicated Mega Stone; selecting that stone on a base form immediately switches the effective sprite, name, types, ability pool, base stats, and final stats to the matching Mega form.
- At most four unique moves per member.
- All Pokémon/moves/abilities/items legal in active ruleset.
- Move learnable by selected form.
- Ability owned by selected form.
- AP/nature constraints.

Changing ruleset never silently deletes selections. Preserve them with actionable errors until explicitly fixed/removed.

## 8. UX requirements

### 8.1 General

Use an original design system, light/dark themes, dense desktop tables, responsive mobile cards, explicit loading/empty/error/stale states, and text/icons in addition to color. Show current Regulation, format, snapshot date, and attribution clearly. Serialize filters to the URL where practical.

### 8.2 Pokémon DB/detail

Name search matches localized Pokémon names/aliases only; type text is handled by the type filters and must not leak into name search. Database filters include multi-select type with explicit OR/AND behavior, regular/Mega form, searchable ability, multiple searchable learnable moves using AND, minimum values for all six base stats, current availability, and Singles/Doubles context. Sort by name, type, usage rank where available, total stats, and all six stats.

Results show sprite, name/form, types, Champions stats, abilities, and usage rank where available. All legal results are reachable through pagination; a fixed first-100 truncation is forbidden. Headers show filtered total, visible range, and total count. Detail shows sprite/form/types, stats, all available abilities, weaknesses/resistances/immunities, format-specific battle usage, common moves/items/abilities/natures/AP spreads/teammates, the complete form-specific learnset, data date/attribution, and team-builder controls. Defensive weaknesses sort by descending multiplier (for example 4× before 2×); resistances sort by ascending multiplier (¼× before ½×), with the canonical type order as the stable tie-breaker.

The form-specific learnset inside Pokémon detail reuses the Move DB search plus priority-sign, type, category, target, and property filters. Filter combinations use the same semantics as Move DB, expose the filtered/total count, provide clear-all and empty states, and must never show a move outside that form's legal learnset. Its deterministic default order is category (`Physical`, `Special`, `Status`) → type → priority descending → normalized properties → target → name as the final tie-breaker; filtering preserves this order. On narrow mobile screens the controls use an explicitly labelled collapsible filter panel with horizontally scrollable chip rows, while results remain a single-column touch-friendly list.

Current-season move, held-item, and ability usage entries are interactive tooltip triggers, not plain text. Move rows include a visible type badge. Held-item entries show the recognizable local thumbnail next to the localized item name; unmapped entries retain readable upstream text and a neutral fallback icon. They resolve through canonical catalog identities, show the same localized descriptions as their database pages, support mouse hover, keyboard focus, and touch tap, and fall back safely when a row cannot be mapped.

### 8.3 Tooltips/popovers

Moves, abilities, and items must explain themselves directly.

Move content: localized name, type, physical/special/status, power, accuracy, PP, signed priority (`+1`, `0`, `-1`), target, flags, short effect, details action. Ability/item content uses the effective Champions text and indicates ruleset overrides; item triggers and tooltip headings repeat the same held-item thumbnail, and items also show category and acquisition/regulation info when known.

Behavior:

- Mouse opens after about 150 ms and closes without flicker.
- Keyboard focus opens; Escape closes.
- Touch first tap opens information; navigation uses a distinct explicit action.
- Flip/shift inside viewport; not clipped by tables or team tray.
- Use accessible relationships such as `aria-describedby`.
- Page/batched data supplies tooltip summaries; hover never creates upstream/N+1 requests.

### 8.4 Move priority filter

Filters include search, type, class, power, accuracy, PP, target, flags, learnable Pokémon, Regulation, and priority.

Priority MUST offer:

- `Priority +` → effective priority `>0`
- `Priority 0` → `=0`
- `Priority -` → `<0`
- Advanced numeric min/max

Results have an independent priority column. Positive values include `+`; sort numerically. Explain that priority precedes ordinary speed and does not universally guarantee moving first.

Move and ability tables also show the total number of current-Regulation Pokémon forms that can use the entry. The count is numerically sortable. Activating the name or count opens an accessible reverse-lookup dialog containing every eligible form, its sprite, types, Mega/form identity, six base stats, and abilities. Results use a dense Pokémon DB-style semantic table rather than cards; its sortable headers stay synchronized with the explicit sort controls. The dialog reuses Pokémon DB's name-only search, type OR/AND, regular/Mega, searchable ability, multiple known-move AND, and six minimum-stat filters. Users can sort by name, type, ability, or any base stat in either direction. For a move lookup, the deterministic default order places Pokémon sharing the move's type first, then orders by type and Pokémon name; remaining Pokémon follow by type and name. Ability lookups default to type then name. Mobile keeps search and sorting visible while advanced filters use an accessible collapsible panel; the result remains a horizontally scrollable table with a sticky Pokémon column instead of converting to cards. Reverse indexes are built from the normalized legal snapshot; hover must not query upstream data.

### 8.5 Floating team tray

Persist across relevant pages. Singles and Doubles each own an independent versioned team of up to six members and can be switched without losing either group. Each member shows sprite/name/form, types, weaknesses/resistances/immunities, four moves with type badges, validated final stats, per-stat AP additions, nature increase/decrease arrows, ability, item thumbnail/name, completion/legal state, and edit/remove actions.

Edit opens the Build Workbench with that exact member's saved form, moves, ability, item, nature, and AP. Saving replaces the member in the same team slot and keeps its stable member ID; it never appends a duplicate or changes order. Team legality is evaluated against the complete replacement team while excluding the member's old values from duplicate checks. The member's Singles/Doubles team is fixed during editing.

Adding a seventh never silently overwrites; open replacement selection. Duplicate attempts show domain errors. Incomplete members are allowed and marked. Desktop uses a collapsible floating panel whose internal scroll area makes all six complete cards reachable; mobile uses a fixed bottom bar and accessible bottom sheet. Persist with versioned IndexedDB; LocalStorage only for tiny preferences/migration flags. Navigation/refresh preserves state. Corrupt/old data migrates or quarantines without crashing.

### 8.6 Speed comparison (temporarily withdrawn)

Do not expose a Speed Compare page, navigation tab, or other user-facing entry point in the current release. The independently tested speed-domain calculation and `/api/v1/speed/compare` contract may remain dormant so a future approved iteration can restore the experience without coupling it to React or re-inventing mechanics.

### 8.7 Usage-based build defaults and Mega transformation

Opening the Build Workbench immediately requests current usage for the selected regular form's `battleDataKey` in both formats. Recommendation responses are cached by `battleDataKey`; changing between a regular form and any of its Mega forms reuses the same response without a duplicate request. The currently selected Singles/Doubles mode deterministically applies the highest-ranked legal held item, ability, nature, valid AP spread, and up to four unique learnable moves. A format switch reapplies that format's defaults. Missing, unmapped, duplicated, or illegal upstream rows are skipped; the UI clearly falls back to catalog defaults rather than fabricating a value. If an upstream category omits rank numbers, the detail UI names the missing ranks and preserves every reported rank instead of renumbering or inventing rows. Every starting value remains user-editable. The AP editor exposes every valid reported current-format rank 1–10 with its real rank, six-stat allocation, and usage percentage; choosing one applies it immediately. Editing a saved build recognizes an exact ranked spread, while any accepted manual slider adjustment changes the selector state to Custom without discarding the adjusted values.

Each move slot uses an accessible searchable combobox rather than a native long select. Search matches localized and English move names plus effect text. Results pin every mapped, legal current-format usage rank 1–10 first in its real source-rank order, then use deterministic category, type, descending priority, and localized-name ordering. Ability, held-item, and nature selectors likewise pin their mapped current-format usage ranks 1–10 and show the real rank; missing ranks are never compressed. Every move option shows localized type, category, Power, Accuracy, priority, and a short effect explanation; an already selected move is visibly disabled. Keyboard, mouse, and touch users can open, search, choose, clear, or dismiss a slot. On mobile, the result panel stays inside the dialog viewport with its own scroll area.

Ability and held-item fields use the same searchable-combobox interaction. Ability search covers localized/English name and effect text. Held items are grouped by effect class in the order Mega Stone, HP Recovery, Status Cure, PP Recovery, Damage Halving, and Other; a stone dedicated to the selected species family appears first in the Mega Stone group. Each option exposes its localized effect. Move, ability, and item pickers each have an independent Detailed/Compact preference, default to Detailed, and persist that small preference locally.

All 21 supported Champions natures appear with explicit increased/decreased stat labels; neutral natures state that no stat changes. AP defaults must pass the same `[0,32]` per-stat and total `≤66` validator as manual edits.

A Mega form preselects its dedicated stone. Every stone maps to one explicit compatible regular-form ID; `speciesKey` remains the duplicate-team family key and MUST NOT authorize transformation because regional and other sibling forms may share it. Selecting a matching Mega Stone on that compatible base form changes the effective form immediately, including sprite, displayed name, types, ability options, base stats, matchup profile, final stats, and team-legality identity. Removing that stone or choosing an ordinary held item immediately returns the build to its regular form and reconciles only moves/abilities that are no longer legal. A saved Mega member may therefore be edited back into its regular form. Submitted Mega builds still must hold their dedicated stone and all builds remain subject to duplicate-family and duplicate-item validation.

### 8.8 Type matchup chart

Provide a complete 18×18 attack-versus-defense matrix as a standalone page. Attack types run down the left and defending types across the top. Use full, high-contrast type badges plus text/icon cues; color alone is insufficient. The matrix must fit its available width and height without an internal horizontal or vertical scrollbar at the supported 390, 768, and 1440 CSS-pixel viewports. Compact viewports may use localized one- or two-character type codes while preserving the full type name as an accessible label and tooltip.

The primary application navigation exposes the chart as a first-class tab alongside the databases. The tab must remain accessible on mobile without adding a floating control. The chart prioritizes the complete relationship matrix over explanatory framing: spacing, labels, multiplier text, and row height adapt to the viewport so all 18×18 relationships are visible together and make useful use of each cell. Color remains a secondary cue; multiplier text and accessible type names must remain available. The standalone `/type-chart` page remains available as a direct route. Verify behavior at 390, 768, and 1440 CSS pixels.

### 8.9 Pokémon comparison scrapbooks

The primary navigation exposes Scrapbooks directly between Pokémon DB and Move DB. Anonymous users may create multiple locally persisted scrapbooks. Each scrapbook owns its own reusable tags, and a Pokémon may belong to multiple tags in the same scrapbook; Pokémon with no tag appear under a generated Untagged group. Adding a Pokémon from the Pokémon DB row, Pokémon detail, move reverse lookup, or ability reverse lookup opens one consistent flow that can select or create a scrapbook and select or create multiple tags.

The scrapbook page includes a collapsible Pokémon DB-equivalent quick finder. It shows no candidate Pokémon until at least one search/filter condition is present, while already saved scrapbook contents remain visible. Tag groups can be expanded independently, expanded or collapsed all at once, and reordered by pointer drag or accessible move controls. A collapsed group shows member sprites. Pokémon within a group can likewise be reordered. Multi-tag membership may display the same Pokémon in each selected group without duplicating its saved scrapbook entry.

An expanded group displays localized identity, types, deterministic final stats, and defensive type matchups directly in the comparison row; TOT is omitted. Final stats use the current-format top valid AP/nature usage when available and the versioned zero-AP neutral fallback when usage is unavailable. Repeated appearances of the same Pokémon reuse one battle-data request.

Selecting a comparison row expands full Pokémon intelligence inline and retains the Build Workbench action. Learnable moves use a dense list: the Pokémon's own types first, remaining types in canonical catalog order, then Physical → Special → Status within each type. The current-season move, held-item, ability, nature, AP-spread, and teammate sections each have an independent visibility toggle. The page must remain operable and unclipped at 390, 768, and 1440 CSS pixels.

### 8.10 i18n/accessibility

Support `en` and `zh-Hant`. On first visit, choose Traditional Chinese when any browser-preferred language begins with `zh`; otherwise choose English. Persist the user's explicit choice locally and restore it on refresh and future visits. Every legal Pokémon form, move, ability, and held item has a non-empty Traditional Chinese display name; every move, ability, and item has a non-English Traditional Chinese description. Pokémon species names must come from official Traditional Chinese data and must never be machine translated. Fixed taxonomy and interface labels—including types, move categories, targets, properties, ability categories, and item/effect categories—also follow the active locale. Locale changes preserve team/filters/format/page. Search accepts localized names/aliases. Identifiers never use translated names. Missing required Chinese catalog content fails the generated-data build instead of falling back silently to English.

Traditional Chinese localization preserves provenance per record. Move names must match the pinned Traditional Chinese game strings mirrored by PKHeX; PokeAPI `zh-Hant` values are community-maintained candidates and must never be trusted solely because of their locale label. Reviewed mappings cover Champions-only resources and form composition. Names are never machine translated. Descriptions are machine translations of the complete effective Pokémon Showdown Champions English mechanics, normalized to Taiwan Traditional Chinese, with reviewed semantic overrides for entries that fail parity. The localization audit must compare against the exact current English source, preserve all numbers, fractions, percentages, multipliers, rounding rules, trigger thresholds, and single-use conditions, reject Simplified Chinese, broken placeholders, and unapproved English residue, and record whether each result is raw machine translation or a reviewed semantic override.

Meet WCAG 2.2 AA: keyboard operation, visible focus, semantic headings/tables/forms/dialogs, tooltip focus support, document-level Escape dismissal for every modal, focus trap/restoration, 200% zoom, reduced motion, compliant contrast, no color-only meaning, and screen-reader labels such as “Priority plus one.”

## 9. Public API

Version under `/api/v1`, validate with Zod, document with OpenAPI, and use a common error envelope.

Response metadata where relevant:

```json
{
  "meta": {
    "ruleset": "current-code",
    "locale": "en",
    "dataVersion": "version",
    "snapshotDate": "2026-07-30",
    "stale": false,
    "attribution": []
  },
  "data": {}
}
```

Required endpoints:

```text
GET  /api/v1/rulesets/current
GET  /api/v1/pokemon
GET  /api/v1/pokemon/:slug
GET  /api/v1/pokemon/:slug/moves
GET  /api/v1/moves
GET  /api/v1/moves/:slug
GET  /api/v1/abilities
GET  /api/v1/abilities/:slug
GET  /api/v1/items
GET  /api/v1/items/:slug
GET  /api/v1/battle-data/:format/:pokemonSlug
POST /api/v1/team/validate
POST /api/v1/stats/calculate
POST /api/v1/speed/compare
```

Examples:

```text
GET /api/v1/moves?ruleset=current&type=fire&priorityClass=positive
GET /api/v1/moves?priorityMin=-8&priorityMax=-1
GET /api/v1/pokemon/garchomp/moves?priorityClass=nonzero
```

Behavior: bounded pagination/stable sort; 400 field errors; 404 unknown entity; stale valid data returns 200 with `stale=true`; ETag/cache-control on reads; no arbitrary upstream proxy or raw payload exposure; POST endpoints recalculate/validate independently.

## 10. Import pipeline

Champions job:

1. Fetch `/api` with timeout, identifying user agent, bounded retry/backoff.
2. Compare `dataVersion`, timestamps, and checksums.
3. Resolve ruleset, formats, forms, mappings, and asset paths.
4. Fetch only changed/needed resources with bounded concurrency.
5. Normalize names/percentages into staging.
6. Validate integrity and quality thresholds.
7. Atomically publish in one transaction.
8. Invalidate cache only after commit.
9. Record metrics/report and alert on rejection.

Showdown entity job pins a commit; statically parses base and Champions move, ability, item, text, and script tables; merges base then Champions; calculates Champions PP; derives the complete legal held-item set independently from usage; records per-record provenance; and rejects missing legal entities/descriptions or unreviewed global-rule changes. PokeAPI job caches/normalizes only needed IDs and localization, preserves provenance, updates incrementally, and never overwrites Champions or Showdown mechanic values. The separate item-sprite job pins a PokeAPI sprites commit, resolves only exact catalog IDs from the allowed item directories, validates bounded PNG responses, writes through temporary files, and publishes the manifest only after the complete requested asset set has been processed.

Import checks: required IDs; directly indexed non-Mega forms' `battleDataKey` equals their Champions `showdownId`; regional/gender/breed/appliance forms do not inherit a sibling's battle source; every Mega inherits its explicitly mapped regular form's source; the reviewed `gallademega` source never enters the snapshot; metadata rows map to exactly one index entry; percentages `[0,100]` or true null; blank not zero; scoped rank uniqueness where promised; mapped references or quarantine; unexpected count collapse; AP values valid; allowlisted assets; recorded version/date; unknown optionals tolerated; required missing fields rejected according to severity. The Ninetales/Alolan Ninetales pair is a permanent golden mapping fixture covering different keys, types, abilities, learnsets, battle sources, and usage-based defaults.

Failure: never activate partial/bad data; serve last good snapshot/date; circuit-break repeated failures; import failure cannot take down public API; admin can inspect quarantine.

## 11. Security, privacy, and legal requirements

- Zod validation at every external boundary.
- Parameterized ORM/database access.
- Team names/memos render as plain text; no arbitrary HTML.
- CSP, HSTS, Referrer-Policy, X-Content-Type-Options, minimal Permissions-Policy.
- Rate limits by IP/endpoint/identity.
- CSRF and Origin protection for state changes.
- Standards-based OIDC/OAuth + PKCE for admin; MFA at production identity provider.
- Explicit admin role/allowlist and complete audit log.
- HttpOnly/Secure/SameSite session cookies.
- Object-level authorization and non-guessable identifiers.
- Secrets in secret manager; never client/log output.
- Upstream host/path allowlist, timeout, response-size/type checks, bounded redirects.
- CI dependency/license/secret/SAST scanning.
- Production errors never reveal stack, SQL, paths, or environment.
- Anonymous teams remain on device except explicit minimal validation/calculation requests.
- Non-essential analytics/ads do not load before legally required consent.
- Consent can be reopened/withdrawn; English/Chinese policies exist.
- Attribution, unofficial notice, and data date are visible.
- Obtain IP/trademark/privacy legal review before commercial launch.

## 12. Performance/reliability targets

```text
LCP < 2.5 s
INP < 200 ms
CLS < 0.1
prefetched tooltip < 100 ms
client filter response < 200 ms
team tray interaction < 100 ms
CDN hit API p95 < 150 ms
uncached catalog p95 < 500 ms
calculation/validation POST p95 < 800 ms
expected-load error rate < 0.1%
monthly availability target 99.9%
```

Measure with production-like data on desktop and representative mid-range mobile. Use SSR/ISR, ETag/CDN/stale-while-revalidate, batched tooltip summaries, proper indexes, optimized dimensioned images, virtualization, stable bounded pagination, and concurrent import/read tests.

## 13. Automated testing specification

The owner performs UAT only after engineering gates pass.

| Layer | Scope/tool |
|---|---|
| Static | TypeScript, lint, format, forbidden dependencies |
| Unit | Vitest domain/mapping/selectors |
| Property | fast-check randomized AP/team invariants |
| Component | Testing Library + Vitest |
| Integration | Testcontainers PostgreSQL/Redis |
| Contract | Zod fixtures + scheduled limited live probes |
| E2E | Playwright Chromium/Firefox/WebKit |
| Accessibility | axe-core + manual keyboard |
| Security | audit/secret/SAST + ZAP on isolated staging |
| Performance | browser budgets + k6 |

### 13.1 Domain tests

AP/stats:

- 0..32 accepted; -1/33 rejected.
- Total 66 accepted; 67 rejected; below 66 accepted/incomplete.
- Neutral/up/down nature behavior and HP prohibition.
- Same up/down stat rejected.
- Client final stats ignored/recalculated.
- Calculation versions reproduce historical fixtures.
- Golden cases cover 0/32 AP, HP, neutral, up/down, and rounding boundaries.

Team legality:

- 0..6 accepted; 7 rejected.
- Duplicate family key rejected, including base + Mega and sibling Mega X/Y branches; Mega forms from different families are accepted.
- Duplicate non-null item rejected; multiple null items accepted.
- Every Mega form is locked to its dedicated stone; selecting a stone on a base form switches every effective form field.
- 0..4 unique legal moves accepted; fifth/duplicate rejected.
- Unlearnable move, wrong ability, unavailable entity rejected.
- Ruleset switch preserves invalid data with structured errors.
- Property tests never mark a violated invariant legal.

Priority:

- Positive `>0`, zero `=0`, negative `<0`.
- Combined class and numeric ranges.
- Signed formatting.
- Numeric sorting across negative/zero/positive.

### 13.2 Component tests

Tooltips: pointer delay/open/close, keyboard/Escape, touch, edge collision, z-index/clipping, effective override content, locale fallback, accessible relationship, and no hover N+1. Visual snapshots cover light/dark, desktop/mobile, long English/Chinese, and viewport edges.

Filters: name-only search, type OR/AND, regular/Mega, searchable ability, multiple known-move AND, six minimum stats, each move filter and combinations, URL restore where supported, clear all, empty state, API/result count, pagination through the real final page, dynamic totals, and stale-response race. Repeat the Move DB priority/type/category/target/property combination fixtures inside Pokémon-detail learnsets, including mobile expand/collapse and filtered/total counts.

Battle usage: mapped move/item/ability rows expose their canonical tooltip content; move rows show the correct type badge; mapped held items show the same local thumbnail in the trigger and tooltip; pointer, keyboard, and touch activation work; unmapped upstream rows remain readable with a neutral fallback and never crash the panel.

Reverse lookup: move/ability eligible-form counts, numeric sorting, complete accessible dialog contents, form identity, current-Regulation exclusion, Pokémon DB-equivalent filter combinations, stat/name/type/ability sort keys in both directions, synchronized table headers/select controls, move-type-first default ordering, filtered/total counts, clear/empty states, desktop table density, and mobile filter collapse/horizontal table scrolling/sticky Pokémon column.

Team tray: add/edit/remove, independent Singles/Doubles groups, format-aware usage defaults, incomplete marker, six-member cap/replacement, duplicate-family/item errors, final stats with per-stat AP and nature direction, all displayed fields and matchups, six full cards reachable through internal scrolling, desktop collapse, mobile focus behavior, refresh/navigation persistence, IndexedDB migration/corrupt quarantine.

Scrapbooks: versioned IndexedDB migration/corrupt-record quarantine, multiple books, per-book multi-tag membership, Untagged fallback, duplicate-add merging, tag/Pokémon ordering, collapse/expand-all, empty quick finder without criteria, all four add entry points, current-format final-stat fallback, defensive matchups, own-type-first learnable-move ordering, six independent battle-category toggles, keyboard controls, and 390/768/1440 responsive layout.

Builder selectors: Mega-to-regular and regular-to-Mega transitions, dedicated-stone-first item grouping, item effect groups including Other, localized name/effect search, Detailed/Compact preference persistence, visible learnable-move Power/Accuracy/PP, and document-level Escape dismissal. Locale tests cover browser-language inference, explicit-choice persistence, and localized battle-usage nature/AP/teammate values.

Type chart: first-class application tab, all 18×18 cells visible together without internal scrolling at 390/768/1440, dual-type multiplication, high-contrast full or abbreviated type codes with accessible names, standalone page, and no floating control.

### 13.3 API/integration tests

Every endpoint: valid/empty/unknown/invalid, pagination bounds, stable sort, locale fallback, ruleset isolation, ETag/cache headers, rate limit, oversized/Unicode/malicious input, SQL/XSS payload as data, stale metadata, and transaction rollback. Use real PostgreSQL and Redis containers—never SQLite as a PostgreSQL substitute.

### 13.4 Fixtures and live contracts

PR CI must not depend on third-party uptime. Commit minimized attribution-preserving fixtures for normal/Mega/multi-form Pokémon, single/dual types, positive/zero/negative priority, missing localization/optionals, unknown fields, mapping gaps, unavailable Regulation entity, null percentage, dated/current snapshots, and asset paths with spaces.

A scheduled respectful live probe checks status, content type, required field types, IDs, dates, integer priority, sprite availability, and latency. Live failure alerts maintainers but does not make PR tests flaky.

The committed offline form-integrity audit runs on every deployment. A live audit runs whenever the upstream sync/mapping code or snapshot changes and on a schedule. It compares every Champions index name and `showdownId` with the committed form's reviewed effective `battleDataKey`, including the Mega Gallade → Gallade exception, reports related metadata groups, and probes both Singles and Doubles for the Ninetales golden pair. Third-party downtime must not make ordinary PR unit tests flaky.

### 13.5 Import/data-quality tests

- Same checksum is idempotent.
- Partial/rejected import never activates.
- Old snapshot stays active on failure.
- Atomic publish exposes one coherent version.
- Unknown optionals are safe; required missing fields quarantine/reject.
- Blank percentage stays null.
- Mapping collision/count collapse/invalid asset host reported.
- Every form has non-empty `id`, `speciesKey`, `battleDataKey`, and `savedName`; directly indexed non-Mega forms equal their live `showdownId`, while every Mega uses its explicit regular form's source and `gallademega` is rejected.
- Regional/gender/breed/appliance mappings remain form-specific; Ninetales and Alolan Ninetales retain distinct types, abilities, learnsets, sources, and format defaults.
- Every current-Regulation move resolves to pinned Showdown mechanics and a non-empty English description; no legal move silently falls back to PokeAPI mechanics.
- Apple Acid is a permanent Champions move golden fixture: Power 90, Accuracy 100, PP 12, and a 100% one-stage Special Defense reduction description.
- Champions-description overrides cannot reuse potentially contradictory main-series localized effect prose; they use a provenance-recorded translation of the effective Champions description. A Chinese build cannot use an English fallback.
- All current-Regulation Pokémon forms have official Traditional Chinese species names and reviewed form labels; all move/ability/item Chinese names and descriptions are non-empty and are not equal to their English counterparts.
- Every localized description retains the exact effective English source and passes numeric/condition parity, Taiwan Traditional Chinese normalization, no-placeholder, no-unapproved-English, and provenance audits. Blaze and Sitrus Berry remain golden fixtures for threshold, multiplier, fraction, and single-use semantics.
- Healer (50%), Unseen Fist (protection plus 1/4 damage), Fairy Feather (non-empty effect), and Slowbronite (not Galarian Slowbro) are permanent ability/item golden fixtures.
- Every held item in the committed catalog has either one exact local PNG mapping or an explicit unavailable entry; all 75 Mega Stones have local PNGs; file signatures and manifest counts agree.
- Unknown item IDs never become repository or runtime URLs, and a broken or unavailable thumbnail renders the neutral fallback without hiding the localized item name.
- Ambiguous shared metadata mapping fails instead of overwriting a whole family.
- Cache invalidates after commit only.
- Handle timeout, malformed JSON/CSV, wrong type, oversized response, and 5xx.

### 13.6 Dormant speed-domain/API tests

The current release has no Speed Compare UI. Keep the dormant domain and `/api/v1/speed/compare` contract covered by named golden fixtures for missing/invalid input, unknown Pokémon, identical-build ties, normal ordering, verified Trick Room ordering, supported stat-stage/multiplier application, stable response fields and calculation version, and `no-store` responses. Do not claim or test a user-facing comparison journey until a future approved milestone restores the UI.

### 13.7 Critical E2E journeys

1. Filter Pokémon and open detail.
2. Inspect move/ability/item tooltips by mouse and keyboard.
3. Configure AP/nature/four moves/ability/item and add to tray.
4. Navigate and refresh; team persists.
5. Build six members; seventh opens replacement.
6. Duplicate Pokémon/item shows actionable error.
7. Reject base + Mega and sibling Mega branches; allow Mega forms from different families.
8. Switch Singles/Doubles and verify independent teams, form-specific usage data, and defaults.
9. Use positive/zero/negative priority filters and restore URL.
10. Open move/ability reverse lookup and sort by eligible-form count.
11. Transform a base form by selecting its Mega Stone and verify every effective field.
12. Scroll the six-card team tray to its final member.
13. Open the Type Chart tab at 390, 768, and 1440 CSS pixels; verify all 18 attack rows and 18 defense columns are visible without an internal scrollbar and every compact type code exposes its full name.
14. Switch English/Chinese without losing state.
15. Use mobile bottom sheet at 360/390 px.
16. Admin previews/publishes/audits/reverts override.
17. Stale upstream simulation shows last valid snapshot.
18. Add Pokémon from the database row, detail, move reverse lookup, and ability reverse lookup; create/select a scrapbook and multiple tags; reorder and expand comparisons; refresh and verify persistence.

Run Chromium, Firefox, WebKit. Required relevant widths: 360, 390, 768, 1024, 1440 px.

### 13.8 Accessibility/security/privacy/load acceptance

- No critical/serious axe issue on critical pages.
- Critical journeys keyboard-only; correct focus trap/restoration; 200% zoom and reduced motion.
- Test XSS, SQLi, CSRF, IDOR, session fixation, OAuth state/PKCE, rate limiting, oversized payload, SSRF restriction, CSP, secrets, admin RBAC/audit, unpublished data, error leakage.
- ZAP active scan only on isolated staging.
- Rejecting non-essential cookies prevents trackers; consent withdraw works; policies reachable; attribution/notices visible.
- Load test catalogs, combined move filters, details, format switches, validation, and reads during import against section 12 budgets. The dormant speed API receives contract tests, not a current-release UI/load journey.

Coverage requirements:

```text
overall statements and branches >= 80%
domain calculations and legality >= 95%
critical AP/stats/team invariants approximately 100%
```

## 14. CI/CD gates

Every PR runs: frozen install, format, lint/architecture rules, typecheck, unit/property/component tests, PostgreSQL/Redis integration, production build, Playwright critical journeys, accessibility checks, dependency/license/secret scans, and migration verification from the previous release.

For the shipped repository, `pnpm verify:deploy` is the minimum local deployment gate and runs lint, TypeScript checking, the offline form-integrity audit, all Vitest suites, the production build, and built-output SSR/API tests. It does not replace the remaining commercial-hardening gates above. When `scripts/sync-upstream.mjs`, form mappings, or `data/generated/champions-snapshot.json` changes, also run `pnpm data:audit:live`. Follow `DEPLOYMENT_CHECKLIST.md`; production must use the exact commit and artifact that passed these gates.

Promotion:

```text
local gates → exact committed Dev deployment → smoke/E2E/product-owner UAT → PR gates + independent sub-agent review → merge
→ merge → immutable approved release artifact → separate explicit production promotion
```

UAT and production must use exact recorded artifacts/commits. UAT uses the separate `.openai/hosting.dev.json` project and isolated D1 database; production uses `.openai/hosting.json`. Never use the production project as a branch preview or share its database with Dev. A UAT-approved candidate proceeds to PR checks and independent review; any material code change after UAT invalidates that approval and requires a new Dev deployment and UAT pass.

## 15. Observability and operations

Metrics: request rates/errors/latency/cache, DB pool/slow queries, Redis hit/queue depth, import success/duration/count/quarantine, snapshot age/version, asset failures, Web Vitals by locale/device/page.

Use structured JSON logs and correlation IDs; never log tokens/cookies/auth headers or unnecessary user memo data. Trace upstream fetch, normalization, transaction, cache invalidation, and public requests.

Create runbooks for upstream outage/contract change, rejected/stale snapshot, quarantine surge, DB/Redis degradation, 5xx/latency, app rollback, backup restore, and secret rotation. Encrypt backups and test restoration periodically.

## 16. Implementation milestones

1. **Foundation:** monorepo, CI, environments, Docker dependencies, contracts/domain boundaries, migrations, error envelope, observability, health endpoints, i18n shell/design tokens.
2. **Data platform:** fixtures, normalized schema/mappings, staging validation/atomic import, quarantine/admin override basics, attribution metadata.
3. **Catalog UX:** catalog APIs/pages, search/filter/sort, Pokémon detail/battle data, tooltips, priority filter.
4. **Team builder:** versioned DTO/IndexedDB, AP/nature editor, legality validator, floating tray; final stats only after golden validation.
5. **Dormant speed foundation:** retain verified calculation and API ordering fixtures without exposing a UI; any future Speed Compare UI, trace, or expanded modifier strategy requires a separately approved milestone and UAT.
6. **Hardening/UAT:** accessibility, security, consent/legal, browser matrix, performance, restore/failure drills, reports/checklist.

Do not implement future AI recommendations or damage calculation in these milestones.

## 17. Definition of Done before UAT

All must be true:

- Typecheck, lint, build, unit, property, component, integration, and E2E pass.
- Chromium, Firefox, and WebKit critical journeys pass.
- Domain legality/AP coverage gates pass.
- Final stats/speed have trustworthy golden fixtures; otherwise outputs remain disabled/experimental and are not claimed complete.
- English/Chinese critical flows pass.
- No known P0/P1 defect.
- No critical/high exploitable security finding.
- No critical/serious accessibility issue in critical flows.
- Import rejection, last-good fallback, atomic publish, migration, rollback, and restore exercises pass.
- Performance budgets pass with production-like data.
- Attribution, unofficial notice, privacy, terms, and consent are present.
- Reports/known limitations exist and UAT deployment identifies the exact tested release.

Required handoff artifacts:

```text
release identifier
test summary and coverage
Playwright report/artifacts
accessibility report
security scan summary
performance/load report
upstream contract/import report
migration/rollback notes
known limitations
product-owner UAT checklist
```

UAT checklist must cover language/navigation, catalog accuracy, formats/Regulation, priority filter, tooltip interactions, scrapbook creation/tagging/comparison/reordering/persistence, team fields/rules, six/seventh-member flows, final stats/speed against known game examples, responsive/theme UX, attribution/privacy/consent, and admin publish/revert.

## 18. Final guardrails

- Do not guess or ship damage calculation in v1.
- Do not guess final-stat or complex speed rules; require golden fixtures.
- Do not let PokeAPI overwrite Champions active-Regulation data.
- Do not use `speciesKey` as a form-specific battle API key or let shared metadata overwrite sibling forms.
- Do not allow a base form and its Mega form, or sibling Mega branches, in one team.
- Do not describe deterministic usage defaults as AI or strategic recommendations.
- Do not call third-party APIs on hover or per user request.
- Do not expose a raw-data mirror or bulk-data service.
- Do not silently discard invalid teams after rule changes.
- Do not trust client-calculated stats or legality.
- Do not copy GameWith content/design/assets.
- Do not hand off to UAT with failing tests or undocumented limitations.

This specification is sufficient to continue implementation. The core final-stat formula is validated as `champions-v1`; any additional speed modifier/order rule still requires a reliable golden example before release.
