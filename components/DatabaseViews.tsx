"use client";

import { useMemo, useState } from "react";
import { abilities, abilityById, items, moves, pokemon } from "../lib/catalog";
import { formatPriority, modifiedSpeed, priorityMatches } from "../lib/domain";
import { abilityCategories, compareValues, itemEffectCategories, type SortDirection } from "../lib/filtering";
import { useTeamStore } from "../lib/team-store";
import type { Move, Pokemon, Stats } from "../lib/types";
import { InfoTooltip } from "./InfoTooltip";
import { TypeBadge } from "./TypeBadge";

type Locale = "en" | "zh-Hant";
type PriorityClass = "positive" | "zero" | "negative";
type SortState<Key extends string> = { key: Key; direction: SortDirection };

const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const statLabels: Record<(typeof statKeys)[number], string> = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const abilityFilterOptions = ["Weather", "Terrain", "Offense", "Defense", "Status", "Stat Changes", "Speed", "Type", "Contact", "Switch / Hazard", "Item / Berry", "Ability / Move", "Other"];
const itemEffectOptions = ["HP Recovery", "Status Cure", "PP Recovery", "Damage Halving"];

const localName = (entry: { name: string; nameZh: string }, locale: Locale) => locale === "zh-Hant" ? entry.nameZh : entry.name;
const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

function nextSort<Key extends string>(sort: SortState<Key>, key: Key): SortState<Key> {
  return sort.key === key ? { key, direction: sort.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" };
}

function SortHeader<Key extends string>({ label, column, sort, onChange }: { label: string; column: Key; sort: SortState<Key>; onChange: (sort: SortState<Key>) => void }) {
  const active = sort.key === column;
  return <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => onChange(nextSort(sort, column))}>{label}<span aria-hidden="true">{active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>;
}

function FilterGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="filter-group"><b>{label}</b><div>{options.map((option) => <button type="button" className="filter-chip" key={option} onClick={() => onToggle(option)} aria-pressed={selected.includes(option)}>{option}</button>)}</div></div>;
}

function MoveTooltip({ move, locale }: { move: Move; locale: Locale }) {
  return <InfoTooltip label={localName(move, locale)}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} /><span>{move.category}</span><span>Priority {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>Power {move.power ?? "—"}</span><span>Acc. {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>;
}

function AbilityTooltip({ id, locale }: { id: string; locale: Locale }) {
  const ability = abilityById.get(id);
  if (!ability) return <span>—</span>;
  return <InfoTooltip label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip>;
}

type PokemonSortKey = "rank" | "name" | "type" | keyof Stats | "ability";

export function PokemonTableV2({ locale, format, onSelect }: { locale: Locale; format: "singles" | "doubles"; onSelect: (entry: Pokemon) => void }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<PokemonSortKey>>({ key: "rank", direction: "asc" });
  const matches = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const value = (entry: Pokemon) => {
    if (sort.key === "rank") return format === "doubles" ? entry.usageDoubles : entry.usageSingles;
    if (sort.key === "name") return localName(entry, locale);
    if (sort.key === "type") return entry.types.join(" ");
    if (sort.key === "ability") return entry.abilityIds.map((id) => abilityById.get(id)?.name ?? id).join(" ");
    return entry.baseStats[sort.key];
  };
  const rows = [...matches].sort((a, b) => compareValues(value(a), value(b), sort.direction) || a.name.localeCompare(b.name)).slice(0, 100);
  const copy = locale === "zh-Hant" ? { title: "寶可夢資料庫", search: "搜尋寶可夢或屬性…", legal: "個合法型態", showing: "顯示" } : { title: "Pokémon DB", search: "Search Pokémon or type…", legal: "legal forms", showing: "showing" };
  return <section className="panel catalog-panel"><div className="panel-head"><div><p className="eyebrow">CURRENT REGULATION</p><h1>{copy.title}</h1><p>{matches.length} {copy.legal} · {copy.showing} {rows.length} · Battle data snapshot: 2026-07-29</p></div><label className="search-field"><span className="sr-only">Search Pokémon</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label></div><div className="table-scroll"><table><thead><tr><SortHeader label="Rank" column="rank" sort={sort} onChange={setSort} /><SortHeader label="Pokémon" column="name" sort={sort} onChange={setSort} /><SortHeader label="Type" column="type" sort={sort} onChange={setSort} />{statKeys.map((key) => <SortHeader key={key} label={statLabels[key]} column={key} sort={sort} onChange={setSort} />)}<SortHeader label="Ability" column="ability" sort={sort} onChange={setSort} /><th><span className="sr-only">Action</span></th></tr></thead><tbody>{rows.map((entry) => <tr key={entry.id}><td className="rank">#{format === "doubles" ? entry.usageDoubles : entry.usageSingles}</td><td><div className="pokemon-name"><img src={entry.imageUrl} alt="" width="54" height="54" loading="lazy" /><div><strong>{localName(entry, locale)}</strong>{entry.isMega && <small>Mega</small>}</div></div></td><td><div className="badge-row">{entry.types.map((type) => <TypeBadge key={type} type={type} />)}</div></td>{statKeys.map((key) => <td key={key} className={key === "speed" ? "stat-accent" : "stat-cell"}>{entry.baseStats[key]}</td>)}<td><div className="ability-list">{entry.abilityIds.length ? entry.abilityIds.map((id) => <AbilityTooltip id={id} locale={locale} key={id} />) : "—"}</div></td><td><button className="add-button" onClick={() => onSelect(entry)} aria-label={`Configure ${entry.name}`}>+</button></td></tr>)}</tbody></table></div></section>;
}

type MoveSortKey = "name" | "type" | "category" | "power" | "accuracy" | "pp" | "priority" | "target" | "flags";

export function MoveDatabaseV2({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<PriorityClass[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [properties, setProperties] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<MoveSortKey>>({ key: "name", direction: "asc" });
  const typeOptions = useMemo(() => [...new Set(moves.map((move) => move.type))].sort(), []);
  const targetOptions = useMemo(() => [...new Set(moves.map((move) => move.target))].sort(), []);
  const propertyOptions = useMemo(() => [...new Set(moves.flatMap((move) => move.flags))].sort(), []);
  const value = (move: Move) => sort.key === "flags" ? move.flags.join(" ") : move[sort.key];
  const allMatches = moves.filter((move) => {
    const searchMatch = `${move.name} ${move.nameZh}`.toLowerCase().includes(query.toLowerCase());
    return searchMatch && priorityMatches(move, priorities) && (!types.length || types.includes(move.type)) && (!categories.length || categories.includes(move.category)) && (!targets.length || targets.includes(move.target)) && (!properties.length || properties.some((flag) => move.flags.includes(flag)));
  });
  const rows = [...allMatches].sort((a, b) => compareValues(value(a) ?? Number.POSITIVE_INFINITY, value(b) ?? Number.POSITIVE_INFINITY, sort.direction) || a.name.localeCompare(b.name)).slice(0, 100);
  return <section className="panel"><div className="panel-head moves-head"><div><p className="eyebrow">MOVE INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "招式資料庫" : "Move DB"}</h1><p>{allMatches.length} / {moves.length} moves · showing {rows.length}</p></div><input aria-label="Search moves" className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋招式…" : "Search moves…"} /></div><div className="advanced-filters"><FilterGroup label="Priority" options={["+ Positive", "0 Neutral", "− Negative"]} selected={priorities.map((value) => value === "positive" ? "+ Positive" : value === "zero" ? "0 Neutral" : "− Negative")} onToggle={(label) => { const value = label.startsWith("+") ? "positive" : label.startsWith("0") ? "zero" : "negative"; setPriorities((current) => toggleValue(current, value) as PriorityClass[]); }} /><FilterGroup label="Type" options={typeOptions} selected={types} onToggle={(value) => setTypes((current) => toggleValue(current, value))} /><FilterGroup label="Category" options={["Physical", "Special", "Status"]} selected={categories} onToggle={(value) => setCategories((current) => toggleValue(current, value))} /><FilterGroup label="Target" options={targetOptions} selected={targets} onToggle={(value) => setTargets((current) => toggleValue(current, value))} /><FilterGroup label="Properties" options={propertyOptions} selected={properties} onToggle={(value) => setProperties((current) => toggleValue(current, value))} /></div><div className="table-scroll"><table><thead><tr>{([ ["Move", "name"], ["Type", "type"], ["Class", "category"], ["Power", "power"], ["Acc.", "accuracy"], ["PP", "pp"], ["Priority", "priority"], ["Target", "target"], ["Properties", "flags"] ] as Array<[string, MoveSortKey]>).map(([label, key]) => <SortHeader key={key} label={label} column={key} sort={sort} onChange={setSort} />)}</tr></thead><tbody>{rows.map((move) => <tr key={move.id}><td><MoveTooltip move={move} locale={locale} /></td><td><TypeBadge type={move.type} /></td><td>{move.category}</td><td>{move.power ?? "—"}</td><td>{move.accuracy ?? "—"}</td><td>{move.pp}</td><td><span className={`priority-value priority-${move.priority > 0 ? "positive" : move.priority < 0 ? "negative" : "zero"}`}>{formatPriority(move.priority)}</span></td><td>{move.target}</td><td>{move.flags.join(" · ") || "—"}</td></tr>)}</tbody></table></div></section>;
}

export function ResourceDatabaseV2({ kind, locale }: { kind: "abilities" | "items"; locale: Locale }) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [effects, setEffects] = useState<string[]>([]);
  const [includeMega, setIncludeMega] = useState(true);
  if (kind === "abilities") {
    const filtered = abilities.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.description}`.toLowerCase().includes(query.toLowerCase()) && (!categories.length || categories.some((category) => abilityCategories(entry).includes(category))));
    return <section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">ABILITY INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "特性資料庫" : "Ability DB"}</h1><p>{filtered.length} / {abilities.length} abilities</p></div><input aria-label="Search abilities" className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋特性…" : "Search abilities…"} /></div><div className="advanced-filters"><FilterGroup label="Category" options={abilityFilterOptions} selected={categories} onToggle={(value) => setCategories((current) => toggleValue(current, value))} /></div><div className="table-scroll"><table className="resource-table"><thead><tr><th>Name</th><th>Category</th><th>Effect</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td><AbilityTooltip id={entry.id} locale={locale} /></td><td>{abilityCategories(entry).join(" · ")}</td><td>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</td></tr>)}</tbody></table></div></section>;
  }
  const filtered = items.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.description}`.toLowerCase().includes(query.toLowerCase()) && (includeMega || entry.category !== "Mega Stone") && (!categories.length || categories.includes(entry.category)) && (!effects.length || effects.some((effect) => itemEffectCategories(entry).includes(effect))));
  return <section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">ITEM INTELLIGENCE</p><h1>{locale === "zh-Hant" ? "持有物資料庫" : "Held Item DB"}</h1><p>{filtered.length} / {items.length} items · Current regulation</p></div><input aria-label="Search held items" className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋持有物…" : "Search held items…"} /></div><div className="advanced-filters"><FilterGroup label="Category" options={["Mega Stone", "Item", "Berry"]} selected={categories} onToggle={(value) => setCategories((current) => toggleValue(current, value))} /><FilterGroup label="Effect" options={itemEffectOptions} selected={effects} onToggle={(value) => setEffects((current) => toggleValue(current, value))} /><div className="filter-group inline-filter"><b>Mega Stones</b><button className="filter-chip" aria-pressed={includeMega} onClick={() => setIncludeMega((value) => !value)}>{includeMega ? "ON" : "OFF"}</button><span>All entries are observed in the current Champions regulation snapshot.</span></div></div><div className="table-scroll"><table className="resource-table"><thead><tr><th>Name</th><th>Category</th><th>Effect class</th><th>Effect</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td><InfoTooltip label={localName(entry, locale)}><strong>{localName(entry, locale)}</strong><p>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</p></InfoTooltip></td><td>{entry.category}</td><td>{itemEffectCategories(entry).join(" · ") || "Other"}</td><td>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</td></tr>)}</tbody></table></div></section>;
}

type SpeedEntry = { id: string; pokemonId: string; ap: number; nature: "neutral" | "positive" | "negative"; stage: number; item: "none" | "scarf"; field: "none" | "tailwind" | "paralysis" };

export function SpeedCompareV2({ locale }: { locale: Locale }) {
  const team = useTeamStore((state) => state.members);
  const [entries, setEntries] = useState<SpeedEntry[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon[0]?.id ?? "");
  const [trickRoom, setTrickRoom] = useState(false);
  const addPokemon = (pokemonId: string, source?: Partial<SpeedEntry>) => setEntries((current) => [...current, { id: crypto.randomUUID(), pokemonId, ap: source?.ap ?? 0, nature: source?.nature ?? "neutral", stage: source?.stage ?? 0, item: source?.item ?? "none", field: source?.field ?? "none" }]);
  const importTeam = () => setEntries(team.map((member) => ({ id: crypto.randomUUID(), pokemonId: member.pokemonId, ap: member.ap.speed, nature: member.nature.up === "speed" ? "positive" : member.nature.down === "speed" ? "negative" : "neutral", stage: 0, item: member.itemId === "choice-scarf" ? "scarf" : "none", field: "none" })));
  const update = (id: string, patch: Partial<SpeedEntry>) => setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  const rows = entries.map((entry) => {
    const mon = pokemon.find((candidate) => candidate.id === entry.pokemonId)!;
    const baseFinal = mon.baseStats.speed + 20 + entry.ap;
    const final = Math.floor(baseFinal * (entry.nature === "positive" ? 1.1 : entry.nature === "negative" ? 0.9 : 1));
    const itemMultiplier = entry.item === "scarf" ? 1.5 : 1;
    const fieldMultiplier = entry.field === "tailwind" ? 2 : entry.field === "paralysis" ? 0.5 : 1;
    return { entry, mon, final, modified: modifiedSpeed(final, entry.stage, itemMultiplier * fieldMultiplier) };
  }).sort((a, b) => trickRoom ? a.modified - b.modified : b.modified - a.modified);
  return <section className="panel speed-panel"><div className="panel-head"><div><p className="eyebrow">SPEED SCENARIO LAB</p><h1>{locale === "zh-Hant" ? "速度比較" : "Speed Compare"}</h1><p>{locale === "zh-Hant" ? "自由選擇寶可夢與速度情境；不必先加入隊伍。" : "Select Pokémon and compare configurable Speed scenarios without building a team first."}</p></div></div><div className="speed-picker"><label>Pokémon<select aria-label="Pokemon to compare" value={selectedPokemon} onChange={(event) => setSelectedPokemon(event.target.value)}>{pokemon.map((entry) => <option key={entry.id} value={entry.id}>{localName(entry, locale)}</option>)}</select></label><button className="primary-button compact-button" onClick={() => addPokemon(selectedPokemon)}>Add comparison</button><button className="filter-chip" onClick={importTeam} disabled={!team.length}>Import selected team ({team.length})</button><button className="filter-chip" aria-pressed={trickRoom} onClick={() => setTrickRoom((value) => !value)}>Trick Room {trickRoom ? "ON" : "OFF"}</button></div>{rows.length === 0 ? <div className="empty-state"><span>↯</span><h2>{locale === "zh-Hant" ? "尚未加入比較項目" : "No comparison rows yet"}</h2><p>{locale === "zh-Hant" ? "從上方選擇寶可夢後加入；同一隻也可加入多次比較不同配置。" : "Add any Pokémon above. You can add the same form more than once for different scenarios."}</p></div> : <div className="speed-list">{rows.map((row, index) => <article key={row.entry.id} className="speed-scenario-row"><span className="speed-rank">{index + 1}</span><img src={row.mon.imageUrl} alt="" width="58" height="58" /><div className="speed-identity"><strong>{localName(row.mon, locale)}</strong><span>Base {row.mon.baseStats.speed} → Final {row.final}</span></div><label>Speed AP<input aria-label={`Speed AP for ${row.mon.name}`} type="number" min="0" max="32" value={row.entry.ap} onChange={(event) => update(row.entry.id, { ap: Math.max(0, Math.min(32, Number(event.target.value))) })} /></label><label>Nature<select aria-label={`Speed nature for ${row.mon.name}`} value={row.entry.nature} onChange={(event) => update(row.entry.id, { nature: event.target.value as SpeedEntry["nature"] })}><option value="neutral">Neutral</option><option value="positive">+10% Spe</option><option value="negative">−10% Spe</option></select></label><label>Stage<select aria-label={`Speed stage for ${row.mon.name}`} value={row.entry.stage} onChange={(event) => update(row.entry.id, { stage: Number(event.target.value) })}>{[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map((stage) => <option key={stage} value={stage}>{stage > 0 ? `+${stage}` : stage}</option>)}</select></label><label>Item<select aria-label={`Speed item for ${row.mon.name}`} value={row.entry.item} onChange={(event) => update(row.entry.id, { item: event.target.value as SpeedEntry["item"] })}><option value="none">None</option><option value="scarf">Choice Scarf ×1.5</option></select></label><label>Condition<select aria-label={`Speed condition for ${row.mon.name}`} value={row.entry.field} onChange={(event) => update(row.entry.id, { field: event.target.value as SpeedEntry["field"] })}><option value="none">None</option><option value="tailwind">Tailwind ×2</option><option value="paralysis">Paralysis ×0.5</option></select></label><div className="speed-result"><small>{trickRoom ? "TR order" : "Modified Speed"}</small><b>{row.modified}</b></div><button className="remove-comparison" aria-label={`Remove ${row.mon.name} comparison`} onClick={() => setEntries((current) => current.filter((entry) => entry.id !== row.entry.id))}>×</button></article>)}</div>}<p className="mechanics-note">Priority → explicit order effects → {trickRoom ? "Trick Room: lower modified Speed first" : "higher modified Speed first"} → speed tie. This table compares Speed only; move priority is intentionally not guessed.</p></section>;
}
