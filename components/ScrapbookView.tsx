"use client";

import { useEffect, useMemo, useState } from "react";
import { abilities, moveById, moves, pokemon, pokemonById } from "../lib/catalog";
import { recommendedAp, recommendedNature } from "../lib/battle-recommendations";
import { calculateFinalStats, NEUTRAL_NATURE, totalBaseStats, ZERO_STATS } from "../lib/domain";
import { ALL_TYPES } from "../lib/type-chart";
import { UNTAGGED_GROUP_ID, useScrapbookStore, type Scrapbook } from "../lib/scrapbook-store";
import type { BattleFormat, BattleUsage, Pokemon, Stats } from "../lib/types";
import { PokemonDetailPanel } from "./PokemonDetailDialog";
import { ResetFiltersButton } from "./ResetFiltersButton";
import { TypeBadge } from "./TypeBadge";
import { TypeMatchups } from "./TypeMatchups";

type Locale = "en" | "zh-Hant";
const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const statLabels: Record<keyof Stats, string> = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const localName = (entry: { name: string; nameZh: string }, locale: Locale) => locale === "zh-Hant" ? entry.nameZh : entry.name;
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
type BattleFormats = { singles: BattleUsage | null; doubles: BattleUsage | null };
const battleDataCache = new Map<string, Promise<BattleFormats | null>>();

function loadBattleData(entry: Pokemon) {
  const cached = battleDataCache.get(entry.id);
  if (cached) return cached;
  const request = fetch(`/api/v1/pokemon/battle?pokemonId=${encodeURIComponent(entry.id)}`, { headers: { accept: "application/json" } })
    .then(async (response) => response.ok ? response.json() as Promise<{ data: BattleFormats }> : Promise.reject(new Error(String(response.status))))
    .then((body) => body.data)
    .catch(() => null);
  battleDataCache.set(entry.id, request);
  return request;
}

function RecommendedStats({ entry, format }: { entry: Pokemon; format: BattleFormat }) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadBattleData(entry)
      .then((data) => {
        if (cancelled) return;
        const usage = data?.[format] ?? null;
        setStats(calculateFinalStats(entry.baseStats, recommendedAp(usage) ?? ZERO_STATS, recommendedNature(usage) ?? NEUTRAL_NATURE));
      });
    return () => { cancelled = true; };
  }, [entry, format]);
  return <>{statKeys.map((key) => <span key={key}><small>{statLabels[key]}</small><b>{stats?.[key] ?? "—"}</b></span>)}</>;
}

function moveRepeatedly(action: () => void, count: number) {
  for (let index = 0; index < count; index += 1) action();
}

function ScrapbookGroup({ book, groupId, locale, format, expanded, onToggle, onBuild, onAddToScrapbook }: {
  book: Scrapbook;
  groupId: string;
  locale: Locale;
  format: BattleFormat;
  expanded: boolean;
  onToggle: () => void;
  onBuild: (entry: Pokemon) => void;
  onAddToScrapbook: (entry: Pokemon) => void;
}) {
  const moveGroup = useScrapbookStore((state) => state.moveGroup);
  const movePokemon = useScrapbookStore((state) => state.movePokemon);
  const removePokemon = useScrapbookStore((state) => state.removePokemon);
  const [openPokemonId, setOpenPokemonId] = useState<string | null>(null);
  const groupIndex = book.groupOrder.indexOf(groupId);
  const tag = book.tags.find((entry) => entry.id === groupId);
  const ids = (book.pokemonOrderByGroup[groupId] ?? []).filter((id) => {
    const saved = book.entries.find((entry) => entry.pokemonId === id);
    return saved && (groupId === UNTAGGED_GROUP_ID ? saved.tagIds.length === 0 : saved.tagIds.includes(groupId));
  });
  const entries = ids.map((id) => pokemonById.get(id)).filter((entry): entry is Pokemon => Boolean(entry));
  if (!entries.length) return null;
  const groupName = groupId === UNTAGGED_GROUP_ID ? (locale === "zh-Hant" ? "未標籤" : "Untagged") : tag?.name ?? groupId;
  return <section className={`scrapbook-group ${expanded ? "expanded" : "collapsed"}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/scrapbook-group", groupId)} onDragOver={(event) => { if (event.dataTransfer.types.includes("text/scrapbook-group")) event.preventDefault(); }} onDrop={(event) => {
    const draggedId = event.dataTransfer.getData("text/scrapbook-group");
    const from = book.groupOrder.indexOf(draggedId);
    if (from < 0 || from === groupIndex) return;
    moveRepeatedly(() => moveGroup(book.id, draggedId, from < groupIndex ? 1 : -1), Math.abs(groupIndex - from));
  }}>
    <header className="scrapbook-group-header"><button className="scrapbook-group-toggle" onClick={onToggle} aria-expanded={expanded}><span aria-hidden="true">{expanded ? "▾" : "▸"}</span><strong>{groupName}</strong><small>{entries.length}</small></button><div className="scrapbook-order-actions"><button disabled={groupIndex <= 0} onClick={() => moveGroup(book.id, groupId, -1)} aria-label={`${groupName} up`}>↑</button><button disabled={groupIndex >= book.groupOrder.length - 1} onClick={() => moveGroup(book.id, groupId, 1)} aria-label={`${groupName} down`}>↓</button></div>{!expanded && <div className="scrapbook-thumbnails" aria-label={groupName}>{entries.map((entry) => <img src={entry.imageUrl} alt={localName(entry, locale)} width="42" height="42" key={entry.id} />)}</div>}</header>
    {expanded && <div className="scrapbook-pokemon-list">{entries.map((entry, index) => <article className={`scrapbook-pokemon ${openPokemonId === entry.id ? "open" : ""}`} key={entry.id} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/scrapbook-pokemon", entry.id); }} onDragOver={(event) => { if (event.dataTransfer.types.includes("text/scrapbook-pokemon")) event.preventDefault(); }} onDrop={(event) => {
      event.stopPropagation();
      const draggedId = event.dataTransfer.getData("text/scrapbook-pokemon");
      const from = ids.indexOf(draggedId);
      if (from < 0 || from === index) return;
      moveRepeatedly(() => movePokemon(book.id, groupId, draggedId, from < index ? 1 : -1), Math.abs(index - from));
    }}>
      <div className="scrapbook-pokemon-row"><button className="scrapbook-pokemon-main" onClick={() => setOpenPokemonId((current) => current === entry.id ? null : entry.id)} aria-expanded={openPokemonId === entry.id}><span className="scrapbook-drag-handle" aria-hidden="true">⋮⋮</span><img src={entry.imageUrl} alt="" width="58" height="58" /><strong>{localName(entry, locale)}</strong><span className="badge-row compact">{entry.types.map((type) => <TypeBadge type={type} locale={locale} key={type} />)}</span><span className="scrapbook-final-stats"><RecommendedStats entry={entry} format={format} /></span></button><TypeMatchups types={entry.types} locale={locale} compact /><div className="scrapbook-row-actions"><button disabled={index === 0} onClick={() => movePokemon(book.id, groupId, entry.id, -1)} aria-label={`${localName(entry, locale)} up`}>↑</button><button disabled={index === entries.length - 1} onClick={() => movePokemon(book.id, groupId, entry.id, 1)} aria-label={`${localName(entry, locale)} down`}>↓</button><button className="remove-member" onClick={() => removePokemon(book.id, entry.id)} aria-label={`${locale === "zh-Hant" ? "從畫本移除" : "Remove from scrapbook"} ${localName(entry, locale)}`}>×</button></div></div>
      {openPokemonId === entry.id && <PokemonDetailPanel pokemon={entry} locale={locale} initialFormat={format} inline onBuild={() => onBuild(entry)} onScrapbook={() => onAddToScrapbook(entry)} />}
    </article>)}</div>}
  </section>;
}

export function ScrapbookView({ locale, format, onBuild, onAddToScrapbook }: { locale: Locale; format: BattleFormat; onBuild: (entry: Pokemon) => void; onAddToScrapbook: (entry: Pokemon) => void }) {
  const books = useScrapbookStore((state) => state.books);
  const createBook = useScrapbookStore((state) => state.createBook);
  const renameBook = useScrapbookStore((state) => state.renameBook);
  const deleteBook = useScrapbookStore((state) => state.deleteBook);
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [newBookName, setNewBookName] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeMode, setTypeMode] = useState<"or" | "and">("or");
  const [form, setForm] = useState<"all" | "regular" | "mega">("all");
  const [abilityId, setAbilityId] = useState("");
  const [knownMoveIds, setKnownMoveIds] = useState<string[]>([]);
  const [moveInput, setMoveInput] = useState("");
  const [minimums, setMinimums] = useState<Stats>({ ...ZERO_STATS });
  const [totalMinimum, setTotalMinimum] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const effectiveBookId = books.some((book) => book.id === bookId) ? bookId : books[0]?.id ?? "";
  const book = books.find((entry) => entry.id === effectiveBookId) ?? null;
  const hasCriteria = Boolean(query.trim() || selectedTypes.length || form !== "all" || abilityId || knownMoveIds.length || totalMinimum || statKeys.some((key) => minimums[key] > 0));
  const candidates = useMemo(() => hasCriteria ? pokemon.filter((entry) => `${entry.name} ${entry.nameZh}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    && (!selectedTypes.length || (typeMode === "or" ? selectedTypes.some((type) => entry.types.includes(type as Pokemon["types"][number])) : selectedTypes.every((type) => entry.types.includes(type as Pokemon["types"][number]))))
    && (form === "all" || (form === "mega" ? entry.isMega : !entry.isMega))
    && (!abilityId || entry.abilityIds.includes(abilityId))
    && knownMoveIds.every((id) => entry.moveIds.includes(id))
    && statKeys.every((key) => entry.baseStats[key] >= minimums[key])
    && totalBaseStats(entry.baseStats) >= totalMinimum).slice(0, 24) : [], [abilityId, form, hasCriteria, knownMoveIds, minimums, query, selectedTypes, totalMinimum, typeMode]);
  const matchMove = (value: string) => moves.find((entry) => [entry.name, entry.nameZh].some((name) => name.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
  const clearFilters = () => { setQuery(""); setSelectedTypes([]); setTypeMode("or"); setForm("all"); setAbilityId(""); setKnownMoveIds([]); setMoveInput(""); setMinimums({ ...ZERO_STATS }); setTotalMinimum(0); };
  const create = () => { if (!newBookName.trim()) return; const id = createBook(newBookName); setBookId(id); setNewBookName(""); };
  const visibleGroupIds = book?.groupOrder.filter((groupId) => groupId === UNTAGGED_GROUP_ID ? book.entries.some((entry) => entry.tagIds.length === 0) : book.entries.some((entry) => entry.tagIds.includes(groupId))) ?? [];
  const copy = locale === "zh-Hant" ? { title: "畫本", subtitle: "把感興趣的寶可夢依標籤整理，並在同一頁比較完整資料。", choose: "選擇畫本", create: "建立畫本", newName: "新畫本名稱", quick: "快速找寶可夢加入", noCriteria: "加入至少一個條件後才會顯示候選寶可夢。", expand: "展開全部標籤", collapse: "收合全部標籤", empty: "這本畫本還沒有寶可夢。", delete: "刪除畫本", rename: "重新命名" } : { title: "Scrapbooks", subtitle: "Organize interesting Pokémon by tag and compare their complete data together.", choose: "Choose scrapbook", create: "Create scrapbook", newName: "New scrapbook name", quick: "Quick-find Pokémon to add", noCriteria: "Add at least one condition before candidate Pokémon appear.", expand: "Expand all tags", collapse: "Collapse all tags", empty: "This scrapbook has no Pokémon yet.", delete: "Delete scrapbook", rename: "Rename" };
  return <section className="panel scrapbook-view"><div className="panel-head scrapbook-title"><div><p className="eyebrow">COMPARISON SCRAPBOOK</p><h1>{copy.title}</h1><p>{copy.subtitle}</p></div></div>
    <div className="scrapbook-toolbar">{books.length > 0 && <label>{copy.choose}<select value={effectiveBookId} onChange={(event) => setBookId(event.target.value)}>{books.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>}<label>{copy.newName}<input value={newBookName} maxLength={60} onChange={(event) => setNewBookName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") create(); }} /></label><button className="primary-button" onClick={create}>{copy.create}</button>{book && <><button className="secondary-button" onClick={() => { const name = window.prompt(copy.rename, book.name); if (name) renameBook(book.id, name); }}>{copy.rename}</button><button className="danger-button" onClick={() => { if (window.confirm(`${copy.delete}: ${book.name}?`)) deleteBook(book.id); }}>{copy.delete}</button></>}</div>
    <section className="scrapbook-finder"><button className="scrapbook-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((current) => !current)}><span>{copy.quick}</span><span>{filtersOpen ? "−" : "+"}</span></button>{filtersOpen && <div className="advanced-filters pokemon-advanced-filters"><div className="filter-group pokemon-name-filter"><b>{locale === "zh-Hant" ? "名稱" : "Name"}</b><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋寶可夢名稱…" : "Search Pokémon name…"} /></div><div className="filter-group"><b>{locale === "zh-Hant" ? "屬性" : "Type"}</b><div>{ALL_TYPES.map((type) => <button className="filter-chip" aria-pressed={selectedTypes.includes(type)} onClick={() => setSelectedTypes((current) => toggle(current, type))} key={type}>{locale === "zh-Hant" ? type : type}</button>)}</div></div><div className="filter-group filter-logic-row"><b>{locale === "zh-Hant" ? "屬性邏輯" : "Type logic"}</b><div className="segmented"><button className={typeMode === "or" ? "active" : ""} onClick={() => setTypeMode("or")}>OR</button><button className={typeMode === "and" ? "active" : ""} onClick={() => setTypeMode("and")}>AND</button></div></div><div className="filter-group"><b>{locale === "zh-Hant" ? "型態" : "Form"}</b><div>{(["all", "regular", "mega"] as const).map((value) => <button className="filter-chip" aria-pressed={form === value} onClick={() => setForm(value)} key={value}>{value === "all" ? (locale === "zh-Hant" ? "全部" : "All") : value === "regular" ? (locale === "zh-Hant" ? "一般" : "Regular") : "Mega"}</button>)}</div></div><div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "特性" : "Ability"}</b><select value={abilityId} onChange={(event) => setAbilityId(event.target.value)}><option value="">—</option>{abilities.map((ability) => <option key={ability.id} value={ability.id}>{localName(ability, locale)}</option>)}</select></div><div className="filter-group filter-select-row"><b>{locale === "zh-Hant" ? "可學招式" : "Known moves"}</b><div><input list="scrapbook-move-options" value={moveInput} onChange={(event) => { const value = event.target.value; const matched = matchMove(value); if (matched) { setKnownMoveIds((current) => current.includes(matched.id) ? current : [...current, matched.id]); setMoveInput(""); } else setMoveInput(value); }} /><datalist id="scrapbook-move-options">{moves.map((move) => <option value={localName(move, locale)} key={move.id} />)}</datalist>{knownMoveIds.map((id) => <button className="selected-filter" onClick={() => setKnownMoveIds((current) => current.filter((entry) => entry !== id))} key={id}>{localName(moveById.get(id)!, locale)} ×</button>)}</div></div><div className="filter-group stat-minimum-filter"><b>{locale === "zh-Hant" ? "最低種族值" : "Minimum stats"}</b><div>{statKeys.map((key) => <label key={key}>{statLabels[key]}<input type="number" min="0" max="255" value={minimums[key] || ""} placeholder="0" onChange={(event) => setMinimums((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value) || 0) }))} /></label>)}<label>TOT<input type="number" min="0" max="1530" value={totalMinimum || ""} placeholder="0" onChange={(event) => setTotalMinimum(Math.max(0, Number(event.target.value) || 0))} /></label></div></div><div className="filter-actions"><ResetFiltersButton locale={locale} onClick={clearFilters} /></div><div className="scrapbook-candidates">{!hasCriteria ? <p>{copy.noCriteria}</p> : candidates.length ? candidates.map((entry) => <button className="scrapbook-candidate" onClick={() => onAddToScrapbook(entry)} key={entry.id}><img src={entry.imageUrl} alt="" width="44" height="44" /><span>{localName(entry, locale)}</span><span aria-hidden="true">＋</span></button>) : <p>{locale === "zh-Hant" ? "沒有符合條件的寶可夢。" : "No Pokémon match."}</p>}</div></div>}</section>
    {book && <div className="scrapbook-content"><div className="scrapbook-bulk-actions"><button onClick={() => setExpandedGroups(visibleGroupIds)}>{copy.expand}</button><button onClick={() => setExpandedGroups([])}>{copy.collapse}</button></div>{visibleGroupIds.length ? visibleGroupIds.map((groupId) => <ScrapbookGroup key={groupId} book={book} groupId={groupId} locale={locale} format={format} expanded={expandedGroups.includes(groupId)} onToggle={() => setExpandedGroups((current) => toggle(current, groupId))} onBuild={onBuild} onAddToScrapbook={onAddToScrapbook} />) : <p className="scrapbook-empty">{copy.empty}</p>}</div>}
    {!books.length && <p className="scrapbook-empty">{locale === "zh-Hant" ? "先建立第一本畫本，或從寶可夢資料庫直接加入。" : "Create your first scrapbook, or add from the Pokémon DB."}</p>}
  </section>;
}
