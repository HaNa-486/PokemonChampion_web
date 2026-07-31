"use client";

import { useEffect, useMemo, useState } from "react";
import { abilities, abilityById, itemById, items, megaStoneIdByPokemonId, moveById, moves, pokemon, pokemonById } from "../lib/catalog";
import { apTotal, calculateFinalStats, formatPriority, modifiedSpeed, NATURES, NEUTRAL_NATURE, priorityMatches, validateTeam, ZERO_STATS } from "../lib/domain";
import { useTeamStore } from "../lib/team-store";
import type { Move, Nature, Pokemon, Stats, TeamMember } from "../lib/types";
import { MoveDatabaseV2, PokemonTableV2, ResourceDatabaseV2, SpeedCompareV2 } from "./DatabaseViews";
import { InfoTooltip } from "./InfoTooltip";
import { TypeBadge } from "./TypeBadge";

type Locale = "en" | "zh-Hant";
type View = "pokemon" | "moves" | "abilities" | "items" | "speed";
type PriorityClass = "positive" | "zero" | "negative";

const labels = {
  en: { pokemon: "Pokémon DB", moves: "Move DB", abilities: "Ability DB", items: "Held Item DB", speed: "Speed Compare", search: "Search Pokémon or type…", current: "Regulation M-4 · Current", add: "Build & add", team: "Selected team", empty: "Choose a Pokémon to start building.", data: "Battle data snapshot: 2026-07-29", doubles: "Doubles", singles: "Singles" },
  "zh-Hant": { pokemon: "寶可夢資料庫", moves: "招式資料庫", abilities: "特性資料庫", items: "持有物資料庫", speed: "速度比較", search: "搜尋寶可夢或屬性…", current: "規則 M-4 · 當前", add: "配置並加入", team: "已選隊伍", empty: "選擇一隻寶可夢開始配置。", data: "對戰資料快照：2026-07-29", doubles: "雙打", singles: "單打" },
};

const statLabels: Record<keyof Stats, string> = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };

function localName(entry: { name: string; nameZh: string }, locale: Locale) { return locale === "zh-Hant" ? entry.nameZh : entry.name; }


function MoveTooltip({ move, locale }: { move: Move; locale: Locale }) {
  return <InfoTooltip label={localName(move, locale)}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} /><span>{move.category}</span><span>Priority {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>Power {move.power ?? "—"}</span><span>Acc. {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>;
}

function AbilityTooltip({ id, locale }: { id: string; locale: Locale }) {
  const ability = abilityById.get(id);
  if (!ability) return <span>—</span>;
  return <InfoTooltip label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip>;
}

function ItemTooltip({ id, locale }: { id: string; locale: Locale }) {
  const item = itemById.get(id);
  if (!item) return <span>—</span>;
  return <InfoTooltip label={localName(item, locale)}><strong>{localName(item, locale)}</strong><div className="tooltip-meta"><span>{item.category}</span></div><p>{locale === "zh-Hant" ? item.descriptionZh : item.description}</p></InfoTooltip>;
}

function PokemonTable({ locale, format, onSelect }: { locale: Locale; format: "singles" | "doubles"; onSelect: (entry: Pokemon) => void }) {
  const [query, setQuery] = useState("");
  const allMatches = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const filtered = allMatches.slice(0, 100);
  return <section className="panel catalog-panel"><div className="panel-head"><div><p className="eyebrow">CURRENT REGULATION</p><h1>{labels[locale].pokemon}</h1><p>{allMatches.length} legal forms · showing {filtered.length} · {labels[locale].data}</p></div><label className="search-field"><span className="sr-only">Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels[locale].search} /></label></div><div className="table-scroll"><table><thead><tr><th>Rank</th><th>Pokémon</th><th>Type</th>{Object.values(statLabels).map((label) => <th key={label}>{label}</th>)}<th>Ability</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td className="rank">#{format === "doubles" ? entry.usageDoubles : entry.usageSingles}</td><td><div className="pokemon-name"><img src={entry.imageUrl} alt="" width="54" height="54" loading="lazy" /><div><strong>{localName(entry, locale)}</strong>{entry.isMega && <small>Mega</small>}</div></div></td><td><div className="badge-row">{entry.types.map((type) => <TypeBadge key={type} type={type} />)}</div></td>{Object.entries(entry.baseStats).map(([key, value]) => <td key={key} className={key === "speed" ? "stat-accent" : "stat-cell"}>{value}</td>)}<td><div className="ability-list">{entry.abilityIds.length ? entry.abilityIds.map((id) => <AbilityTooltip id={id} locale={locale} key={id} />) : "—"}</div></td><td><button className="add-button" onClick={() => onSelect(entry)} aria-label={`Configure ${entry.name}`}>+</button></td></tr>)}</tbody></table></div></section>;
}

export function MoveDatabase({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<PriorityClass[]>([]);
  const toggle = (value: PriorityClass) => setClasses((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  const allMatches = moves.filter((move) => `${move.name} ${move.nameZh}`.toLowerCase().includes(query.toLowerCase()) && priorityMatches(move, classes));
  const filtered = allMatches.slice(0, 100);
  return <section className="panel"><div className="panel-head moves-head"><div><p className="eyebrow">MOVE INTELLIGENCE</p><h1>{labels[locale].moves}</h1><p>{filtered.length} / {moves.length} moves</p></div><input className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋招式…" : "Search moves…"} /></div><div className="filter-bar" aria-label="Priority filters"><span>Priority</span>{(["positive", "zero", "negative"] as const).map((value) => <button key={value} onClick={() => toggle(value)} aria-pressed={classes.includes(value)} className={`filter-chip priority-${value}`}>{value === "positive" ? "+ Positive" : value === "zero" ? "0 Neutral" : "− Negative"}</button>)}</div><div className="table-scroll"><table><thead><tr><th>Move</th><th>Type</th><th>Class</th><th>Power</th><th>Acc.</th><th>PP</th><th>Priority</th><th>Target</th><th>Properties</th></tr></thead><tbody>{filtered.map((move) => <tr key={move.id}><td><MoveTooltip move={move} locale={locale} /></td><td><TypeBadge type={move.type} /></td><td>{move.category}</td><td>{move.power ?? "—"}</td><td>{move.accuracy ?? "—"}</td><td>{move.pp}</td><td><span className={`priority-value priority-${move.priority > 0 ? "positive" : move.priority < 0 ? "negative" : "zero"}`}>{formatPriority(move.priority)}</span></td><td>{move.target}</td><td>{move.flags.join(" · ") || "—"}</td></tr>)}</tbody></table></div></section>;
}

function ResourceDatabase({ kind, locale }: { kind: "abilities" | "items"; locale: Locale }) {
  const [query, setQuery] = useState("");
  const entries = kind === "abilities" ? abilities : items;
  const filtered = entries.filter((entry) => `${entry.name} ${entry.nameZh} ${"category" in entry && typeof entry.category === "string" ? entry.category : ""}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel resource-panel"><div className="panel-head"><div><p className="eyebrow">REFERENCE LIBRARY</p><h1>{labels[locale][kind]}</h1><p>{filtered.length} {kind}</p></div><input className="move-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "zh-Hant" ? `搜尋${kind === "abilities" ? "特性" : "持有物"}…` : `Search ${kind}…`} /></div><div className="resource-grid">{filtered.map((entry) => <article className="resource-card" key={entry.id}><div><span className="resource-kind">{"category" in entry && typeof entry.category === "string" ? entry.category : "Ability"}</span><h2>{kind === "abilities" ? <AbilityTooltip id={entry.id} locale={locale} /> : <ItemTooltip id={entry.id} locale={locale} />}</h2></div><p>{locale === "zh-Hant" ? entry.descriptionZh : entry.description}</p></article>)}</div></section>;
}

function BuildEditor({ selected, locale, onClose }: { selected: Pokemon | null; locale: Locale; onClose: () => void }) {
  return selected ? <BuildEditorContent key={selected.id} selected={selected} locale={locale} onClose={onClose} /> : null;
}

function BuildEditorContent({ selected, locale, onClose }: { selected: Pokemon; locale: Locale; onClose: () => void }) {
  const members = useTeamStore((state) => state.members);
  const add = useTeamStore((state) => state.add);
  const [moveIds, setMoveIds] = useState<string[]>(selected.moveIds.slice(0, 4));
  const [abilityId, setAbilityId] = useState<string | null>(selected.abilityIds[0] ?? null);
  const requiredMegaStoneId = megaStoneIdByPokemonId.get(selected.id) ?? null;
  const [itemId, setItemId] = useState<string | null>(requiredMegaStoneId);
  const [ap, setAp] = useState<Stats>({ ...ZERO_STATS });
  const [nature, setNature] = useState<Nature>(NEUTRAL_NATURE);
  const [error, setError] = useState("");
  const finalStats = calculateFinalStats(selected.baseStats, ap, nature);
  const remaining = 66 - apTotal(ap);
  const submit = () => {
    if (members.length >= 6) { setError(locale === "zh-Hant" ? "隊伍已滿，請先移除一名成員。" : "Team is full. Remove a member first."); return; }
    const candidate: TeamMember = { id: crypto.randomUUID(), pokemonId: selected.id, moveIds, abilityId, itemId, ap, nature };
    const issues = validateTeam([...members, candidate], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    const candidateIssue = issues.find((issue) => issue.memberId === candidate.id || issue.code === "TEAM_FULL");
    if (candidateIssue) { setError(candidateIssue.message); return; }
    add(candidate); onClose();
  };
  const selectableItems = requiredMegaStoneId ? items.filter((item) => item.id === requiredMegaStoneId) : items;
  return <div className="editor-backdrop" role="presentation"><section className="build-editor" role="dialog" aria-modal="true" aria-labelledby="builder-title"><button className="close-button" onClick={onClose} aria-label="Close">×</button><div className="builder-identity"><img src={selected.imageUrl} alt="" width="92" height="92" /><div><p className="eyebrow">BUILD WORKBENCH</p><h2 id="builder-title">{localName(selected, locale)}</h2><div className="badge-row">{selected.types.map((type) => <TypeBadge key={type} type={type} />)}</div></div></div><div className="builder-grid"><label>Nature<select value={nature.name} onChange={(event) => setNature(NATURES.find((entry) => entry.name === event.target.value) ?? NEUTRAL_NATURE)}>{NATURES.map((entry) => <option key={entry.name}>{entry.name}</option>)}</select></label><label>Ability<select value={abilityId ?? ""} onChange={(event) => setAbilityId(event.target.value || null)}><option value="">—</option>{selected.abilityIds.map((id) => <option value={id} key={id}>{localName(abilityById.get(id)!, locale)}</option>)}</select></label><label>Held item<select value={itemId ?? ""} disabled={Boolean(requiredMegaStoneId)} onChange={(event) => setItemId(event.target.value || null)}><option value="">—</option>{selectableItems.map((item) => <option key={item.id} value={item.id}>{localName(item, locale)}</option>)}</select>{requiredMegaStoneId && <small className="field-note">{locale === "zh-Hant" ? "Mega 型態必須持有專屬超級石。" : "This Mega form must hold its dedicated Mega Stone."}</small>}</label></div><div className="move-slots">{[0,1,2,3].map((slot) => <label key={slot}>Move {slot + 1}<select value={moveIds[slot] ?? ""} onChange={(event) => setMoveIds((current) => { const next = [...current]; if (event.target.value) next[slot] = event.target.value; else next.splice(slot, 1); return next; })}><option value="">—</option>{selected.moveIds.map((id) => <option value={id} key={id}>{localName(moveById.get(id)!, locale)}</option>)}</select></label>)}</div><div className="ap-head"><h3>Stats & AP</h3><span className={remaining < 0 ? "remaining bad" : "remaining"}>{remaining} / 66 remaining</span></div><div className="stat-editor">{(Object.keys(statLabels) as Array<keyof Stats>).map((stat) => <label key={stat}><span>{statLabels[stat]} <b>{finalStats[stat]}</b></span><input type="range" min="0" max="32" value={ap[stat]} onChange={(event) => { const value = Number(event.target.value); setAp((current) => apTotal({ ...current, [stat]: value }) <= 66 ? { ...current, [stat]: value } : current); }} /><output>{ap[stat]}</output></label>)}</div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" onClick={submit}>{labels[locale].add}</button></section></div>;
}

function TeamTray({ locale }: { locale: Locale }) {
  const members = useTeamStore((state) => state.members);
  const remove = useTeamStore((state) => state.remove);
  const [open, setOpen] = useState(true);
  return <aside className={`team-tray ${open ? "open" : "collapsed"}`} aria-label={labels[locale].team}><button className="tray-header" onClick={() => setOpen(!open)} aria-expanded={open}><span><b>{labels[locale].team}</b><small>{members.length} / 6</small></span><span>{open ? "⌄" : "⌃"}</span></button>{open && <div className="team-list">{members.length === 0 ? <p className="team-empty">{labels[locale].empty}</p> : members.map((member) => { const entry = pokemonById.get(member.pokemonId)!; const stats = calculateFinalStats(entry.baseStats, member.ap, member.nature); return <article className="team-card" key={member.id}><button className="remove-member" onClick={() => remove(member.id)} aria-label={`Remove ${entry.name}`}>×</button><div className="team-card-title"><img src={entry.imageUrl} alt="" width="52" height="52" /><div><strong>{localName(entry, locale)}</strong><div className="badge-row compact">{entry.types.map((type) => <TypeBadge key={type} type={type} />)}</div></div></div><div className="team-moves">{member.moveIds.map((id) => { const move = moveById.get(id)!; return <span key={id}><TypeBadge type={move.type} /> {localName(move, locale)}</span>; })}</div><div className="team-meta"><span>{member.abilityId ? <AbilityTooltip id={member.abilityId} locale={locale} /> : "—"}</span><span>{member.itemId ? <ItemTooltip id={member.itemId} locale={locale} /> : "No item"}</span></div><div className="mini-stats">{(Object.keys(statLabels) as Array<keyof Stats>).map((stat) => <span key={stat}><small>{statLabels[stat]}</small><b>{stats[stat]}</b></span>)}</div></article>; })}</div>}</aside>;
}

function SpeedCompare({ locale }: { locale: Locale }) {
  const members = useTeamStore((state) => state.members);
  const [trickRoom, setTrickRoom] = useState(false);
  const [stage, setStage] = useState(0);
  const rows = useMemo(() => members.map((member) => { const entry = pokemonById.get(member.pokemonId)!; const final = calculateFinalStats(entry.baseStats, member.ap, member.nature).speed; const itemMultiplier = member.itemId === "choice-scarf" ? 1.5 : 1; return { member, entry, final, modified: modifiedSpeed(final, stage, itemMultiplier), itemMultiplier }; }).sort((a,b) => trickRoom ? a.modified - b.modified : b.modified - a.modified), [members, stage, trickRoom]);
  return <section className="panel speed-panel"><div className="panel-head"><div><p className="eyebrow">TURN ORDER LAB</p><h1>{labels[locale].speed}</h1><p>{locale === "zh-Hant" ? "使用隊伍中的最終速度進行比較" : "Compare final Speed from your selected team"}</p></div></div><div className="speed-controls"><label>Stat stage<select value={stage} onChange={(event) => setStage(Number(event.target.value))}>{[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value > 0 ? `+${value}` : value}</option>)}</select></label><button className="filter-chip" aria-pressed={trickRoom} onClick={() => setTrickRoom(!trickRoom)}>Trick Room {trickRoom ? "ON" : "OFF"}</button></div>{rows.length === 0 ? <div className="empty-state"><span>↯</span><h2>{locale === "zh-Hant" ? "隊伍目前是空的" : "Your team is empty"}</h2><p>{locale === "zh-Hant" ? "先從寶可夢資料庫加入成員。" : "Add members from the Pokémon database first."}</p></div> : <div className="speed-list">{rows.map((row, index) => <article key={row.member.id} className="speed-row"><span className="speed-rank">{index + 1}</span><img src={row.entry.imageUrl} alt="" width="64" height="64" /><div className="speed-identity"><strong>{localName(row.entry, locale)}</strong><span>Base {row.entry.baseStats.speed} → Final {row.final}{row.itemMultiplier > 1 ? " × 1.5 Scarf" : ""}</span></div><div className="speed-result"><small>{trickRoom ? "TR order" : "Modified Speed"}</small><b>{row.modified}</b></div></article>)}</div>}<p className="mechanics-note">Priority → explicit order effects → {trickRoom ? "Trick Room → slower first" : "modified Speed → faster first"} → speed tie.</p></section>;
}

export function ChampionsApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [view, setView] = useState<View>("pokemon");
  const [format, setFormat] = useState<"singles" | "doubles">("doubles");
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const hydrate = useTeamStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  const copy = labels[locale];
  return <div className="app-shell"><header className="topbar"><a className="brand" href="#top" aria-label="Champions Lab home"><span className="brand-mark">CL</span><span><b>CHAMPIONS LAB</b><small>Battle intelligence, built clearly.</small></span></a><nav>{(["pokemon","moves","abilities","items","speed"] as View[]).map((entry) => <button key={entry} className={view === entry ? "active" : ""} onClick={() => setView(entry)}>{copy[entry]}</button>)}</nav><div className="header-actions"><span className="regulation-dot">● {copy.current}</span><div className="segmented"><button className={format === "singles" ? "active" : ""} onClick={() => setFormat("singles")}>{copy.singles}</button><button className={format === "doubles" ? "active" : ""} onClick={() => setFormat("doubles")}>{copy.doubles}</button></div><button className="locale-button" onClick={() => setLocale(locale === "en" ? "zh-Hant" : "en")}>{locale === "en" ? "繁中" : "EN"}</button></div></header><main id="top">{view === "pokemon" && <PokemonTableV2 locale={locale} format={format} onSelect={setSelected} />}{view === "moves" && <MoveDatabaseV2 locale={locale} />}{view === "abilities" && <ResourceDatabaseV2 kind="abilities" locale={locale} />}{view === "items" && <ResourceDatabaseV2 kind="items" locale={locale} />}{view === "speed" && <SpeedCompareV2 locale={locale} />}</main><footer><span>Unofficial community tool.</span><a href="https://championsbattledata.com/">Battle data provided by Pokémon Champions Battle Data</a><span>{copy.data}</span></footer><TeamTray locale={locale} /><BuildEditor selected={selected} locale={locale} onClose={() => setSelected(null)} /></div>;
}
