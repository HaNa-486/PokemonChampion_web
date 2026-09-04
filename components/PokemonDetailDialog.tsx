"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { abilityById, abilityIdByUsageName, itemById, itemIdByUsageName, megaBasePokemonIdByStoneId, megaStoneIdByPokemonId, moveById, moveIdByUsageName, pokemon as catalogPokemon, pokemonById, pokemonByMoveId, usageEntityKey } from "../lib/catalog";
import { formatPriority, NATURES, priorityMatches } from "../lib/domain";
import { compareValues, type SortDirection } from "../lib/filtering";
import type { BattleUsage, BattleUsageRow, Move, Pokemon } from "../lib/types";
import { InfoTooltip } from "./InfoTooltip";
import { ItemDisplay, ItemTooltip } from "./ItemDisplay";
import { ResetFiltersButton } from "./ResetFiltersButton";
import { TypeBadge } from "./TypeBadge";
import { TypeMatchups } from "./TypeMatchups";
import { PokemonUsersDialog, type ReverseSelection } from "./PokemonUsersDialog";
import { localizedTerm } from "../lib/localization";
import { useDialogEscape } from "../lib/use-dialog-escape";
import { ALL_TYPES } from "../lib/type-chart";

type Locale = "en" | "zh-Hant";
type PriorityClass = "positive" | "zero" | "negative";
type LearnableMoveSortKey = "name" | "type" | "category" | "power" | "accuracy" | "pp" | "priority" | "target" | "users";
type LearnableMoveSort = { key: LearnableMoveSortKey; direction: SortDirection };
type BattleResponse = { data: { scope: string; singles: BattleUsage | null; doubles: BattleUsage | null } };
const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const statLabels = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const categoryOrder = ["move", "held_item", "ability", "stat_alignment", "stat_points", "teammate"];
const categoryLabels: Record<string, [string, string]> = {
  move: ["Moves", "招式"], held_item: ["Held items", "持有物"], ability: ["Abilities", "特性"], stat_alignment: ["Natures", "性格"], stat_points: ["AP spreads", "AP 配置"], teammate: ["Teammates", "隊友"],
};
const localName = (entry: { name: string; nameZh: string }, locale: Locale) => locale === "zh-Hant" ? entry.nameZh : entry.name;
const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
const moveCategoryRank: Record<Move["category"], number> = { Physical: 0, Special: 1, Status: 2 };
const typeRank = new Map(ALL_TYPES.map((type, index) => [type, index]));

export function compareLearnableMoves(a: Move, b: Move) {
  return (typeRank.get(a.type) ?? ALL_TYPES.length) - (typeRank.get(b.type) ?? ALL_TYPES.length)
    || moveCategoryRank[a.category] - moveCategoryRank[b.category]
    || b.priority - a.priority
    || [...a.flags].sort().join(" ").localeCompare([...b.flags].sort().join(" "))
    || a.target.localeCompare(b.target)
    || a.name.localeCompare(b.name);
}

function FilterGroup({ label, options, selected, onToggle, locale }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void; locale: Locale }) {
  return <div className="filter-group"><b>{localizedTerm(label, locale)}</b><div>{options.map((option) => <button type="button" className="filter-chip" key={option} onClick={() => onToggle(option)} aria-pressed={selected.includes(option)}>{localizedTerm(option, locale)}</button>)}</div></div>;
}

function MoveEntry({ move, locale, compact = false }: { move: Move; locale: Locale; compact?: boolean }) {
  return <span className="learnable-move-entry"><InfoTooltip label={localName(move, locale)}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} locale={locale} /><span>{localizedTerm(move.category, locale)}</span><span>{localizedTerm("Priority", locale)} {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>{localizedTerm("Power", locale)} {move.power ?? "—"}</span><span>{localizedTerm("Acc.", locale)} {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>{!compact && <small className="learnable-move-stats">{localizedTerm("Power", locale)} {move.power ?? "—"} · {localizedTerm("Acc.", locale)} {move.accuracy ?? "—"} · PP {move.pp}</small>}</span>;
}

function LearnableSortHeader({ label, column, sort, onChange, initialDirection = "asc" }: { label: string; column: LearnableMoveSortKey; sort: LearnableMoveSort | null; onChange: (sort: LearnableMoveSort | null) => void; initialDirection?: SortDirection }) {
  const active = sort?.key === column;
  const oppositeDirection = initialDirection === "asc" ? "desc" : "asc";
  const nextSort = !active ? { key: column, direction: initialDirection } as LearnableMoveSort : sort.direction === initialDirection ? { key: column, direction: oppositeDirection } as LearnableMoveSort : null;
  return <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => onChange(nextSort)}>{label}<span aria-hidden="true">{active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>;
}

function LearnableMoveTable({ moves, locale, sort, onSort, onOpenUsers }: { moves: Move[]; locale: Locale; sort: LearnableMoveSort | null; onSort: (sort: LearnableMoveSort | null) => void; onOpenUsers: (move: Move) => void }) {
  const userLabel = locale === "zh-Hant" ? "可使用此招式的寶可夢" : "Usable Pokémon";
  const columns: Array<[string, LearnableMoveSortKey, SortDirection]> = [["Move", "name", "asc"], ["Type", "type", "asc"], ["Class", "category", "desc"], ["Power", "power", "desc"], ["Acc.", "accuracy", "desc"], ["PP", "pp", "desc"], ["Priority", "priority", "desc"], ["Target", "target", "asc"]];
  return <div className="table-scroll learnable-table-scroll" tabIndex={0}><table className="learnable-move-table"><thead><tr>{columns.map(([label, key, initialDirection]) => <LearnableSortHeader key={key} label={localizedTerm(label, locale)} column={key} sort={sort} onChange={onSort} initialDirection={initialDirection} />)}<th>{localizedTerm("Effect", locale)}</th><LearnableSortHeader label={userLabel} column="users" sort={sort} onChange={onSort} /></tr></thead><tbody>{moves.map((move) => { const userCount = pokemonByMoveId.get(move.id)?.length ?? 0; return <tr key={move.id}><td><MoveEntry move={move} locale={locale} compact /></td><td><TypeBadge type={move.type} locale={locale} /></td><td>{localizedTerm(move.category, locale)}</td><td>{move.power ?? "—"}</td><td>{move.accuracy ?? "—"}</td><td>{move.pp}</td><td><span className={`priority-value priority-${move.priority > 0 ? "positive" : move.priority < 0 ? "negative" : "zero"}`}>{formatPriority(move.priority)}</span></td><td>{localizedTerm(move.target, locale)}</td><td className="move-effect-cell">{locale === "zh-Hant" ? move.descriptionZh : move.description}</td><td><button type="button" className="reverse-count learnable-user-count" onClick={() => onOpenUsers(move)} aria-label={`${locale === "zh-Hant" ? "查看" : "View"} ${userCount} ${locale === "zh-Hant" ? "隻可使用" : "Pokémon that can use"} ${localName(move, locale)}`}>{userCount}</button></td></tr>; })}</tbody></table></div>;
}

function usageName(row: BattleUsageRow, locale: Locale) {
  if (row.ap) {
    const labels = locale === "zh-Hant"
      ? { hp: "HP", attack: "攻擊", defense: "防禦", specialAttack: "特攻", specialDefense: "特防", speed: "速度" }
      : statLabels;
    return statKeys.map((key) => `${labels[key]} ${row.ap![key]}`).join(" / ");
  }
  if (row.name) return row.statUp || row.statDown ? `${row.name} (${row.statUp || "—"} ↑ / ${row.statDown || "—"} ↓)` : row.name;
  return "—";
}

function UsageEntry({ category, row, locale }: { category: string; row: BattleUsageRow; locale: Locale }) {
  const fallback = usageName(row, locale);
  if (category === "move") {
    const move = moveById.get(moveIdByUsageName.get(usageEntityKey(row.name)) ?? "");
    if (move) return <span className="usage-resource"><TypeBadge type={move.type} locale={locale} /><MoveEntry move={move} locale={locale} /></span>;
  }
  if (category === "ability") {
    const ability = abilityById.get(abilityIdByUsageName.get(usageEntityKey(row.name)) ?? "");
    if (ability) return <InfoTooltip label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip>;
  }
  if (category === "held_item") {
    const item = itemById.get(itemIdByUsageName.get(usageEntityKey(row.name)) ?? "");
    if (item) return <span className="usage-resource"><ItemTooltip item={item} locale={locale} /></span>;
    return <span className="usage-resource"><ItemDisplay locale={locale} fallbackName={fallback} /></span>;
  }
  if (category === "stat_alignment") {
    const nature = NATURES.find((entry) => usageEntityKey(entry.name) === usageEntityKey(row.name));
    if (nature) {
      const name = locale === "zh-Hant" ? nature.nameZh ?? nature.name : nature.name;
      const labels = locale === "zh-Hant"
        ? { hp: "HP", attack: "攻擊", defense: "防禦", specialAttack: "特攻", specialDefense: "特防", speed: "速度" }
        : statLabels;
      return <span>{name}{nature.up && nature.down ? ` (${labels[nature.up]} ↑ / ${labels[nature.down]} ↓)` : locale === "zh-Hant" ? "（能力值不變）" : " (No stat change)"}</span>;
    }
  }
  if (category === "teammate") {
    const teammate = catalogPokemon.find((entry) => usageEntityKey(entry.name) === usageEntityKey(row.name));
    if (teammate) return <span>{localName(teammate, locale)}</span>;
  }
  return <span>{fallback}</span>;
}

function BattlePanel({ usage, locale, visibleCategories = categoryOrder }: { usage: BattleUsage | null | undefined; locale: Locale; visibleCategories?: string[] }) {
  if (!usage) return <p className="detail-empty">{locale === "zh-Hant" ? "目前沒有這個賽制的官方資料。" : "No official data is currently available for this format."}</p>;
  const groups = categoryOrder.filter((category) => visibleCategories.includes(category)).map((category) => ({ category, rows: usage.rows.filter((row) => row.category === category).sort((left, right) => left.rank - right.rank) })).filter((group) => group.rows.length);
  const rankGapByCategory = new Map((usage.rankGaps ?? []).map((gap) => [gap.category, gap.missingRanks]));
  return <div className="battle-usage"><p className="battle-source">{usage.season} · {usage.date ?? (locale === "zh-Hant" ? "當前賽季（每日更新）" : "current season (daily cutoff)")} · {usage.source}</p>{groups.map(({ category, rows }) => { const missingRanks = rankGapByCategory.get(category) ?? []; return <section key={category}><h3>{categoryLabels[category]?.[locale === "zh-Hant" ? 1 : 0] ?? category}</h3>{missingRanks.length > 0 && <p className="battle-rank-warning" role="note">{locale === "zh-Hant" ? `官方來源缺少第 ${missingRanks.join("、")} 名；以下保留來源提供的原始排名。` : `The official source is missing ranks ${missingRanks.map((rank) => `#${rank}`).join(", ")}; the original reported ranks are preserved below.`}</p>}<div className="usage-table"><div className="usage-head"><span>#</span><span>{locale === "zh-Hant" ? "項目" : "Entry"}</span><span>{locale === "zh-Hant" ? "使用率" : "Usage"}</span></div>{rows.map((row, index) => <div className="usage-row" key={`${category}-${row.rank}-${index}`}><b>{row.rank || index + 1}</b><UsageEntry category={category} row={row} locale={locale} /><strong>{row.percentage || "—"}</strong></div>)}</div></section>; })}</div>;
}

export function PokemonDetailDialog({ pokemon, locale, initialFormat, onClose, onBuild, onScrapbook }: { pokemon: Pokemon; locale: Locale; initialFormat: "singles" | "doubles"; onClose: () => void; onBuild: () => void; onScrapbook?: (entry: Pokemon) => void }) {
  useDialogEscape(onClose);
  return <PokemonDetailPanel pokemon={pokemon} locale={locale} initialFormat={initialFormat} onClose={onClose} onBuild={onBuild} onScrapbook={onScrapbook} />;
}

export function compareScrapbookLearnableMoves(preferredTypes: Pokemon["types"], left: Move, right: Move) {
  const preferred = Number(!preferredTypes.includes(left.type)) - Number(!preferredTypes.includes(right.type));
  return preferred || (typeRank.get(left.type) ?? ALL_TYPES.length) - (typeRank.get(right.type) ?? ALL_TYPES.length)
    || moveCategoryRank[left.category] - moveCategoryRank[right.category]
    || bumpyMoveSort(left, right);
}

export function PokemonDetailPanel({ pokemon, locale, initialFormat, onClose, onBuild, onScrapbook, inline = false, buildLabel, visibleBattleCategories: controlledBattleCategories, onVisibleBattleCategoriesChange }: { pokemon: Pokemon; locale: Locale; initialFormat: "singles" | "doubles"; onClose?: () => void; onBuild: () => void; onScrapbook?: (entry: Pokemon) => void; inline?: boolean; buildLabel?: string; visibleBattleCategories?: string[]; onVisibleBattleCategoriesChange?: (categories: string[]) => void }) {
  const titleId = useId();
  const [format, setFormat] = useState(initialFormat);
  const [battle, setBattle] = useState<BattleResponse["data"] | null>(null);
  const [error, setError] = useState("");
  const [moveQuery, setMoveQuery] = useState("");
  const [priorities, setPriorities] = useState<PriorityClass[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moveSort, setMoveSort] = useState<LearnableMoveSort | null>(null);
  const [reverseSelection, setReverseSelection] = useState<ReverseSelection | null>(null);
  const [internalBattleCategories, setInternalBattleCategories] = useState<string[]>(categoryOrder);
  const visibleBattleCategories = controlledBattleCategories ?? internalBattleCategories;
  const setVisibleBattleCategories = (updater: (current: string[]) => string[]) => {
    const next = updater(visibleBattleCategories);
    if (onVisibleBattleCategoriesChange) onVisibleBattleCategoriesChange(next);
    else setInternalBattleCategories(next);
  };
  const learnableMoves = useMemo(() => pokemon.moveIds.map((id) => moveById.get(id)).filter((entry): entry is Move => Boolean(entry)), [pokemon.moveIds]);
  const typeOptions = useMemo(() => ALL_TYPES.filter((type) => learnableMoves.some((move) => move.type === type)), [learnableMoves]);
  const targetOptions = useMemo(() => [...new Set(learnableMoves.map((move) => move.target))].sort(), [learnableMoves]);
  const moveEntries = useMemo(() => learnableMoves.filter((move) => {
    const searchMatch = `${move.name} ${move.nameZh}`.toLowerCase().includes(moveQuery.toLowerCase());
    return searchMatch && priorityMatches(move, priorities) && (!types.length || types.includes(move.type)) && (!categories.length || categories.includes(move.category)) && (!targets.length || targets.includes(move.target));
  }).sort((left, right) => {
    if (!moveSort) return inline ? compareScrapbookLearnableMoves(pokemon.types, left, right) : compareLearnableMoves(left, right);
    const value = (move: Move) => moveSort.key === "users" ? (pokemonByMoveId.get(move.id)?.length ?? 0) : move[moveSort.key];
    const leftValue = value(left);
    const rightValue = value(right);
    if (leftValue == null || rightValue == null) {
      if (leftValue == null && rightValue == null) return left.name.localeCompare(right.name);
      return leftValue == null ? 1 : -1;
    }
    return compareValues(leftValue, rightValue, moveSort.direction) || left.name.localeCompare(right.name);
  }), [inline, learnableMoves, moveQuery, priorities, types, categories, targets, pokemon.types, moveSort]);
  const activeFilterCount = priorities.length + types.length + categories.length + targets.length;
  const clearMoveFilters = () => { setMoveQuery(""); setPriorities([]); setTypes([]); setCategories([]); setTargets([]); };
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/pokemon/battle?pokemonId=${encodeURIComponent(pokemon.id)}`, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error(String(response.status)); return response.json() as Promise<BattleResponse>; })
      .then((body) => setBattle(body.data))
      .catch((reason) => { if (reason?.name !== "AbortError") setError(locale === "zh-Hant" ? "目前無法載入官方對戰資料，請稍後再試。" : "Official battle data could not be loaded. Please try again shortly."); });
    return () => controller.abort();
  }, [pokemon.id, locale]);
  const megaStoneId = megaStoneIdByPokemonId.get(pokemon.id);
  const megaBase = megaStoneId ? pokemonById.get(megaBasePokemonIdByStoneId.get(megaStoneId) ?? "") : null;
  const sharesBaseBattleData = Boolean(pokemon.isMega && megaBase);
  const copy = locale === "zh-Hant" ? { close: "關閉", build: buildLabel ?? "配置並加入隊伍", scrapbook: "加入其他畫本", moves: "可學招式", abilities: "可選特性", battle: "當季對戰資料", loading: "正在讀取 Champions Battle Data…", note: sharesBaseBattleData ? "此 Mega 型態的官方對戰統計與原物種合併提供。" : "" } : { close: "Close", build: buildLabel ?? "Build & add to team", scrapbook: "Add to another scrapbook", moves: "Learnable moves", abilities: "Available abilities", battle: "Current-season battle data", loading: "Loading Champions Battle Data…", note: sharesBaseBattleData ? "Official statistics for this Mega form are aggregated with its base species." : "" };
  const openMoveUsers = (move: Move) => setReverseSelection({
    id: move.id,
    kind: "move",
    name: localName(move, locale),
    description: locale === "zh-Hant" ? move.descriptionZh : move.description,
    users: pokemonByMoveId.get(move.id) ?? [],
    move,
  });
  const content = <><header className="detail-identity"><img src={pokemon.imageUrl} alt="" width="112" height="112" /><div><p className="eyebrow">POKÉMON INTELLIGENCE</p><h2 id={titleId}>{localName(pokemon, locale)}</h2><div className="badge-row">{pokemon.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></div><div className="detail-actions">{onScrapbook && <button className="secondary-button" onClick={() => onScrapbook(pokemon)}>{copy.scrapbook}</button>}<button className="primary-button detail-build" onClick={onBuild}>{copy.build}</button></div></header>{!inline && <div className="detail-stats">{statKeys.map((key) => <span key={key}><small>{statLabels[key]}</small><b>{pokemon.baseStats[key]}</b></span>)}</div>}<TypeMatchups types={pokemon.types} locale={locale} /><div className="detail-section"><h3>{copy.abilities} <span>{pokemon.abilityIds.length}</span></h3><div className="detail-abilities">{pokemon.abilityIds.map((id) => { const ability = abilityById.get(id); return ability ? <InfoTooltip key={id} label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip> : null; })}</div></div><div className="detail-section"><div className="detail-section-head"><h3>{copy.moves} <span>{moveEntries.length} / {pokemon.moveIds.length}</span></h3><input aria-label="Search learnable moves" value={moveQuery} onChange={(event) => setMoveQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋可學招式…" : "Search learnable moves…"} /></div><button type="button" className="move-filter-toggle filter-chip" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>{locale === "zh-Hant" ? "招式篩選" : "Move filters"}{activeFilterCount ? ` (${activeFilterCount})` : ""}</button><div className={`advanced-filters detail-move-filters${filtersOpen ? " open" : ""}`}><FilterGroup locale={locale} label="Priority" options={["+ Positive", "0 Neutral", "− Negative"]} selected={priorities.map((entry) => entry === "positive" ? "+ Positive" : entry === "zero" ? "0 Neutral" : "− Negative")} onToggle={(label) => { const entry = label.startsWith("+") ? "positive" : label.startsWith("0") ? "zero" : "negative"; setPriorities((current) => toggleValue(current, entry) as PriorityClass[]); }} /><FilterGroup locale={locale} label="Type" options={typeOptions} selected={types} onToggle={(entry) => setTypes((current) => toggleValue(current, entry))} /><FilterGroup locale={locale} label="Category" options={["Physical", "Special", "Status"]} selected={categories} onToggle={(entry) => setCategories((current) => toggleValue(current, entry))} /><FilterGroup locale={locale} label="Target" options={targetOptions} selected={targets} onToggle={(entry) => setTargets((current) => toggleValue(current, entry))} /><div className="detail-filter-actions"><ResetFiltersButton locale={locale} onClick={clearMoveFilters} /></div></div>{moveEntries.length ? <LearnableMoveTable moves={moveEntries} locale={locale} sort={moveSort} onSort={setMoveSort} onOpenUsers={openMoveUsers} /> : <p className="detail-empty">{locale === "zh-Hant" ? "沒有符合目前篩選條件的招式。" : "No learnable moves match the current filters."}</p>}</div><div className="detail-section"><div className="detail-section-head"><h3>{copy.battle}</h3><div className="segmented"><button className={format === "singles" ? "active" : ""} onClick={() => setFormat("singles")}>{locale === "zh-Hant" ? "單打" : "Singles"}</button><button className={format === "doubles" ? "active" : ""} onClick={() => setFormat("doubles")}>{locale === "zh-Hant" ? "雙打" : "Doubles"}</button></div></div>{inline && <fieldset className="battle-category-toggles"><legend>{locale === "zh-Hant" ? "顯示的當季排名" : "Current-season rankings to show"}</legend>{categoryOrder.map((category) => <label key={category}><input type="checkbox" checked={visibleBattleCategories.includes(category)} onChange={() => setVisibleBattleCategories((current) => current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category])} /><span>{categoryLabels[category]?.[locale === "zh-Hant" ? 1 : 0] ?? category}</span></label>)}</fieldset>}{sharesBaseBattleData && <p className="data-scope-note">{copy.note}</p>}{error ? <p className="form-error">{error}</p> : battle ? <BattlePanel usage={format === "singles" ? battle.singles : battle.doubles} locale={locale} visibleCategories={visibleBattleCategories} /> : <p className="detail-empty">{copy.loading}</p>}</div></>;
  const reverseDialog = reverseSelection ? <PokemonUsersDialog key={`move-${reverseSelection.id}`} selection={reverseSelection} locale={locale} onClose={() => setReverseSelection(null)} onScrapbook={onScrapbook ?? (() => undefined)} /> : null;
  if (inline) return <><section className="pokemon-detail scrapbook-inline-detail" aria-labelledby={titleId}>{content}</section>{reverseDialog}</>;
  return <><div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><section className="pokemon-detail" role="dialog" aria-modal="true" aria-labelledby={titleId}><button className="close-button" onClick={onClose} aria-label={copy.close}>×</button>{content}</section></div>{reverseDialog}</>;
}

function bumpyMoveSort(left: Move, right: Move) {
  return right.priority - left.priority
    || [...left.flags].sort().join(" ").localeCompare([...right.flags].sort().join(" "))
    || left.target.localeCompare(right.target)
    || left.name.localeCompare(right.name);
}
