"use client";

import { useMemo, useState } from "react";
import { abilities, abilityById, items, moveById, moves, pokemon, pokemonByAbilityId, pokemonByMoveId } from "../lib/catalog";
import { formatPriority, priorityMatches, totalBaseStats } from "../lib/domain";
import { abilityCategories, compareValues, itemEffectCategories, type SortDirection } from "../lib/filtering";
import { ALL_TYPES } from "../lib/type-chart";
import { localizedTerm, localizedTerms } from "../lib/localization";
import { useDialogEscape } from "../lib/use-dialog-escape";
import type { Move, Pokemon, Stats } from "../lib/types";
import { InfoTooltip } from "./InfoTooltip";
import { ItemTooltip } from "./ItemDisplay";
import { PokemonDetailDialog } from "./PokemonDetailDialog";
import { ResetFiltersButton } from "./ResetFiltersButton";
import { TypeBadge } from "./TypeBadge";

type Locale = "en" | "zh-Hant";
type PriorityClass = "positive" | "zero" | "negative";
type SortState<Key extends string> = { key: Key; direction: SortDirection };

const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const statLabels: Record<(typeof statKeys)[number], string> = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const abilityFilterOptions = ["Weather", "Terrain", "Offense", "Defense", "Status", "Stat Changes", "Speed", "Type", "Contact", "Switch / Hazard", "Item / Berry", "Ability / Move", "Other"];
const itemEffectOptions = ["HP Recovery", "Status Cure", "PP Recovery", "Damage Halving", "Other"];

const localName = (entry: { name: string; nameZh: string }, locale: Locale) => locale === "zh-Hant" ? entry.nameZh : entry.name;
const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

function nextSort<Key extends string>(sort: SortState<Key>, key: Key, initialDirection: SortDirection): SortState<Key> {
  return sort.key === key ? { key, direction: sort.direction === "asc" ? "desc" : "asc" } : { key, direction: initialDirection };
}

function SortHeader<Key extends string>({ label, column, sort, onChange, initialDirection = "asc" }: { label: string; column: Key; sort: SortState<Key>; onChange: (sort: SortState<Key>) => void; initialDirection?: SortDirection }) {
  const active = sort.key === column;
  return <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => onChange(nextSort(sort, column, initialDirection))}>{label}<span aria-hidden="true">{active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>;
}

function FilterGroup({ label, options, selected, onToggle, locale }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void; locale: Locale }) {
  return <div className="filter-group"><b>{localizedTerm(label, locale)}</b><div>{options.map((option) => <button type="button" className="filter-chip" key={option} onClick={() => onToggle(option)} aria-pressed={selected.includes(option)}>{localizedTerm(option, locale)}</button>)}</div></div>;
}

function MoveTooltip({ move, locale, onActivate }: { move: Move; locale: Locale; onActivate?: () => void }) {
  return <InfoTooltip label={localName(move, locale)} onActivate={onActivate}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} locale={locale} /><span>{localizedTerm(move.category, locale)}</span><span>{localizedTerm("Priority", locale)} {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>{localizedTerm("Power", locale)} {move.power ?? "—"}</span><span>{localizedTerm("Acc.", locale)} {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>;
}

function AbilityTooltip({ id, locale, onActivate }: { id: string; locale: Locale; onActivate?: () => void }) {
  const ability = abilityById.get(id);
  if (!ability) return <span>—</span>;
  return <InfoTooltip label={localName(ability, locale)} onActivate={onActivate}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip>;
}

type ReverseSelection = { id: string; kind: "move" | "ability"; name: string; description: string; users: Pokemon[]; move?: Move };
type ReverseSortKey = "relevance" | "name" | "type" | keyof Stats | "ability";

function PokemonUsersDialog({ selection, locale, onClose }: { selection: ReverseSelection; locale: Locale; onClose: () => void }) {
  useDialogEscape(onClose);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeMode, setTypeMode] = useState<"or" | "and">("or");
  const [form, setForm] = useState<"all" | "regular" | "mega">("all");
  const [abilityId, setAbilityId] = useState("");
  const [abilityInput, setAbilityInput] = useState("");
  const [knownMoveIds, setKnownMoveIds] = useState<string[]>([]);
  const [moveInput, setMoveInput] = useState("");
  const [statMinimums, setStatMinimums] = useState<Stats>({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
  const [sortKey, setSortKey] = useState<ReverseSortKey>("relevance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const copy = locale === "zh-Hant" ? { title: "可使用的寶可夢", search: "搜尋寶可夢名稱…", forms: "個合法型態", empty: "沒有符合目前篩選條件的寶可夢。", close: "關閉", filters: "進階篩選", sort: "排序方式", direction: "排序方向", ascending: "由小到大", descending: "由大到小", matching: "同招式屬性優先" } : { title: "Pokémon that can use this", search: "Search Pokémon name…", forms: "legal forms", empty: "No Pokémon match the current filters.", close: "Close", filters: "Advanced filters", sort: "Sort by", direction: "Direction", ascending: "Ascending", descending: "Descending", matching: "Same move type first" };
  const matchAbility = (value: string) => abilities.find((entry) => [entry.name, entry.nameZh].some((name) => name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
  const matchMove = (value: string) => moves.find((entry) => [entry.name, entry.nameZh].some((name) => name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
  const users = selection.users.filter((entry) => `${entry.name} ${entry.nameZh}`.toLowerCase().includes(query.toLowerCase())
    && (!selectedTypes.length || (typeMode === "or" ? selectedTypes.some((type) => entry.types.includes(type as Pokemon["types"][number])) : selectedTypes.every((type) => entry.types.includes(type as Pokemon["types"][number]))))
    && (form === "all" || (form === "mega" ? Boolean(entry.isMega) : !entry.isMega))
    && (!abilityId || entry.abilityIds.includes(abilityId))
    && knownMoveIds.every((id) => entry.moveIds.includes(id))
    && statKeys.every((key) => entry.baseStats[key] >= statMinimums[key]));
  const sortValue = (entry: Pokemon) => {
    if (sortKey === "name") return localName(entry, locale);
    if (sortKey === "type") return entry.types.join(" ");
    if (sortKey === "ability") return entry.abilityIds.map((id) => abilityById.get(id)?.name ?? id).join(" ");
    if (sortKey === "relevance") return "";
    return entry.baseStats[sortKey];
  };
  const sortedUsers = [...users].sort((a, b) => {
    if (sortKey === "relevance") {
      const preferredType = selection.move?.type;
      const preferred = preferredType ? Number(!a.types.includes(preferredType)) - Number(!b.types.includes(preferredType)) : 0;
      return preferred || a.types.join(" ").localeCompare(b.types.join(" ")) || localName(a, locale).localeCompare(localName(b, locale));
    }
    return compareValues(sortValue(a), sortValue(b), sortDirection) || localName(a, locale).localeCompare(localName(b, locale));
  });
  const updateMinimum = (key: keyof Stats, value: number) => setStatMinimums((current) => ({ ...current, [key]: Math.max(0, Math.min(255, value || 0)) }));
  const clearFilters = () => { setQuery(""); setSelectedTypes([]); setTypeMode("or"); setForm("all"); setAbilityId(""); setAbilityInput(""); setKnownMoveIds([]); setMoveInput(""); setStatMinimums({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }); };
  const changeSortKey = (value: ReverseSortKey) => { setSortKey(value); setSortDirection(value === "name" || value === "type" || value === "ability" || value === "relevance" ? "asc" : "desc"); };
  const sortOptions: Array<[ReverseSortKey, string]> = [["relevance", selection.move ? copy.matching : "Type → Pokémon name"], ["name", "Pokémon name"], ["type", "Type"], ["hp", "HP"], ["attack", "Atk"], ["defense", "Def"], ["specialAttack", "SpA"], ["specialDefense", "SpD"], ["speed", "Spe"], ["ability", "Ability"]];
  const tableSort: SortState<ReverseSortKey> = { key: sortKey, direction: sortDirection };
  const changeTableSort = (next: SortState<ReverseSortKey>) => { setSortKey(next.key); setSortDirection(next.direction); };
  return <div className="reverse-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="reverse-dialog" role="dialog" aria-modal="true" aria-labelledby="reverse-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><button className="close-button" onClick={onClose} aria-label={copy.close}>×</button><div className="reverse-head"><div><p className="eyebrow">REVERSE LOOKUP</p><h2 id="reverse-title">{selection.name}</h2>{selection.move && <div className="badge-row"><TypeBadge type={selection.move.type} locale={locale} /><span className="resource-kind">{localizedTerm(selection.move.category, locale)}</span></div>}<p>{selection.description}</p></div><strong>{selection.users.length}<small>{copy.forms}</small></strong></div><div className="reverse-toolbar"><label><span>{locale === "zh-Hant" ? "名稱" : "Name"}</span><input autoFocus aria-label="Search Pokémon in reverse lookup" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label><label><span>{copy.sort}</span><select aria-label="Sort reverse lookup Pokémon" value={sortKey} onChange={(event) => changeSortKey(event.target.value as ReverseSortKey)}>{sortOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>{copy.direction}</span><select aria-label="Reverse lookup sort direction" value={sortDirection} disabled={sortKey === "relevance"} onChange={(event) => setSortDirection(event.target.value as SortDirection)}><option value="asc">{copy.ascending}</option><option value="desc">{copy.descending}</option></select></label></div><button type="button" className="reverse-filter-toggle filter-chip" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>{copy.filters}</button><div className={`advanced-filters reverse-filters${filtersOpen ? " open" : ""}`}><FilterGroup locale={locale} label="Type" options={ALL_TYPES} selected={selectedTypes} onToggle={(entry) => setSelectedTypes((current) => toggleValue(current, entry))} /><div className="filter-group filter-logic-row"><b>{locale === "zh-Hant" ? "屬性邏輯" : "Type logic"}</b><div className="segmented" role="group" aria-label="Reverse lookup type filter logic"><button className={typeMode === "or" ? "active" : ""} aria-pressed={typeMode === "or"} onClick={() => setTypeMode("or")}>OR</button><button className={typeMode === "and" ? "active" : ""} aria-pressed={typeMode === "and"} onClick={() => setTypeMode("and")}>AND</button></div></div><div className="filter-group"><b>{locale === "zh-Hant" ? "型態" : "Form"}</b><div>{(["all", "regular", "mega"] as const).map((entry) => <button key={entry} className="filter-chip" aria-pressed={form === entry} onClick={() => setForm(entry)}>{entry === "all" ? (locale === "zh-Hant" ? "全部" : "All") : entry === "regular" ? (locale === "zh-Hant" ? "一般" : "Regular") : "Mega"}</button>)}</div></div><div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "特性" : "Ability"}</b><div><input list="reverse-ability-options" aria-label="Search reverse lookup ability filter" value={abilityInput} onChange={(event) => { const value = event.target.value; const matched = matchAbility(value); setAbilityInput(value); setAbilityId(matched?.id ?? ""); }} placeholder={locale === "zh-Hant" ? "輸入特性名稱…" : "Type an ability…"} /><datalist id="reverse-ability-options">{abilities.map((entry) => <option key={entry.id} value={localName(entry, locale)} />)}</datalist>{abilityId && <button className="selected-filter" onClick={() => { setAbilityId(""); setAbilityInput(""); }}>{localName(abilityById.get(abilityId)!, locale)} ×</button>}</div></div><div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "可學招式" : "Known moves"}</b><div><input list="reverse-move-options" aria-label="Search reverse lookup known move filter" value={moveInput} onChange={(event) => { const value = event.target.value; const matched = matchMove(value); if (matched) { setKnownMoveIds((current) => current.includes(matched.id) ? current : [...current, matched.id]); setMoveInput(""); } else setMoveInput(value); }} placeholder={locale === "zh-Hant" ? "輸入招式名稱…" : "Type a move…"} /><datalist id="reverse-move-options">{moves.map((entry) => <option key={entry.id} value={localName(entry, locale)} />)}</datalist>{knownMoveIds.map((id) => <button key={id} className="selected-filter" onClick={() => setKnownMoveIds((current) => current.filter((entry) => entry !== id))}>{localName(moveById.get(id)!, locale)} ×</button>)}</div></div><div className="filter-group stat-minimum-filter"><b>{locale === "zh-Hant" ? "最低能力值" : "Minimum stats"}</b><div>{statKeys.map((key) => <label key={key}>{statLabels[key]}<input aria-label={`Reverse lookup minimum ${statLabels[key]}`} type="number" min="0" max="255" value={statMinimums[key] || ""} placeholder="0" onChange={(event) => updateMinimum(key, Number(event.target.value))} /></label>)}</div></div><div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /><span>{locale === "zh-Hant" ? "多個可學招式使用 AND。" : "Multiple known moves use AND matching."}</span></div></div><h3>{copy.title} <span>{sortedUsers.length} / {selection.users.length}</span></h3>{sortedUsers.length ? <div className="reverse-table-scroll" tabIndex={0} aria-label={copy.title}><table className="reverse-results-table"><thead><tr><SortHeader label="Pokémon" column="name" sort={tableSort} onChange={changeTableSort} /><SortHeader label={localizedTerm("Type", locale)} column="type" sort={tableSort} onChange={changeTableSort} />{statKeys.map((key) => <SortHeader key={key} label={statLabels[key]} column={key} sort={tableSort} onChange={changeTableSort} />)}<SortHeader label={localizedTerm("Ability", locale)} column="ability" sort={tableSort} onChange={changeTableSort} /></tr></thead><tbody>{sortedUsers.map((entry) => <tr key={entry.id} className={selection.move && entry.types.includes(selection.move.type) ? "preferred-type" : ""}><td><div className="reverse-pokemon-cell"><img src={entry.imageUrl} alt="" width="48" height="48" loading="lazy" /><span><strong>{localName(entry, locale)}</strong>{entry.isMega && <small>Mega</small>}{selection.move && entry.types.includes(selection.move.type) && <em>{selection.move.type} match</em>}</span></div></td><td><div className="badge-row compact">{entry.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></td>{statKeys.map((key) => <td key={key} data-stat={key}>{entry.baseStats[key]}</td>)}<td><div className="ability-list">{entry.abilityIds.map((id) => <AbilityTooltip id={id} locale={locale} key={id} />)}</div></td></tr>)}</tbody></table></div> : <p className="reverse-empty">{copy.empty}</p>}</section></div>;
}

type PokemonSortKey = "name" | "type" | keyof Stats | "total" | "ability";

export function PokemonTableV2({ locale, format, onSelect, active = true }: { locale: Locale; format: "singles" | "doubles"; onSelect: (entry: Pokemon) => void; active?: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<PokemonSortKey>>({ key: "name", direction: "asc" });
  const [details, setDetails] = useState<Pokemon | null>(null);
  const [page, setPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeMode, setTypeMode] = useState<"or" | "and">("or");
  const [form, setForm] = useState<"all" | "regular" | "mega">("all");
  const [abilityId, setAbilityId] = useState("");
  const [abilityInput, setAbilityInput] = useState("");
  const [knownMoveIds, setKnownMoveIds] = useState<string[]>([]);
  const [moveInput, setMoveInput] = useState("");
  const [statMinimums, setStatMinimums] = useState<Stats>({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
  const [totalMinimum, setTotalMinimum] = useState(0);
  const pageSize = 100;
  const matches = pokemon.filter((entry) => `${entry.name} ${entry.nameZh}`.toLowerCase().includes(query.toLowerCase())
    && (!selectedTypes.length || (typeMode === "or" ? selectedTypes.some((type) => entry.types.includes(type as Pokemon["types"][number])) : selectedTypes.every((type) => entry.types.includes(type as Pokemon["types"][number]))))
    && (form === "all" || (form === "mega" ? Boolean(entry.isMega) : !entry.isMega))
    && (!abilityId || entry.abilityIds.includes(abilityId))
    && knownMoveIds.every((id) => entry.moveIds.includes(id))
    && statKeys.every((key) => entry.baseStats[key] >= statMinimums[key])
    && totalBaseStats(entry.baseStats) >= totalMinimum);
  const value = (entry: Pokemon) => {
    if (sort.key === "name") return localName(entry, locale);
    if (sort.key === "type") return entry.types.join(" ");
    if (sort.key === "ability") return entry.abilityIds.map((id) => abilityById.get(id)?.name ?? id).join(" ");
    if (sort.key === "total") return totalBaseStats(entry.baseStats);
    return entry.baseStats[sort.key];
  };
  const sorted = [...matches].sort((a, b) => compareValues(value(a), value(b), sort.direction) || a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  const rangeStart = sorted.length ? start + 1 : 0;
  const rangeEnd = Math.min(start + rows.length, sorted.length);
  const changeSort = (next: SortState<PokemonSortKey>) => { setSort(next); setPage(1); };
  const updateMinimum = (key: keyof Stats, value: number) => { setStatMinimums((current) => ({ ...current, [key]: Math.max(0, Math.min(255, value || 0)) })); setPage(1); };
  const clearFilters = () => { setQuery(""); setSelectedTypes([]); setTypeMode("or"); setForm("all"); setAbilityId(""); setAbilityInput(""); setKnownMoveIds([]); setMoveInput(""); setStatMinimums({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }); setTotalMinimum(0); setPage(1); };
  const matchAbility = (value: string) => abilities.find((entry) => [entry.name, entry.nameZh].some((name) => name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
  const matchMove = (value: string) => moves.find((entry) => [entry.name, entry.nameZh].some((name) => name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
  const copy = locale === "zh-Hant" ? { title: "寶可夢資料庫", legal: "個合法型態", showing: "顯示", of: "共", page: "頁", previous: "上一頁", next: "下一頁", hint: "點擊名稱查看可學招式、特性及當季單打／雙打資料" } : { title: "Pokémon DB", legal: "legal forms", showing: "showing", of: "of", page: "Page", previous: "Previous", next: "Next", hint: "Select a name for moves, abilities, and current Singles / Doubles data" };
  if (!active) return null;
  return <><section className="panel catalog-panel"><div className="panel-head"><div><p className="eyebrow">CURRENT REGULATION</p><h1>{copy.title}</h1><p>{matches.length} {copy.legal} · {copy.showing} {rangeStart}–{rangeEnd} {copy.of} {sorted.length} · {copy.hint}</p></div></div>
    <div className="advanced-filters pokemon-advanced-filters">
      <div className="filter-group pokemon-name-filter"><b>{locale === "zh-Hant" ? "名稱" : "Name"}</b><label><span className="sr-only">Search Pokémon by name</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={locale === "zh-Hant" ? "搜尋寶可夢名稱…" : "Search Pokémon name…"} /></label></div>
      <FilterGroup locale={locale} label={locale === "zh-Hant" ? "屬性" : "Type"} options={ALL_TYPES} selected={selectedTypes} onToggle={(entry) => { setSelectedTypes((current) => toggleValue(current, entry)); setPage(1); }} />
      <div className="filter-group filter-logic-row"><b>{locale === "zh-Hant" ? "屬性邏輯" : "Type logic"}</b><div className="segmented" role="group" aria-label="Type filter logic"><button className={typeMode === "or" ? "active" : ""} aria-pressed={typeMode === "or"} onClick={() => { setTypeMode("or"); setPage(1); }}>OR</button><button className={typeMode === "and" ? "active" : ""} aria-pressed={typeMode === "and"} onClick={() => { setTypeMode("and"); setPage(1); }}>AND</button><span>{locale === "zh-Hant" ? typeMode === "or" ? "符合任一所選屬性" : "同時具有全部所選屬性" : typeMode === "or" ? "Match any selected type" : "Match every selected type"}</span></div></div>
      <div className="filter-group"><b>{locale === "zh-Hant" ? "型態" : "Form"}</b><div>{(["all", "regular", "mega"] as const).map((entry) => <button key={entry} className="filter-chip" aria-pressed={form === entry} onClick={() => { setForm(entry); setPage(1); }}>{locale === "zh-Hant" ? entry === "all" ? "全部" : entry === "regular" ? "一般" : "Mega" : entry === "all" ? "All" : entry === "regular" ? "Regular" : "Mega"}</button>)}</div></div>
      <div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "特性" : "Ability"}</b><div><input list="pokemon-ability-options" aria-label="Search ability filter" value={abilityInput} onChange={(event) => { const value = event.target.value; const matched = matchAbility(value); setAbilityInput(value); setAbilityId(matched?.id ?? ""); setPage(1); }} placeholder={locale === "zh-Hant" ? "輸入特性名稱…" : "Type an ability…"} /><datalist id="pokemon-ability-options">{abilities.map((entry) => <option key={entry.id} value={localName(entry, locale)} />)}</datalist>{abilityId && <button className="selected-filter" onClick={() => { setAbilityId(""); setAbilityInput(""); setPage(1); }}>{localName(abilityById.get(abilityId)!, locale)} ×</button>}</div></div>
      <div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "可學招式" : "Known moves"}</b><div><input list="pokemon-move-options" aria-label="Search known move filter" value={moveInput} onChange={(event) => { const value = event.target.value; const matched = matchMove(value); if (matched) { setKnownMoveIds((current) => current.includes(matched.id) ? current : [...current, matched.id]); setMoveInput(""); } else setMoveInput(value); setPage(1); }} placeholder={locale === "zh-Hant" ? "輸入招式名稱…" : "Type a move…"} /><datalist id="pokemon-move-options">{moves.map((entry) => <option key={entry.id} value={localName(entry, locale)} />)}</datalist>{knownMoveIds.map((id) => <button key={id} className="selected-filter" onClick={() => { setKnownMoveIds((current) => current.filter((entry) => entry !== id)); setPage(1); }}>{localName(moveById.get(id)!, locale)} ×</button>)}</div></div>
      <div className="filter-group stat-minimum-filter"><b>{locale === "zh-Hant" ? "最低種族值" : "Minimum stats"}</b><div>{statKeys.map((key) => <label key={key}>{statLabels[key]}<input aria-label={`Minimum ${statLabels[key]}`} type="number" min="0" max="255" value={statMinimums[key] || ""} placeholder="0" onChange={(event) => updateMinimum(key, Number(event.target.value))} /></label>)}<label>TOT<input aria-label="Minimum TOT" type="number" min="0" max="1530" value={totalMinimum || ""} placeholder="0" onChange={(event) => { setTotalMinimum(Math.max(0, Math.min(1530, Number(event.target.value) || 0))); setPage(1); }} /></label></div></div>
      <div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /><span>{locale === "zh-Hant" ? "多個招式條件會同時套用（AND）。" : "Multiple known moves use AND matching."}</span></div>
    </div>
    <div className="table-scroll"><table><thead><tr><SortHeader label="Pokémon" column="name" sort={sort} onChange={changeSort} /><SortHeader label={localizedTerm("Type", locale)} column="type" sort={sort} onChange={changeSort} />{statKeys.map((key) => <SortHeader key={key} label={statLabels[key]} column={key} sort={sort} onChange={changeSort} initialDirection="desc" />)}<SortHeader label="TOT" column="total" sort={sort} onChange={changeSort} initialDirection="desc" /><SortHeader label={localizedTerm("Ability", locale)} column="ability" sort={sort} onChange={changeSort} /><th><span className="sr-only">Action</span></th></tr></thead><tbody>{rows.map((entry) => <tr key={entry.id}><td><button className="pokemon-name pokemon-detail-trigger" onClick={() => setDetails(entry)}><img src={entry.imageUrl} alt="" width="54" height="54" loading="lazy" /><span><strong>{localName(entry, locale)}</strong>{entry.isMega && <small>Mega</small>}</span></button></td><td><div className="badge-row">{entry.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></td>{statKeys.map((key) => <td key={key} className={key === "speed" ? "stat-accent" : "stat-cell"}>{entry.baseStats[key]}</td>)}<td className="stat-total" data-stat="total">{totalBaseStats(entry.baseStats)}</td><td><div className="ability-list">{entry.abilityIds.length ? entry.abilityIds.map((id) => <AbilityTooltip id={id} locale={locale} key={id} />) : "—"}</div></td><td><button className="add-button" onClick={() => onSelect(entry)} aria-label={`Configure ${entry.name}`}>+</button></td></tr>)}</tbody></table></div><nav className="pagination" aria-label="Pokémon pages"><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous page">‹ {copy.previous}</button><span>{copy.page} <b>{safePage}</b> / {pageCount}</span><button disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="Next page">{copy.next} ›</button></nav></section>{details && <PokemonDetailDialog key={details.id} pokemon={details} locale={locale} initialFormat={format} onClose={() => setDetails(null)} onBuild={() => { const entry = details; setDetails(null); onSelect(entry); }} />}</>;
}

type MoveSortKey = "name" | "type" | "category" | "power" | "accuracy" | "pp" | "priority" | "target" | "flags" | "users";

export function MoveDatabaseV2({ locale, active = true }: { locale: Locale; active?: boolean }) {
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<PriorityClass[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [properties, setProperties] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<MoveSortKey>>({ key: "name", direction: "asc" });
  const [selected, setSelected] = useState<ReverseSelection | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const typeOptions = useMemo(() => ALL_TYPES.filter((type) => moves.some((move) => move.type === type)), []);
  const targetOptions = useMemo(() => [...new Set(moves.map((move) => move.target))].sort(), []);
  const propertyOptions = useMemo(() => [...new Set(moves.flatMap((move) => move.flags))].sort(), []);
  const value = (move: Move) => sort.key === "flags" ? move.flags.join(" ") : sort.key === "users" ? (pokemonByMoveId.get(move.id)?.length ?? 0) : move[sort.key];
  const allMatches = moves.filter((move) => {
    const searchMatch = `${move.name} ${move.nameZh}`.toLowerCase().includes(query.toLowerCase());
    return searchMatch && priorityMatches(move, priorities) && (!types.length || types.includes(move.type)) && (!categories.length || categories.includes(move.category)) && (!targets.length || targets.includes(move.target)) && (!properties.length || properties.some((flag) => move.flags.includes(flag)));
  });
  const sorted = [...allMatches].sort((a, b) => {
    const aValue = value(a);
    const bValue = value(b);
    if (aValue == null || bValue == null) {
      if (aValue == null && bValue == null) return a.name.localeCompare(b.name);
      return aValue == null ? 1 : -1;
    }
    return compareValues(aValue, bValue, sort.direction) || a.name.localeCompare(b.name);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  const rangeStart = sorted.length ? start + 1 : 0;
  const rangeEnd = Math.min(start + rows.length, sorted.length);
  const changeSort = (next: SortState<MoveSortKey>) => { setSort(next); setPage(1); };
  const openUsers = (move: Move) => setSelected({ id: move.id, kind: "move", name: localName(move, locale), description: locale === "zh-Hant" ? move.descriptionZh : move.description, users: pokemonByMoveId.get(move.id) ?? [], move });
  const userLabel = locale === "zh-Hant" ? "可使用此招式的寶可夢" : "Usable Pokémon";
  const pageCopy = locale === "zh-Hant" ? { showing: "顯示", of: "共", page: "第", pageSuffix: "頁", previous: "上一頁", next: "下一頁" } : { showing: "showing", of: "of", page: "Page", pageSuffix: "", previous: "Previous", next: "Next" };
  const resetPage = () => setPage(1);
  const clearFilters = () => { setQuery(""); setPriorities([]); setTypes([]); setCategories([]); setTargets([]); setProperties([]); resetPage(); };
  if (!active) return null;
  return <>
    <section className="panel">
      <div className="panel-head moves-head">
        <div><p className="eyebrow">MOVE INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "招式資料庫" : "Move DB"}</h1><p>{allMatches.length} / {moves.length} {locale === "zh-Hant" ? "個招式" : "moves"} · {pageCopy.showing} {rangeStart}–{rangeEnd} {pageCopy.of} {sorted.length}</p></div>
        <input aria-label="Search moves" className="move-search" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder={locale === "zh-Hant" ? "搜尋招式…" : "Search moves…"} />
      </div>
      <div className="advanced-filters">
        <FilterGroup locale={locale} label="Priority" options={["+ Positive", "0 Neutral", "− Negative"]} selected={priorities.map((entry) => entry === "positive" ? "+ Positive" : entry === "zero" ? "0 Neutral" : "− Negative")} onToggle={(label) => { const entry = label.startsWith("+") ? "positive" : label.startsWith("0") ? "zero" : "negative"; setPriorities((current) => toggleValue(current, entry) as PriorityClass[]); resetPage(); }} />
        <FilterGroup locale={locale} label="Type" options={typeOptions} selected={types} onToggle={(entry) => { setTypes((current) => toggleValue(current, entry)); resetPage(); }} />
        <FilterGroup locale={locale} label={localizedTerm("Category", locale)} options={["Physical", "Special", "Status"]} selected={categories} onToggle={(entry) => { setCategories((current) => toggleValue(current, entry)); resetPage(); }} />
        <FilterGroup locale={locale} label="Target" options={targetOptions} selected={targets} onToggle={(entry) => { setTargets((current) => toggleValue(current, entry)); resetPage(); }} />
        <FilterGroup locale={locale} label="Properties" options={propertyOptions} selected={properties} onToggle={(entry) => { setProperties((current) => toggleValue(current, entry)); resetPage(); }} />
        <div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /></div>
      </div>
      <div className="table-scroll"><table><thead><tr>{([ ["Move", "name", "asc"], ["Type", "type", "asc"], ["Class", "category", "desc"], ["Power", "power", "desc"], ["Acc.", "accuracy", "desc"], ["PP", "pp", "desc"], ["Priority", "priority", "desc"], ["Target", "target", "asc"], ["Properties", "flags", "asc"], [userLabel, "users", "asc"] ] as Array<[string, MoveSortKey, SortDirection]>).map(([label, key, initialDirection]) => <SortHeader key={key} label={localizedTerm(label, locale)} column={key} sort={sort} onChange={changeSort} initialDirection={initialDirection} />)}</tr></thead><tbody>{rows.map((move) => { const userCount = pokemonByMoveId.get(move.id)?.length ?? 0; return <tr key={move.id}><td><MoveTooltip move={move} locale={locale} onActivate={() => openUsers(move)} /></td><td><TypeBadge type={move.type} locale={locale} /></td><td>{localizedTerm(move.category, locale)}</td><td>{move.power ?? "—"}</td><td>{move.accuracy ?? "—"}</td><td>{move.pp}</td><td><span className={`priority-value priority-${move.priority > 0 ? "positive" : move.priority < 0 ? "negative" : "zero"}`}>{formatPriority(move.priority)}</span></td><td>{localizedTerm(move.target, locale)}</td><td>{move.flags.length ? localizedTerms(move.flags, locale) : "—"}</td><td><button className="reverse-count" onClick={() => openUsers(move)} aria-label={`View ${userCount} Pokémon that can use ${move.name}`}>{userCount}</button></td></tr>; })}</tbody></table></div>
      <nav className="pagination" aria-label="Move pages"><button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous move page">‹ {pageCopy.previous}</button><span>{pageCopy.page} <b>{safePage}</b> / {pageCount} {pageCopy.pageSuffix}</span><button disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="Next move page">{pageCopy.next} ›</button></nav>
    </section>
    {selected && <PokemonUsersDialog key={`${selected.kind}-${selected.id}`} selection={selected} locale={locale} onClose={() => setSelected(null)} />}
  </>;
}

type AbilitySortKey = "name" | "category" | "users";

export function ResourceDatabaseV2({ kind, locale, active = true }: { kind: "abilities" | "items"; locale: Locale; active?: boolean }) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [effects, setEffects] = useState<string[]>([]);
  const [includeMega, setIncludeMega] = useState(true);
  const [abilitySort, setAbilitySort] = useState<SortState<AbilitySortKey>>({ key: "name", direction: "asc" });
  const [selected, setSelected] = useState<ReverseSelection | null>(null);
  const clearFilters = () => { setQuery(""); setCategories([]); setEffects([]); setIncludeMega(true); };
  if (!active) return null;
  if (kind === "abilities") {
    const matches = abilities.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.description}`.toLowerCase().includes(query.toLowerCase()) && (!categories.length || categories.some((category) => abilityCategories(entry).includes(category))));
    const abilityValue = (entry: (typeof abilities)[number]) => abilitySort.key === "name" ? localName(entry, locale) : abilitySort.key === "category" ? abilityCategories(entry).join(" ") : (pokemonByAbilityId.get(entry.id)?.length ?? 0);
    const filtered = [...matches].sort((left, right) => compareValues(abilityValue(left), abilityValue(right), abilitySort.direction) || left.name.localeCompare(right.name));
    const openUsers = (entry: (typeof abilities)[number]) => setSelected({ id: entry.id, kind: "ability", name: localName(entry, locale), description: locale === "zh-Hant" ? entry.descriptionZh : entry.description, users: pokemonByAbilityId.get(entry.id) ?? [] });
    const userLabel = locale === "zh-Hant" ? "可使用此特性的寶可夢" : "Usable Pokémon";
    return <><section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">ABILITY INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "特性資料庫" : "Ability DB"}</h1><p>{filtered.length} / {abilities.length} abilities</p></div><input aria-label="Search abilities" className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋特性…" : "Search abilities…"} /></div><div className="advanced-filters"><FilterGroup locale={locale} label={localizedTerm("Category", locale)} options={abilityFilterOptions} selected={categories} onToggle={(value) => setCategories((current) => toggleValue(current, value))} /><div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /></div></div><div className="table-scroll"><table className="resource-table"><thead><tr><SortHeader label={localizedTerm("Name", locale)} column="name" sort={abilitySort} onChange={setAbilitySort} /><SortHeader label={localizedTerm("Category", locale)} column="category" sort={abilitySort} onChange={setAbilitySort} /><th>{localizedTerm("Effect", locale)}</th><SortHeader label={userLabel} column="users" sort={abilitySort} onChange={setAbilitySort} /></tr></thead><tbody>{filtered.map((entry) => { const userCount = pokemonByAbilityId.get(entry.id)?.length ?? 0; return <tr key={entry.id}><td><AbilityTooltip id={entry.id} locale={locale} onActivate={() => openUsers(entry)} /></td><td>{localizedTerms(abilityCategories(entry), locale)}</td><td>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</td><td><button className="reverse-count" onClick={() => openUsers(entry)} aria-label={`View ${userCount} Pokémon that can use ${entry.name}`}>{userCount}</button></td></tr>; })}</tbody></table></div></section>{selected && <PokemonUsersDialog key={`${selected.kind}-${selected.id}`} selection={selected} locale={locale} onClose={() => setSelected(null)} />}</>;
  }
  const filtered = items.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.description}`.toLowerCase().includes(query.toLowerCase()) && (includeMega || entry.category !== "Mega Stone") && (!categories.length || categories.includes(entry.category)) && (!effects.length || effects.some((effect) => itemEffectCategories(entry).includes(effect))));
  return <section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">ITEM INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "持有物資料庫" : "Held Item DB"}</h1><p>{filtered.length} / {items.length} items · {locale === "zh-Hant" ? "目前規則" : "Current regulation"}</p></div><input aria-label="Search held items" className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋持有物…" : "Search held items…"} /></div><div className="advanced-filters"><FilterGroup locale={locale} label="Category" options={["Mega Stone", "Item", "Berry"]} selected={categories} onToggle={(value) => setCategories((current) => toggleValue(current, value))} /><FilterGroup locale={locale} label="Effect" options={itemEffectOptions} selected={effects} onToggle={(value) => setEffects((current) => toggleValue(current, value))} /><div className="filter-group inline-filter"><b>{locale === "zh-Hant" ? "超級石" : "Mega Stones"}</b><button className="filter-chip" aria-pressed={includeMega} onClick={() => setIncludeMega((value) => !value)}>{includeMega ? "ON" : "OFF"}</button><span>{locale === "zh-Hant" ? "所有項目皆來自目前的 Pokémon Champions 規則資料。" : "All entries are observed in the current Champions regulation snapshot."}</span></div><div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /></div></div><div className="table-scroll"><table className="resource-table"><thead><tr><th>{localizedTerm("Name", locale)}</th><th>{localizedTerm("Category", locale)}</th><th>{localizedTerm("Effect class", locale)}</th><th>{localizedTerm("Effect", locale)}</th></tr></thead><tbody>{filtered.map((entry) => { const effectClasses = itemEffectCategories(entry); return <tr key={entry.id}><td><ItemTooltip item={entry} locale={locale} size={28} /></td><td>{localizedTerm(entry.category, locale)}</td><td>{effectClasses.length ? localizedTerms(effectClasses, locale) : localizedTerm("Other", locale)}</td><td>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</td></tr>; })}</tbody></table></div></section>;
}
