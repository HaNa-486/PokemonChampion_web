"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { abilities, abilityById, battleDataKeyForPokemon, battleDataSourcePokemon, catalogSnapshotDate, itemById, items, megaBasePokemonIdByStoneId, megaPokemonByStoneId, megaStoneIdByPokemonId, megaStoneMatchesPokemon, moveById, moves, pokemon, pokemonById } from "../lib/catalog";
import { rankedAbilityChoices, rankedApChoices, rankedItemChoices, rankedMoveChoices, rankedNatureChoices, recommendedAbilityId, recommendedAp, recommendedItemId, recommendedMoveIds, recommendedNature, type RankedChoice } from "../lib/battle-recommendations";
import { apTotal, calculateFinalStats, formatPriority, NATURES, NEUTRAL_NATURE, priorityMatches, validateTeam, ZERO_STATS } from "../lib/domain";
import { useTeamStore } from "../lib/team-store";
import { useScrapbookStore, type ScrapbookEntry } from "../lib/scrapbook-store";
import { localizedTerm, localizedTerms } from "../lib/localization";
import { itemEffectCategories } from "../lib/filtering";
import { useDialogEscape } from "../lib/use-dialog-escape";
import type { BattleFormat, BattleUsage, Move, Nature, Pokemon, Stats, TeamMember } from "../lib/types";
import { MoveDatabaseV2, PokemonTableV2, ResourceDatabaseV2 } from "./DatabaseViews";
import { AddToScrapbookDialog } from "./AddToScrapbookDialog";
import { InfoTooltip } from "./InfoTooltip";
import { ItemDisplay, ItemTooltip } from "./ItemDisplay";
import { TypeBadge } from "./TypeBadge";
import { TypeChart } from "./TypeChartView";
import { TypeMatchups } from "./TypeMatchups";
import { ThemeToggle, useThemePreference } from "./ThemeToggle";
import { ScrapbookView } from "./ScrapbookView";

type Locale = "en" | "zh-Hant";
type View = "pokemon" | "scrapbook" | "moves" | "abilities" | "items" | "types";
type PriorityClass = "positive" | "zero" | "negative";
type DisplayMode = "detailed" | "compact";
type BuilderDisplayModes = Record<"move" | "ability" | "item", DisplayMode>;

const BUILDER_DISPLAY_KEY = "champions-lab-builder-display-v1";
const LOCALE_STORAGE_KEY = "champions-lab-locale-v1";
const ITEM_GROUP_ORDER = ["Common", "Mega Stone", "HP Recovery", "Status Cure", "PP Recovery", "Damage Halving", "Other"];
const defaultDisplayModes: BuilderDisplayModes = { move: "detailed", ability: "detailed", item: "detailed" };

const labels = {
  en: { pokemon: "Pokémon DB", scrapbook: "Scrapbooks", moves: "Move DB", abilities: "Ability DB", items: "Held Item DB", types: "Type Chart", search: "Search Pokémon or type…", current: "Regulation M-4 · Current", add: "Build & add", save: "Save changes", edit: "Edit", team: "Selected team", empty: "Choose a Pokémon to start building.", data: "Battle data updated", stale: "cached snapshot", doubles: "Doubles", singles: "Singles" },
  "zh-Hant": { pokemon: "寶可夢資料庫", scrapbook: "畫本", moves: "招式資料庫", abilities: "特性資料庫", items: "持有物資料庫", types: "屬性相剋", search: "搜尋寶可夢或屬性…", current: "規則 M-4 · 當前", add: "配置並加入", save: "儲存變更", edit: "編輯", team: "已選隊伍", empty: "選擇一隻寶可夢開始配置。", data: "對戰資料更新", stale: "快取資料", doubles: "雙打", singles: "單打" },
};

type DataStatusResponse = { data?: { snapshotDate?: string; stale?: boolean } };

function DataFreshness({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<{ snapshotDate: string; stale: boolean }>({ snapshotDate: catalogSnapshotDate, stale: true });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/data-status")
      .then(async (response) => response.ok ? response.json() as Promise<DataStatusResponse> : Promise.reject(new Error("Data status unavailable")))
      .then((body) => {
        if (!cancelled && body.data?.snapshotDate) setStatus({ snapshotDate: body.data.snapshotDate, stale: Boolean(body.data.stale) });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  return <span>{labels[locale].data}: {status.snapshotDate}{status.stale ? ` (${labels[locale].stale})` : ""}</span>;
}

const statLabels: Record<keyof Stats, string> = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const natureStatLabels = { en: statLabels, "zh-Hant": { hp: "HP", attack: "攻擊", defense: "防禦", specialAttack: "特攻", specialDefense: "特防", speed: "速度" } };

function localName(entry: { name: string; nameZh: string }, locale: Locale) { return locale === "zh-Hant" ? entry.nameZh : entry.name; }

function natureLabel(nature: Nature, locale: Locale) {
  const name = locale === "zh-Hant" ? nature.nameZh ?? nature.name : nature.name;
  if (!nature.up || !nature.down) return `${name} (${locale === "zh-Hant" ? "能力值不變" : "No stat change"})`;
  return `${name} (${natureStatLabels[locale][nature.up]} ↑ / ${natureStatLabels[locale][nature.down]} ↓)`;
}


function MoveTooltip({ move, locale }: { move: Move; locale: Locale }) {
  return <InfoTooltip label={localName(move, locale)}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} locale={locale} /><span>{localizedTerm(move.category, locale)}</span><span>{localizedTerm("Priority", locale)} {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>{localizedTerm("Power", locale)} {move.power ?? "—"}</span><span>{localizedTerm("Acc.", locale)} {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>;
}

function AbilityTooltip({ id, locale }: { id: string; locale: Locale }) {
  const ability = abilityById.get(id);
  if (!ability) return <span>—</span>;
  return <InfoTooltip label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip>;
}

const builderMoveCategoryOrder: Record<Move["category"], number> = { Physical: 0, Special: 1, Status: 2 };

type ResourcePickerOption = {
  id: string;
  name: string;
  searchText: string;
  description: string;
  meta?: ReactNode;
  icon?: ReactNode;
  group?: string;
  rank?: number;
};

function ResourcePicker({ label, value, options, locale, detailed, onChange }: {
  label: string;
  value: string | null;
  options: ResourcePickerOption[];
  locale: Locale;
  detailed: boolean;
  onChange: (value: string | null) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeValue, setActiveValue] = useState(value ?? "__clear__");
  const current = options.find((option) => option.id === value) ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = normalizedQuery ? options.filter((option) => option.searchText.toLocaleLowerCase(locale).includes(normalizedQuery)) : options;
  const navigableValues = ["__clear__", ...filtered.map((option) => option.id)];
  const close = () => { setOpen(false); setQuery(""); };
  const openMenu = () => { setOpen(true); setActiveValue(value && navigableValues.includes(value) ? value : navigableValues[0] ?? "__clear__"); };
  const choose = (nextValue: string | null) => { onChange(nextValue); close(); queueMicrotask(() => inputRef.current?.focus()); };
  const moveActive = (direction: 1 | -1) => {
    const currentIndex = navigableValues.indexOf(activeValue);
    const startIndex = currentIndex < 0 ? (direction > 0 ? -1 : 0) : currentIndex;
    setActiveValue(navigableValues[(startIndex + direction + navigableValues.length) % navigableValues.length] ?? "__clear__");
  };
  useEffect(() => {
    if (!open) return;
    const activeOption = document.getElementById(`${listId}-option-${activeValue}`);
    if (activeOption && typeof activeOption.scrollIntoView === "function") activeOption.scrollIntoView({ block: "nearest" });
  }, [activeValue, listId, open]);
  return <div className="resource-picker-field" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    <label htmlFor={`${listId}-input`}>{label}</label>
    <div className={`resource-combobox ${open ? "open" : ""}`}>
      {!open && current?.icon}
      <input id={`${listId}-input`} ref={inputRef} role="combobox" aria-label={label} aria-expanded={open} aria-controls={listId} aria-activedescendant={open ? `${listId}-option-${activeValue}` : undefined} aria-autocomplete="list" autoComplete="off" value={open ? query : current?.name ?? ""} placeholder={locale === "zh-Hant" ? "輸入名稱或效果搜尋…" : "Search name or effect…"} onFocus={() => { openMenu(); setQuery(""); }} onChange={(event) => { setOpen(true); setQuery(event.target.value); setActiveValue("__clear__"); }} onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); close(); }
        else if (event.key === "ArrowDown") { event.preventDefault(); if (open) moveActive(1); else openMenu(); }
        else if (event.key === "ArrowUp") { event.preventDefault(); if (open) moveActive(-1); else openMenu(); }
        else if (event.key === "Home" && open) { event.preventDefault(); setActiveValue(navigableValues[0] ?? "__clear__"); }
        else if (event.key === "End" && open) { event.preventDefault(); setActiveValue(navigableValues.at(-1) ?? "__clear__"); }
        else if (event.key === "Enter" && open) { event.preventDefault(); if (navigableValues.includes(activeValue)) choose(activeValue === "__clear__" ? null : activeValue); }
      }} />
      <button type="button" className="move-picker-toggle" aria-label={locale === "zh-Hant" ? `開啟${label}選單` : `Open ${label} menu`} onClick={() => { if (open) close(); else openMenu(); inputRef.current?.focus(); }}>⌄</button>
    </div>
    {open && <div className="resource-picker-popover"><div id={listId} role="listbox" aria-label={`${label} options`} className="resource-picker-options">
      <button id={`${listId}-option-__clear__`} type="button" role="option" aria-selected={!value} className={`resource-option clear-option ${activeValue === "__clear__" ? "active" : ""}`} onMouseEnter={() => setActiveValue("__clear__")} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(null)}>{locale === "zh-Hant" ? "— 不選擇" : "— None"}</button>
      {filtered.map((option, index) => {
        const showGroup = Boolean(option.group && option.group !== filtered[index - 1]?.group);
        return <div className="resource-option-wrap" key={option.id}>{showGroup && <div className="resource-option-group">{option.group === "Common" ? (locale === "zh-Hant" ? "當季常用前十" : "Current top 10") : localizedTerm(option.group!, locale)}</div>}<button id={`${listId}-option-${option.id}`} type="button" role="option" aria-selected={option.id === value} className={`resource-option ${activeValue === option.id ? "active" : ""}`} onMouseEnter={() => setActiveValue(option.id)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option.id)}><span className="resource-option-heading">{option.icon}<strong>{option.name}</strong>{option.rank && <em>{locale === "zh-Hant" ? `常用 #${option.rank}` : `Common #${option.rank}`}</em>}</span>{option.meta && <span className="resource-option-meta">{option.meta}</span>}{detailed && <span className="resource-option-description">{option.description}</span>}</button></div>;
      })}
      {!filtered.length && <p className="move-picker-empty">{locale === "zh-Hant" ? "找不到符合的選項。" : "No matching option."}</p>}
    </div></div>}
  </div>;
}

function MovePicker({ slot, value, legalMoveIds, selectedMoveIds, commonMoves, locale, detailed, onChange }: {
  slot: number;
  value: string | null;
  legalMoveIds: string[];
  selectedMoveIds: string[];
  commonMoves: RankedChoice[];
  locale: Locale;
  detailed: boolean;
  onChange: (moveId: string | null) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeValue, setActiveValue] = useState<string>(value ?? "__clear__");
  const current = value ? moveById.get(value) ?? null : null;
  const commonRank = useMemo(() => new Map(commonMoves.map((choice) => [choice.id, choice.rank])), [commonMoves]);
  const availableMoves = useMemo(() => legalMoveIds
    .map((id) => moveById.get(id))
    .filter((move): move is Move => Boolean(move))
    .sort((a, b) => {
      const commonDifference = (commonRank.get(a.id) ?? 999) - (commonRank.get(b.id) ?? 999);
      if (commonDifference) return commonDifference;
      return builderMoveCategoryOrder[a.category] - builderMoveCategoryOrder[b.category]
        || a.type.localeCompare(b.type)
        || b.priority - a.priority
        || localName(a, locale).localeCompare(localName(b, locale));
    }), [commonRank, legalMoveIds, locale]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filteredMoves = normalizedQuery ? availableMoves.filter((move) => `${move.name} ${move.nameZh} ${move.type} ${move.category} ${move.description} ${move.descriptionZh}`.toLocaleLowerCase(locale).includes(normalizedQuery)) : availableMoves;
  const navigableValues = ["__clear__", ...filteredMoves.filter((move) => !selectedMoveIds.includes(move.id) || move.id === value).map((move) => move.id)];
  const fieldLabel = locale === "zh-Hant" ? `招式 ${slot + 1}` : `Move ${slot + 1}`;
  useEffect(() => {
    if (!open) return;
    const activeOption = document.getElementById(`${listId}-option-${activeValue}`);
    if (activeOption && "scrollIntoView" in activeOption) activeOption.scrollIntoView({ block: "nearest" });
  }, [activeValue, listId, open]);
  const close = () => { setOpen(false); setQuery(""); };
  const openMenu = () => {
    setOpen(true);
    setActiveValue((value && navigableValues.includes(value)) ? value : navigableValues[0] ?? "__clear__");
  };
  const chooseActive = () => {
    if (activeValue === "__clear__") onChange(null);
    else if (navigableValues.includes(activeValue)) onChange(activeValue);
    close();
  };
  const moveActive = (direction: 1 | -1) => {
    const currentIndex = navigableValues.indexOf(activeValue);
    const startIndex = currentIndex < 0 ? (direction > 0 ? -1 : 0) : currentIndex;
    const nextIndex = (startIndex + direction + navigableValues.length) % navigableValues.length;
    setActiveValue(navigableValues[nextIndex] ?? "__clear__");
  };
  return <div className="move-picker-field" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    <label htmlFor={`${listId}-input`}>{fieldLabel}</label>
    <div className={`move-combobox ${open ? "open" : ""}`}>
      {current && !open && <TypeBadge type={current.type} locale={locale} />}
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-label={fieldLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeValue}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        data-move-id={value ?? ""}
        value={open ? query : current ? localName(current, locale) : ""}
        placeholder={locale === "zh-Hant" ? "輸入名稱或效果搜尋…" : "Search name or effect…"}
        ref={inputRef}
        onFocus={() => { openMenu(); setQuery(""); }}
        onChange={(event) => { setOpen(true); setQuery(event.target.value); setActiveValue("__clear__"); }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) { event.preventDefault(); close(); }
          else if (event.key === "ArrowDown") { event.preventDefault(); if (open) moveActive(1); else openMenu(); }
          else if (event.key === "ArrowUp") { event.preventDefault(); if (open) moveActive(-1); else openMenu(); }
          else if (event.key === "Home" && open) { event.preventDefault(); setActiveValue(navigableValues[0] ?? "__clear__"); }
          else if (event.key === "End" && open) { event.preventDefault(); setActiveValue(navigableValues.at(-1) ?? "__clear__"); }
          else if (event.key === "Enter" && open) { event.preventDefault(); chooseActive(); }
        }}
      />
      <button type="button" className="move-picker-toggle" aria-label={locale === "zh-Hant" ? `開啟${fieldLabel}選單` : `Open ${fieldLabel} menu`} onClick={() => { if (open) close(); else openMenu(); inputRef.current?.focus(); }}>⌄</button>
    </div>
    {open && <div className="move-picker-popover">
      {detailed && <div className="move-picker-help">{locale === "zh-Hant" ? "常用招式優先；可搜尋名稱或效果。" : "Common moves first. Search by name or effect."}</div>}
      <div id={listId} role="listbox" aria-label={`${fieldLabel} options`} className="move-picker-options">
        <button id={`${listId}-option-__clear__`} type="button" role="option" aria-selected={!value} className={`move-option clear-option ${activeValue === "__clear__" ? "active" : ""}`} onMouseEnter={() => setActiveValue("__clear__")} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(null); close(); inputRef.current?.focus(); }}>
          {locale === "zh-Hant" ? "— 清除此欄" : "— Clear this slot"}
        </button>
        {filteredMoves.map((move) => {
          const selectedElsewhere = selectedMoveIds.includes(move.id) && move.id !== value;
          const rank = commonRank.get(move.id);
          return <button id={`${listId}-option-${move.id}`} type="button" role="option" aria-selected={move.id === value} disabled={selectedElsewhere} className={`move-option ${activeValue === move.id ? "active" : ""}`} key={move.id} onMouseEnter={() => { if (!selectedElsewhere) setActiveValue(move.id); }} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(move.id); close(); inputRef.current?.focus(); }}>
            <span className="move-option-heading"><TypeBadge type={move.type} locale={locale} /><strong>{localName(move, locale)}</strong>{rank && <em>{locale === "zh-Hant" ? `常用 #${rank}` : `Common #${rank}`}</em>}</span>
            {detailed && <><span className="move-option-meta">{localizedTerm(move.category, locale)} · {localizedTerm("Power", locale)} {move.power ?? "—"} · {localizedTerm("Acc.", locale)} {move.accuracy ?? "—"} · PP {move.pp} · {localizedTerm("Priority", locale)} {formatPriority(move.priority)}</span><span className="move-option-description">{locale === "zh-Hant" ? move.descriptionZh : move.description}</span></>}
            {selectedElsewhere && <span className="move-option-used">{locale === "zh-Hant" ? "已選在其他欄位" : "Already selected"}</span>}
          </button>;
        })}
        {!filteredMoves.length && <p className="move-picker-empty">{locale === "zh-Hant" ? "找不到符合的可學招式。" : "No learnable move matches."}</p>}
      </div>
    </div>}
  </div>;
}

function PokemonTable({ locale, format, onSelect }: { locale: Locale; format: "singles" | "doubles"; onSelect: (entry: Pokemon) => void }) {
  const [query, setQuery] = useState("");
  const allMatches = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const filtered = allMatches.slice(0, 100);
  return <section className="panel catalog-panel"><div className="panel-head"><div><p className="eyebrow">CURRENT REGULATION</p><h1>{labels[locale].pokemon}</h1><p>{allMatches.length} legal forms · showing {filtered.length} · {labels[locale].data}</p></div><label className="search-field"><span className="sr-only">Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels[locale].search} /></label></div><div className="table-scroll"><table><thead><tr><th>Rank</th><th>Pokémon</th><th>Type</th>{Object.values(statLabels).map((label) => <th key={label}>{label}</th>)}<th>Ability</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td className="rank">#{format === "doubles" ? entry.usageDoubles : entry.usageSingles}</td><td><div className="pokemon-name"><img src={entry.imageUrl} alt="" width="54" height="54" loading="lazy" /><div><strong>{localName(entry, locale)}</strong>{entry.isMega && <small>Mega</small>}</div></div></td><td><div className="badge-row">{entry.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></td>{Object.entries(entry.baseStats).map(([key, value]) => <td key={key} className={key === "speed" ? "stat-accent" : "stat-cell"}>{value}</td>)}<td><div className="ability-list">{entry.abilityIds.length ? entry.abilityIds.map((id) => <AbilityTooltip id={id} locale={locale} key={id} />) : "—"}</div></td><td><button className="add-button" onClick={() => onSelect(entry)} aria-label={`Configure ${entry.name}`}>+</button></td></tr>)}</tbody></table></div></section>;
}

export function MoveDatabase({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<PriorityClass[]>([]);
  const toggle = (value: PriorityClass) => setClasses((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  const allMatches = moves.filter((move) => `${move.name} ${move.nameZh}`.toLowerCase().includes(query.toLowerCase()) && priorityMatches(move, classes));
  const filtered = allMatches.slice(0, 100);
  return <section className="panel"><div className="panel-head moves-head"><div><p className="eyebrow">MOVE INTELLIGENCE</p><h1>{labels[locale].moves}</h1><p>{filtered.length} / {moves.length} moves</p></div><input className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋招式…" : "Search moves…"} /></div><div className="filter-bar" aria-label="Priority filters"><span>{localizedTerm("Priority", locale)}</span>{(["positive", "zero", "negative"] as const).map((value) => { const label = value === "positive" ? "+ Positive" : value === "zero" ? "0 Neutral" : "− Negative"; return <button key={value} onClick={() => toggle(value)} aria-pressed={classes.includes(value)} className={`filter-chip priority-${value}`}>{localizedTerm(label, locale)}</button>; })}</div><div className="table-scroll"><table><thead><tr>{["Move", "Type", "Class", "Power", "Acc.", "PP", "Priority", "Target", "Properties"].map((label) => <th key={label}>{localizedTerm(label, locale)}</th>)}</tr></thead><tbody>{filtered.map((move) => <tr key={move.id}><td><MoveTooltip move={move} locale={locale} /></td><td><TypeBadge type={move.type} locale={locale} /></td><td>{localizedTerm(move.category, locale)}</td><td>{move.power ?? "—"}</td><td>{move.accuracy ?? "—"}</td><td>{move.pp}</td><td><span className={`priority-value priority-${move.priority > 0 ? "positive" : move.priority < 0 ? "negative" : "zero"}`}>{formatPriority(move.priority)}</span></td><td>{localizedTerm(move.target, locale)}</td><td>{move.flags.length ? localizedTerms(move.flags, locale) : "—"}</td></tr>)}</tbody></table></div></section>;
}

function ResourceDatabase({ kind, locale }: { kind: "abilities" | "items"; locale: Locale }) {
  const [query, setQuery] = useState("");
  const entries = kind === "abilities" ? abilities : items;
  const filtered = entries.filter((entry) => `${entry.name} ${entry.nameZh} ${"category" in entry && typeof entry.category === "string" ? entry.category : ""}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">REFERENCE LIBRARY</p><h1>{labels[locale][kind]}</h1><p>{filtered.length} {kind}</p></div><input className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? `搜尋${kind === "abilities" ? "特性" : "持有物"}…` : `Search ${kind}…`} /></div><div className="resource-grid">{filtered.map((entry) => <article className="resource-card" key={entry.id}><div><span className="resource-kind">{"category" in entry && typeof entry.category === "string" ? entry.category : "Ability"}</span><h2>{kind === "abilities" ? <AbilityTooltip id={entry.id} locale={locale} /> : <ItemTooltip item={itemById.get(entry.id)} locale={locale} />}</h2></div><p>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</p></article>)}</div></section>;
}

function BuildEditor({ selected, editingMember, mode, locale, format, onFormatChange, onClose, onDraftChange }: { selected: Pokemon | null; editingMember: TeamMember | null; mode: "team" | "scrapbook"; locale: Locale; format: BattleFormat; onFormatChange: (format: BattleFormat) => void; onClose: () => void; onDraftChange?: (member: Omit<TeamMember, "id">) => void }) {
  return selected ? <BuildEditorContent key={`${mode}:${selected.id}:${editingMember?.id ?? "new"}`} selected={selected} editingMember={editingMember} mode={mode} locale={locale} format={format} onFormatChange={onFormatChange} onClose={onClose} onDraftChange={onDraftChange} /> : null;
}

type BattleApiResponse = { data: { singles: BattleUsage | null; doubles: BattleUsage | null } };

const sameAp = (left: Stats, right: Stats) => (Object.keys(left) as Array<keyof Stats>).every((stat) => left[stat] === right[stat]);
const apChoiceLabel = (choice: ReturnType<typeof rankedApChoices>[number], locale: Locale) => {
  const stats = locale === "zh-Hant"
    ? [["HP", choice.ap.hp], ["攻擊", choice.ap.attack], ["防禦", choice.ap.defense], ["特攻", choice.ap.specialAttack], ["特防", choice.ap.specialDefense], ["速度", choice.ap.speed]]
    : [["HP", choice.ap.hp], ["Atk", choice.ap.attack], ["Def", choice.ap.defense], ["SpA", choice.ap.specialAttack], ["SpD", choice.ap.specialDefense], ["Spe", choice.ap.speed]];
  return `${locale === "zh-Hant" ? "常用" : "Common"} #${choice.rank} · ${stats.map(([label, value]) => `${label} ${value}`).join(" / ")} · ${choice.percentage || "—"}`;
};

function BuildEditorContent({ selected, editingMember, mode, locale, format, onFormatChange: setAppFormat, onClose, onDraftChange }: { selected: Pokemon; editingMember: TeamMember | null; mode: "team" | "scrapbook"; locale: Locale; format: BattleFormat; onFormatChange: (format: BattleFormat) => void; onClose: () => void; onDraftChange?: (member: Omit<TeamMember, "id">) => void }) {
  useDialogEscape(onClose);
  const members = useTeamStore((state) => state.teams[format]);
  const add = useTeamStore((state) => state.add);
  const update = useTeamStore((state) => state.update);
  const isEditingTeam = mode === "team" && Boolean(editingMember);
  const [moveIds, setMoveIds] = useState<string[]>(editingMember ? editingMember.moveIds.slice(0, 4) : selected.moveIds.slice(0, 4));
  const [abilityId, setAbilityId] = useState<string | null>(editingMember ? editingMember.abilityId : selected.abilityIds[0] ?? null);
  const requiredMegaStoneId = megaStoneIdByPokemonId.get(selected.id) ?? null;
  const baseSelected = useMemo(() => {
    if (!selected.isMega || !requiredMegaStoneId) return selected;
    return pokemonById.get(megaBasePokemonIdByStoneId.get(requiredMegaStoneId) ?? "") ?? selected;
  }, [requiredMegaStoneId, selected]);
  const [itemId, rawSetItemId] = useState<string | null>(editingMember ? editingMember.itemId : requiredMegaStoneId ?? null);
  const [battleDataByKey, setBattleDataByKey] = useState<Record<string, BattleApiResponse["data"]>>({});
  const battleDataCacheRef = useRef(new Map<string, BattleApiResponse["data"]>());
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const formatRef = useRef(format);
  const [ap, setAp] = useState<Stats>(editingMember ? { ...editingMember.ap } : { ...ZERO_STATS });
  const [apPresetRank, setApPresetRank] = useState<number | null>(null);
  const [nature, setNature] = useState<Nature>(editingMember?.nature ?? NEUTRAL_NATURE);
  const [error, setError] = useState("");
  const [displayModes, setDisplayModes] = useState<BuilderDisplayModes>(defaultDisplayModes);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BUILDER_DISPLAY_KEY) ?? "null") as Partial<BuilderDisplayModes> | null;
      // Browser-only preference hydration must run after the server-rendered default.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setDisplayModes({
        move: saved.move === "compact" ? "compact" : "detailed",
        ability: saved.ability === "compact" ? "compact" : "detailed",
        item: saved.item === "compact" ? "compact" : "detailed",
      });
    } catch { /* Ignore malformed local preferences. */ }
  }, []);
  const changeDisplayMode = (kind: keyof BuilderDisplayModes, mode: DisplayMode) => setDisplayModes((current) => {
    const next = { ...current, [kind]: mode };
    localStorage.setItem(BUILDER_DISPLAY_KEY, JSON.stringify(next));
    return next;
  });
  const effectiveSelected = useMemo(() => {
    if (mode === "scrapbook" && selected.isMega && itemId === null) return selected;
    const mega = itemId ? megaPokemonByStoneId.get(itemId) : null;
    return mega && megaStoneMatchesPokemon(itemId!, baseSelected.id) ? mega : baseSelected;
  }, [baseSelected, itemId, mode, selected]);
  const battleDataKey = battleDataKeyForPokemon(effectiveSelected);
  const battleData = battleDataByKey[battleDataKey] ?? null;
  const initialRecommendationAppliedRef = useRef(Boolean(editingMember));
  const pendingFormHydrationRef = useRef<{ key: string; pokemon: Pokemon; replaceAbility: boolean } | null>(null);
  const usage = battleData?.[format] ?? null;
  const commonMoves = useMemo(() => rankedMoveChoices(usage, effectiveSelected, 10), [effectiveSelected, usage]);
  const commonAbilities = useMemo(() => rankedAbilityChoices(usage, effectiveSelected, 10), [effectiveSelected, usage]);
  const commonItems = useMemo(() => rankedItemChoices(usage, 10), [usage]);
  const commonNatures = useMemo(() => rankedNatureChoices(usage, 10), [usage]);
  const commonApChoices = useMemo(() => rankedApChoices(usage, 10), [usage]);
  const finalStats = calculateFinalStats(effectiveSelected.baseStats, ap, nature);
  const remaining = 66 - apTotal(ap);
  const applyRecommendations = (nextFormat: BattleFormat, data: BattleApiResponse["data"] | null, chosenItem?: string | null) => {
    const nextUsage = data?.[nextFormat] ?? null;
    const nextItem = chosenItem === undefined ? requiredMegaStoneId ?? recommendedItemId(nextUsage) : chosenItem;
    const mega = nextItem ? megaPokemonByStoneId.get(nextItem) : null;
    const target = mega && megaStoneMatchesPokemon(nextItem!, baseSelected.id) ? mega : baseSelected;
    const suggestedMoves = recommendedMoveIds(nextUsage, target);
    rawSetItemId(nextItem);
    setMoveIds((suggestedMoves.length ? suggestedMoves : target.moveIds).slice(0, 4));
    setAbilityId(recommendedAbilityId(nextUsage, target) ?? target.abilityIds[0] ?? null);
    if (chosenItem === undefined) {
      setNature(recommendedNature(nextUsage) ?? NEUTRAL_NATURE);
      setAp(recommendedAp(nextUsage) ?? { ...ZERO_STATS });
      setApPresetRank(rankedApChoices(nextUsage, 10)[0]?.rank ?? null);
    }
  };
  const changeFormat = (nextFormat: BattleFormat) => {
    setAppFormat(nextFormat);
    if (mode === "scrapbook") return;
    applyRecommendations(nextFormat, battleData);
  };
  const changeItem = (nextItem: string | null) => {
    const nextMega = nextItem ? megaPokemonByStoneId.get(nextItem) : null;
    const nextSelected = nextMega && megaStoneMatchesPokemon(nextItem!, baseSelected.id) ? nextMega : baseSelected;
    rawSetItemId(nextItem);
    if (nextSelected.id === effectiveSelected.id) return;
    const nextUsage = battleData?.[format] ?? null;
    const legalMoves = new Set(nextSelected.moveIds);
    if (mode === "scrapbook") {
      setMoveIds((current) => current.map((id) => legalMoves.has(id) ? id : ""));
      if (abilityId && !nextSelected.abilityIds.includes(abilityId)) setAbilityId(null);
      pendingFormHydrationRef.current = null;
      return;
    }
    const retainedMoves = moveIds.filter((id) => legalMoves.has(id));
    const replaceAbility = !abilityId || !nextSelected.abilityIds.includes(abilityId);
    const nextBattleDataKey = battleDataKeyForPokemon(nextSelected);
    if (nextBattleDataKey !== battleDataKey) {
      setRecommendationsLoading(true);
      pendingFormHydrationRef.current = { key: nextBattleDataKey, pokemon: nextSelected, replaceAbility };
      setMoveIds(retainedMoves.slice(0, 4));
      if (replaceAbility) setAbilityId(nextSelected.abilityIds[0] ?? null);
      return;
    }
    const fallbackMoves = recommendedMoveIds(nextUsage, nextSelected).filter((id) => !retainedMoves.includes(id));
    setMoveIds([...retainedMoves, ...fallbackMoves].slice(0, 4));
    if (replaceAbility) {
      setAbilityId(recommendedAbilityId(nextUsage, nextSelected) ?? nextSelected.abilityIds[0] ?? null);
    }
  };
  const onFormatChange = changeFormat;
  const setItemId = changeItem;

  const familyStoneIds = useMemo(() => pokemon
    .filter((entry) => entry.speciesKey === selected.speciesKey && entry.isMega)
    .map((entry) => megaStoneIdByPokemonId.get(entry.id))
    .filter((id): id is string => Boolean(id)), [selected.speciesKey]);
  const commonItemRank = useMemo(() => new Map(commonItems.map((choice) => [choice.id, choice.rank])), [commonItems]);
  const selectableItems = useMemo(() => [...items].sort((left, right) => {
    const usageDifference = (commonItemRank.get(left.id) ?? 999) - (commonItemRank.get(right.id) ?? 999);
    if (usageDifference) return usageDifference;
    const leftGroup = left.category === "Mega Stone" ? "Mega Stone" : itemEffectCategories(left)[0] ?? "Other";
    const rightGroup = right.category === "Mega Stone" ? "Mega Stone" : itemEffectCategories(right)[0] ?? "Other";
    const leftDedicated = familyStoneIds.indexOf(left.id);
    const rightDedicated = familyStoneIds.indexOf(right.id);
    if (leftGroup === "Mega Stone" && rightGroup === "Mega Stone" && (leftDedicated >= 0 || rightDedicated >= 0)) {
      if (leftDedicated < 0) return 1;
      if (rightDedicated < 0) return -1;
      if (leftDedicated !== rightDedicated) return leftDedicated - rightDedicated;
    }
    return ITEM_GROUP_ORDER.indexOf(leftGroup) - ITEM_GROUP_ORDER.indexOf(rightGroup) || localName(left, locale).localeCompare(localName(right, locale));
  }), [commonItemRank, familyStoneIds, locale]);
  const commonAbilityRank = useMemo(() => new Map(commonAbilities.map((choice) => [choice.id, choice.rank])), [commonAbilities]);
  const abilityOptions = useMemo<ResourcePickerOption[]>(() => effectiveSelected.abilityIds
    .map((id) => abilityById.get(id)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => (commonAbilityRank.get(left.id) ?? 999) - (commonAbilityRank.get(right.id) ?? 999) || localName(left, locale).localeCompare(localName(right, locale)))
    .map((entry) => ({ id: entry.id, name: localName(entry, locale), searchText: `${entry.name} ${entry.nameZh} ${entry.description} ${entry.descriptionZh}`, description: locale === "zh-Hant" ? entry.descriptionZh : entry.description, rank: commonAbilityRank.get(entry.id) })), [commonAbilityRank, effectiveSelected.abilityIds, locale]);
  const itemOptions = useMemo<ResourcePickerOption[]>(() => selectableItems.map((item) => ({
    id: item.id,
    name: localName(item, locale),
    searchText: `${item.name} ${item.nameZh} ${item.description} ${item.descriptionZh}`,
    description: locale === "zh-Hant" ? item.descriptionZh : item.description,
    icon: item.imageUrl ? <img className="item-icon" src={item.imageUrl} alt="" width="24" height="24" /> : null,
    meta: localizedTerm(item.category, locale),
    group: commonItemRank.has(item.id) ? "Common" : item.category === "Mega Stone" ? "Mega Stone" : itemEffectCategories(item)[0] ?? "Other",
    rank: commonItemRank.get(item.id),
  })), [commonItemRank, locale, selectableItems]);
  const commonNatureRank = useMemo(() => new Map(commonNatures.map((choice) => [choice.nature.name, choice.rank])), [commonNatures]);
  const selectableNatures = useMemo(() => [...NATURES].sort((left, right) => (commonNatureRank.get(left.name) ?? 999) - (commonNatureRank.get(right.name) ?? 999) || natureLabel(left, locale).localeCompare(natureLabel(right, locale))), [commonNatureRank, locale]);

  useEffect(() => { formatRef.current = format; }, [format]);

  useEffect(() => {
    let cancelled = false;
    const requestedPokemon = battleDataSourcePokemon(effectiveSelected);
    const requestedKey = battleDataKey;
    const applyBattleData = (data: BattleApiResponse["data"] | null) => {
      if (cancelled) return;
      if (data) {
        battleDataCacheRef.current.set(requestedKey, data);
        setBattleDataByKey((current) => current[requestedKey] === data ? current : { ...current, [requestedKey]: data });
      }
      const pending = pendingFormHydrationRef.current;
      if (pending?.key === requestedKey) {
        pendingFormHydrationRef.current = null;
        const nextUsage = data?.[formatRef.current] ?? null;
        setMoveIds((current) => {
          const retained = current.filter((id) => pending.pokemon.moveIds.includes(id));
          const fallback = recommendedMoveIds(nextUsage, pending.pokemon).filter((id) => !retained.includes(id));
          return [...retained, ...fallback].slice(0, 4);
        });
        if (pending.replaceAbility) setAbilityId(recommendedAbilityId(nextUsage, pending.pokemon) ?? pending.pokemon.abilityIds[0] ?? null);
      }
      if (!initialRecommendationAppliedRef.current && !editingMember) {
        initialRecommendationAppliedRef.current = true;
        applyRecommendations(formatRef.current, data);
      } else if (editingMember) {
        setApPresetRank(rankedApChoices(data?.[formatRef.current] ?? null, 10).find((choice) => sameAp(choice.ap, editingMember.ap))?.rank ?? null);
      }
    };
    const cached = battleDataCacheRef.current.get(requestedKey);
    if (cached) {
      queueMicrotask(() => { applyBattleData(cached); if (!cancelled) setRecommendationsLoading(false); });
      return () => { cancelled = true; };
    }
    fetch(`/api/v1/pokemon/battle?pokemonId=${encodeURIComponent(requestedPokemon.id)}`)
      .then(async (response) => response.ok ? response.json() as Promise<BattleApiResponse> : Promise.reject(new Error("Battle data unavailable")))
      .then((response) => applyBattleData(response.data))
      .catch(() => applyBattleData(null))
      .finally(() => { if (!cancelled) setRecommendationsLoading(false); });
    return () => { cancelled = true; };
    // Battle recommendations are keyed by the upstream source, so shared base/Mega data is reused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleDataKey, editingMember]);
  useEffect(() => {
    if (mode === "scrapbook" && editingMember && onDraftChange) onDraftChange({ pokemonId: effectiveSelected.id, moveIds, abilityId, itemId, ap, nature });
  }, [abilityId, ap, editingMember, effectiveSelected.id, itemId, mode, moveIds, nature, onDraftChange]);
  const submitTeam = () => {
    if (!isEditingTeam && members.length >= 6) { setError(locale === "zh-Hant" ? "隊伍已滿，請先移除一名成員。" : "Team is full. Remove a member first."); return; }
    const candidate: TeamMember = { id: isEditingTeam ? editingMember!.id : crypto.randomUUID(), pokemonId: effectiveSelected.id, moveIds: mode === "scrapbook" ? moveIds.filter(Boolean) : moveIds, abilityId, itemId, ap, nature };
    const nextMembers = isEditingTeam ? members.map((member) => member.id === candidate.id ? candidate : member) : [...members, candidate];
    const issues = validateTeam(nextMembers, pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    const candidateIssue = issues[0];
    if (candidateIssue) { setError(candidateIssue.message); return; }
    if (isEditingTeam) update(format, candidate); else add(format, candidate);
    onClose();
  };
  const selectedItem = itemId ? itemById.get(itemId) ?? null : null;
  return <div className="editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="build-editor" role="dialog" aria-modal="true" aria-labelledby="builder-title">
      <button className="close-button" onClick={onClose} aria-label={locale === "zh-Hant" ? "關閉" : "Close"}>×</button>
      <div className="builder-identity"><img src={effectiveSelected.imageUrl} alt="" width="92" height="92" /><div><p className="eyebrow">BUILD WORKBENCH</p><h2 id="builder-title">{localName(effectiveSelected, locale)}</h2><div className="badge-row">{effectiveSelected.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></div></div>
      <div className="build-format-selector"><span>{locale === "zh-Hant" ? "隊伍模式" : "Team mode"}</span><div className="segmented" role="group" aria-label="Team mode"><button disabled={isEditingTeam} className={format === "singles" ? "active" : ""} onClick={() => onFormatChange("singles")}>{labels[locale].singles}</button><button disabled={isEditingTeam} className={format === "doubles" ? "active" : ""} onClick={() => onFormatChange("doubles")}>{labels[locale].doubles}</button></div><small>{mode === "scrapbook" ? (locale === "zh-Hant" ? "每次調整都會立即儲存到畫本；只有按下「加入已選隊伍」才會新增隊伍成員。" : "Every change is saved to the scrapbook; a team member is added only through “Add to selected team”.") : isEditingTeam ? (locale === "zh-Hant" ? "正在編輯隊伍中的既有配置；儲存後位置不會改變。" : "Editing this team member in place; its team position will be preserved.") : recommendationsLoading ? (locale === "zh-Hant" ? "正在讀取當前使用率…" : "Loading current usage…") : usage ? (locale === "zh-Hant" ? "已套用此模式使用率最高的持有物、招式與特性" : "Top current-format item, moves, and ability applied") : (locale === "zh-Hant" ? "使用率暫時無法取得，已使用預設配置" : "Usage unavailable; catalog defaults applied")}</small></div>
      <div className="builder-display-preferences" aria-label={locale === "zh-Hant" ? "選單顯示方式" : "Picker display modes"}>{(["move", "ability", "item"] as const).map((kind) => <div key={kind}><span>{locale === "zh-Hant" ? kind === "move" ? "招式" : kind === "ability" ? "特性" : "持有物" : kind}</span><div className="segmented"><button className={displayModes[kind] === "detailed" ? "active" : ""} onClick={() => changeDisplayMode(kind, "detailed")}>{locale === "zh-Hant" ? "詳細" : "Detailed"}</button><button className={displayModes[kind] === "compact" ? "active" : ""} onClick={() => changeDisplayMode(kind, "compact")}>{locale === "zh-Hant" ? "精簡" : "Compact"}</button></div></div>)}</div>
      {effectiveSelected.id !== selected.id && <p className="mega-transform-note">{locale === "zh-Hant" ? <>{selectedItem ? <>選擇 <ItemDisplay item={selectedItem} locale={locale} size={22} /> 後</> : "移除專屬超級石後"}，目前型態為 {localName(effectiveSelected, locale)}。</> : <>{selectedItem ? <><ItemDisplay item={selectedItem} locale={locale} size={22} /> selected; </> : "Dedicated Mega Stone removed; "}current form is {localName(effectiveSelected, locale)}.</>}</p>}
      <div className="builder-grid">
        <label>{locale === "zh-Hant" ? "性格" : "Nature"}<select value={nature.name} onChange={(event) => setNature(NATURES.find((entry) => entry.name === event.target.value) ?? NEUTRAL_NATURE)}>{selectableNatures.map((entry) => <option value={entry.name} key={entry.name}>{commonNatureRank.has(entry.name) ? `${locale === "zh-Hant" ? "常用" : "Common"} #${commonNatureRank.get(entry.name)} · ` : ""}{natureLabel(entry, locale)}</option>)}</select></label>
        <ResourcePicker label={locale === "zh-Hant" ? "特性" : "Ability"} value={abilityId} options={abilityOptions} locale={locale} detailed={displayModes.ability === "detailed"} onChange={setAbilityId} />
        <ResourcePicker label={locale === "zh-Hant" ? "持有物" : "Held item"} value={itemId} options={itemOptions} locale={locale} detailed={displayModes.item === "detailed"} onChange={setItemId} />
      </div>
      <div className="move-slots">{[0,1,2,3].map((slot) => <MovePicker key={slot} slot={slot} value={moveIds[slot] ?? null} legalMoveIds={effectiveSelected.moveIds} selectedMoveIds={moveIds} commonMoves={commonMoves} locale={locale} detailed={displayModes.move === "detailed"} onChange={(moveId) => setMoveIds((current) => { if (mode === "scrapbook") return Array.from({ length: 4 }, (_, index) => index === slot ? moveId ?? "" : current[index] ?? ""); const next = [...current]; if (moveId) next[slot] = moveId; else next.splice(slot, 1); return next.filter(Boolean).slice(0, 4); })} />)}</div>
      <div className="ap-head"><h3>{locale === "zh-Hant" ? "能力值與 AP" : "Stats & AP"}</h3><label className="ap-preset-field"><span>{locale === "zh-Hant" ? "AP 配置" : "AP spread"}</span><select aria-label={locale === "zh-Hant" ? "AP 配置" : "AP spread"} value={apPresetRank === null ? "custom" : String(apPresetRank)} onChange={(event) => {
        if (event.target.value === "custom") { setApPresetRank(null); return; }
        const choice = commonApChoices.find((entry) => entry.rank === Number(event.target.value));
        if (choice) { setAp({ ...choice.ap }); setApPresetRank(choice.rank); }
      }}><option value="custom">{locale === "zh-Hant" ? "客製化" : "Custom"}</option>{commonApChoices.map((choice) => <option key={choice.rank} value={choice.rank}>{apChoiceLabel(choice, locale)}</option>)}</select></label><span className={remaining < 0 ? "remaining bad" : "remaining"}>{remaining} / 66 {locale === "zh-Hant" ? "剩餘" : "remaining"}</span></div>
      <div className="stat-editor">{(Object.keys(statLabels) as Array<keyof Stats>).map((stat) => <label key={stat}><span>{statLabels[stat]}{nature.up === stat && <em className="nature-up" title="+10%">↑</em>}{nature.down === stat && <em className="nature-down" title="−10%">↓</em>} <b>{finalStats[stat]}</b></span><input type="range" min="0" max="32" value={ap[stat]} onChange={(event) => { const next = { ...ap, [stat]: Number(event.target.value) }; if (apTotal(next) <= 66) { setAp(next); setApPresetRank(null); } }} /><output>{ap[stat]}</output></label>)}</div>
      {error && <p className="form-error" role="alert">{error}</p>}{mode === "scrapbook" ? <div className="builder-submit-actions"><button className="primary-button" onClick={onClose}>{locale === "zh-Hant" ? "儲存畫本配置" : "Save scrapbook build"}</button><button className="secondary-button" onClick={submitTeam}>{locale === "zh-Hant" ? "加入已選隊伍" : "Add to selected team"}</button></div> : <button className="primary-button" onClick={submitTeam}>{isEditingTeam ? labels[locale].save : labels[locale].add}</button>}
    </section>
  </div>;
}

function TeamTray({ locale, format, onFormatChange, onEdit }: { locale: Locale; format: BattleFormat; onFormatChange: (format: BattleFormat) => void; onEdit: (member: TeamMember, format: BattleFormat) => void }) {
  const teams = useTeamStore((state) => state.teams);
  const members = teams[format];
  const remove = useTeamStore((state) => state.remove);
  const [open, setOpen] = useState(false);
  return <aside className={`team-tray ${open ? "open" : "collapsed"}`} aria-label={labels[locale].team}>
    <button className="tray-header" onClick={() => setOpen(!open)} aria-expanded={open}><span><b>{labels[locale].team}</b><small>{labels[locale][format]} · {members.length} / 6</small></span><span>{open ? "⌄" : "⌃"}</span></button>
    {open && <><div className="team-format-tabs" role="group" aria-label="Selected team format"><button className={format === "singles" ? "active" : ""} onClick={() => onFormatChange("singles")}>{labels[locale].singles} {teams.singles.length}/6</button><button className={format === "doubles" ? "active" : ""} onClick={() => onFormatChange("doubles")}>{labels[locale].doubles} {teams.doubles.length}/6</button></div><div className="team-list">{members.length === 0 ? <p className="team-empty">{labels[locale].empty}</p> : members.map((member) => {
      const entry = pokemonById.get(member.pokemonId)!;
      const stats = calculateFinalStats(entry.baseStats, member.ap, member.nature);
      return <article className="team-card" key={member.id}>
        <div className="team-card-actions"><button className="edit-member" onClick={() => onEdit(member, format)} aria-label={`${labels[locale].edit} ${localName(entry, locale)}`}>{labels[locale].edit}</button><button className="remove-member" onClick={() => remove(format, member.id)} aria-label={`Remove ${entry.name}`}>×</button></div>
        <div className="team-card-title"><img src={entry.imageUrl} alt="" width="52" height="52" /><div><strong>{localName(entry, locale)}</strong><div className="badge-row compact">{entry.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></div></div>
        <TypeMatchups types={entry.types} locale={locale} compact />
        <div className="team-moves">{member.moveIds.map((id) => { const move = moveById.get(id)!; return <span key={id}><TypeBadge type={move.type} locale={locale} /> {localName(move, locale)}</span>; })}</div>
        <div className="team-meta"><span>{member.abilityId ? <AbilityTooltip id={member.abilityId} locale={locale} /> : "—"}</span><span>{member.itemId ? <ItemTooltip item={itemById.get(member.itemId)} locale={locale} size={22} /> : (locale === "zh-Hant" ? "無持有物" : "No item")}</span><span className="team-nature" title={natureLabel(member.nature, locale)}>{natureLabel(member.nature, locale)}</span></div>
        <div className="mini-stats">{(Object.keys(statLabels) as Array<keyof Stats>).map((stat) => <span key={stat}><small>{statLabels[stat]}{member.nature.up === stat && <i className="nature-up">↑</i>}{member.nature.down === stat && <i className="nature-down">↓</i>}</small><b>{stats[stat]}</b><em className={member.ap[stat] ? "has-ap" : ""}>+{member.ap[stat]}</em></span>)}</div>
      </article>;
    })}</div></>}
  </aside>;
}

export function ChampionsApp() {
  const { theme, setTheme } = useThemePreference();
  const [locale, setLocaleState] = useState<Locale>("en");
  const setLocale = (value: Locale | ((current: Locale) => Locale)) => setLocaleState((current) => {
    const next = typeof value === "function" ? value(current) : value;
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    return next;
  });
  const [view, setView] = useState<View>("pokemon");
  const [format, setFormat] = useState<BattleFormat>("doubles");
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [scrapbookCandidate, setScrapbookCandidate] = useState<Pokemon | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editorMode, setEditorMode] = useState<"team" | "scrapbook">("team");
  const [scrapbookEditTarget, setScrapbookEditTarget] = useState<{ bookId: string; entryId: string } | null>(null);
  const updateScrapbookEntry = useScrapbookStore((state) => state.updateEntry);
  const hydrate = useTeamStore((state) => state.hydrate);
  const hydrateScrapbooks = useScrapbookStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { void hydrateScrapbooks(); }, [hydrateScrapbooks]);
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    const preferred = saved === "en" || saved === "zh-Hant"
      ? saved
      : navigator.languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh-Hant" : "en";
    // Browser language and localStorage are unavailable during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(preferred);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-locale-pending") && root.dataset.locale !== locale) return;
    root.dataset.locale = locale;
    root.lang = locale;
    delete root.dataset.localePending;
  }, [locale]);
  const copy = labels[locale];
  const closeEditor = useCallback(() => { setSelected(null); setEditingMember(null); setScrapbookEditTarget(null); }, []);
  const startNewBuild = (entry: Pokemon) => { setEditorMode("team"); setScrapbookEditTarget(null); setEditingMember(null); setSelected(entry); };
  const editTeamMember = (member: TeamMember, memberFormat: BattleFormat) => {
    const entry = pokemonById.get(member.pokemonId);
    if (!entry) return;
    setEditorMode("team");
    setScrapbookEditTarget(null);
    setFormat(memberFormat);
    setEditingMember(member);
    setSelected(entry);
  };
  const editScrapbookEntry = (bookId: string, saved: ScrapbookEntry) => {
    const entry = pokemonById.get(saved.pokemonId);
    if (!entry) return;
    setEditorMode("scrapbook");
    setScrapbookEditTarget({ bookId, entryId: saved.id });
    setEditingMember(saved);
    setSelected(entry);
  };
  const persistScrapbookDraft = useCallback((member: Omit<TeamMember, "id">) => {
    if (scrapbookEditTarget) updateScrapbookEntry(scrapbookEditTarget.bookId, scrapbookEditTarget.entryId, member);
  }, [scrapbookEditTarget, updateScrapbookEntry]);
  return <div className={`app-shell ${view === "types" ? "type-chart-active" : ""}`}><header className="topbar"><a className="brand" href="#top" aria-label="Champions Lab home"><span className="brand-mark">CL</span><span><b>CHAMPIONS LAB</b><small>Battle intelligence, built clearly.</small></span></a><nav>{(["pokemon","scrapbook","moves","abilities","items","types"] as View[]).map((entry) => <button key={entry} className={view === entry ? "active" : ""} onClick={() => setView(entry)}>{copy[entry]}</button>)}</nav><div className="header-actions"><span className="regulation-dot">● {copy.current}</span><div className="segmented" role="group" aria-label="Team mode"><button className={format === "singles" ? "active" : ""} onClick={() => setFormat("singles")}>{copy.singles}</button><button className={format === "doubles" ? "active" : ""} onClick={() => setFormat("doubles")}>{copy.doubles}</button></div><ThemeToggle theme={theme} locale={locale} onChange={setTheme} /><button className="locale-button" onClick={() => setLocale(locale === "en" ? "zh-Hant" : "en")}>{locale === "en" ? "繁中" : "EN"}</button></div></header><main id="top"><PokemonTableV2 active={view === "pokemon"} locale={locale} format={format} onSelect={startNewBuild} onScrapbook={setScrapbookCandidate} />{view === "scrapbook" && <ScrapbookView locale={locale} format={format} onEditEntry={editScrapbookEntry} onAddToScrapbook={setScrapbookCandidate} />}<MoveDatabaseV2 active={view === "moves"} locale={locale} onScrapbook={setScrapbookCandidate} /><ResourceDatabaseV2 active={view === "abilities"} kind="abilities" locale={locale} onScrapbook={setScrapbookCandidate} /><ResourceDatabaseV2 active={view === "items"} kind="items" locale={locale} />{view === "types" && <TypeChart locale={locale} />}</main><footer><span>Unofficial community tool.</span><a href="https://championsbattledata.com/">Battle data provided by Pokémon Champions Battle Data</a><a href="https://github.com/smogon/pokemon-showdown">Move mechanics provided by Pokémon Showdown</a><a href="https://github.com/PokeAPI/sprites">Held-item sprites provided by PokeAPI sprites</a><DataFreshness locale={locale} /></footer><TeamTray locale={locale} format={format} onFormatChange={setFormat} onEdit={editTeamMember} /><BuildEditor selected={selected} editingMember={editingMember} mode={editorMode} locale={locale} format={format} onFormatChange={setFormat} onClose={closeEditor} onDraftChange={editorMode === "scrapbook" ? persistScrapbookDraft : undefined} />{scrapbookCandidate && <AddToScrapbookDialog pokemon={scrapbookCandidate} locale={locale} onClose={() => setScrapbookCandidate(null)} />}</div>;
}
