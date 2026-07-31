"use client";

import { useEffect, useMemo, useState } from "react";
import { abilityById, moveById } from "../lib/catalog";
import { formatPriority } from "../lib/domain";
import type { BattleUsage, BattleUsageRow, Move, Pokemon } from "../lib/types";
import { InfoTooltip } from "./InfoTooltip";
import { TypeBadge } from "./TypeBadge";
import { TypeMatchups } from "./TypeMatchups";

type Locale = "en" | "zh-Hant";
type BattleResponse = { data: { scope: string; singles: BattleUsage | null; doubles: BattleUsage | null } };
const statKeys = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const statLabels = { hp: "HP", attack: "Atk", defense: "Def", specialAttack: "SpA", specialDefense: "SpD", speed: "Spe" };
const categoryOrder = ["move", "held_item", "ability", "stat_alignment", "stat_points", "teammate"];
const categoryLabels: Record<string, [string, string]> = {
  move: ["Moves", "招式"], held_item: ["Held items", "持有物"], ability: ["Abilities", "特性"], stat_alignment: ["Natures", "性格"], stat_points: ["AP spreads", "AP 配置"], teammate: ["Teammates", "隊友"],
};
const localName = (entry: { name: string; nameZh: string }, locale: Locale) => locale === "zh-Hant" ? entry.nameZh : entry.name;

function MoveEntry({ move, locale }: { move: Move; locale: Locale }) {
  return <InfoTooltip label={localName(move, locale)}><strong>{localName(move, locale)}</strong><div className="tooltip-meta"><TypeBadge type={move.type} /><span>{move.category}</span><span>Priority {formatPriority(move.priority)}</span></div><div className="tooltip-stats"><span>Power {move.power ?? "—"}</span><span>Acc. {move.accuracy ?? "—"}</span><span>PP {move.pp}</span></div><p>{locale === "zh-Hant" ? move.descriptionZh : move.description}</p></InfoTooltip>;
}

function usageName(row: BattleUsageRow) {
  if (row.name) return row.statUp || row.statDown ? `${row.name} (${row.statUp || "—"} ↑ / ${row.statDown || "—"} ↓)` : row.name;
  if (row.ap) return `HP ${row.ap.hp} / Atk ${row.ap.attack} / Def ${row.ap.defense} / SpA ${row.ap.specialAttack} / SpD ${row.ap.specialDefense} / Spe ${row.ap.speed}`;
  return "—";
}

function BattlePanel({ usage, locale }: { usage: BattleUsage | null | undefined; locale: Locale }) {
  if (!usage) return <p className="detail-empty">{locale === "zh-Hant" ? "目前沒有這個賽制的官方資料。" : "No official data is currently available for this format."}</p>;
  const groups = categoryOrder.map((category) => ({ category, rows: usage.rows.filter((row) => row.category === category) })).filter((group) => group.rows.length);
  return <div className="battle-usage"><p className="battle-source">{usage.season} · {usage.date ?? (locale === "zh-Hant" ? "當前賽季（每日更新）" : "current season (daily cutoff)")} · {usage.source}</p>{groups.map(({ category, rows }) => <section key={category}><h3>{categoryLabels[category]?.[locale === "zh-Hant" ? 1 : 0] ?? category}</h3><div className="usage-table"><div className="usage-head"><span>#</span><span>{locale === "zh-Hant" ? "項目" : "Entry"}</span><span>{locale === "zh-Hant" ? "使用率" : "Usage"}</span></div>{rows.map((row, index) => <div className="usage-row" key={`${category}-${row.rank}-${index}`}><b>{row.rank || index + 1}</b><span>{usageName(row)}</span><strong>{row.percentage || "—"}</strong></div>)}</div></section>)}</div>;
}

export function PokemonDetailDialog({ pokemon, locale, initialFormat, onClose, onBuild }: { pokemon: Pokemon; locale: Locale; initialFormat: "singles" | "doubles"; onClose: () => void; onBuild: () => void }) {
  const [format, setFormat] = useState(initialFormat);
  const [battle, setBattle] = useState<BattleResponse["data"] | null>(null);
  const [error, setError] = useState("");
  const [moveQuery, setMoveQuery] = useState("");
  const moveEntries = useMemo(() => pokemon.moveIds.map((id) => moveById.get(id)).filter((entry): entry is Move => Boolean(entry)).filter((entry) => `${entry.name} ${entry.nameZh} ${entry.type}`.toLowerCase().includes(moveQuery.toLowerCase())), [pokemon.moveIds, moveQuery]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/pokemon/battle?pokemonId=${encodeURIComponent(pokemon.id)}`, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error(String(response.status)); return response.json() as Promise<BattleResponse>; })
      .then((body) => setBattle(body.data))
      .catch((reason) => { if (reason?.name !== "AbortError") setError(locale === "zh-Hant" ? "目前無法載入官方對戰資料，請稍後再試。" : "Official battle data could not be loaded. Please try again shortly."); });
    return () => controller.abort();
  }, [pokemon.id, locale]);
  const copy = locale === "zh-Hant" ? { close: "關閉", build: "配置並加入", moves: "可學招式", abilities: "可選特性", battle: "當季對戰資料", loading: "正在讀取 Champions Battle Data…", note: "Mega 型態的官方對戰統計以原物種與其 Mega 型態合併提供。" } : { close: "Close", build: "Build & add", moves: "Learnable moves", abilities: "Available abilities", battle: "Current-season battle data", loading: "Loading Champions Battle Data…", note: "For Mega forms, the official source aggregates the base species and its Mega forms." };
  return <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="pokemon-detail" role="dialog" aria-modal="true" aria-labelledby="pokemon-detail-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><button className="close-button" onClick={onClose} aria-label={copy.close}>×</button><header className="detail-identity"><img src={pokemon.imageUrl} alt="" width="112" height="112" /><div><p className="eyebrow">POKÉMON INTELLIGENCE</p><h2 id="pokemon-detail-title">{localName(pokemon, locale)}</h2><div className="badge-row">{pokemon.types.map((type) => <TypeBadge key={type} type={type} />)}</div></div><button className="primary-button detail-build" onClick={onBuild}>{copy.build}</button></header><div className="detail-stats">{statKeys.map((key) => <span key={key}><small>{statLabels[key]}</small><b>{pokemon.baseStats[key]}</b></span>)}</div><TypeMatchups types={pokemon.types} locale={locale} /><div className="detail-section"><h3>{copy.abilities} <span>{pokemon.abilityIds.length}</span></h3><div className="detail-abilities">{pokemon.abilityIds.map((id) => { const ability = abilityById.get(id); return ability ? <InfoTooltip key={id} label={localName(ability, locale)}><strong>{localName(ability, locale)}</strong><p>{locale === "zh-Hant" ? ability.descriptionZh : ability.description}</p></InfoTooltip> : null; })}</div></div><div className="detail-section"><div className="detail-section-head"><h3>{copy.moves} <span>{pokemon.moveIds.length}</span></h3><input aria-label="Search learnable moves" value={moveQuery} onChange={(event) => setMoveQuery(event.target.value)} placeholder={locale === "zh-Hant" ? "搜尋可學招式…" : "Search learnable moves…"} /></div><div className="learnable-grid">{moveEntries.map((move) => <article key={move.id}><TypeBadge type={move.type} /><MoveEntry move={move} locale={locale} /><small>{move.category} · P{formatPriority(move.priority)}</small></article>)}</div></div><div className="detail-section"><div className="detail-section-head"><h3>{copy.battle}</h3><div className="segmented"><button className={format === "singles" ? "active" : ""} onClick={() => setFormat("singles")}>{locale === "zh-Hant" ? "單打" : "Singles"}</button><button className={format === "doubles" ? "active" : ""} onClick={() => setFormat("doubles")}>{locale === "zh-Hant" ? "雙打" : "Doubles"}</button></div></div>{pokemon.isMega && <p className="data-scope-note">{copy.note}</p>}{error ? <p className="form-error">{error}</p> : battle ? <BattlePanel usage={format === "singles" ? battle.singles : battle.doubles} locale={locale} /> : <p className="detail-empty">{copy.loading}</p>}</div></section></div>;
}
