"use client";

import { useState } from "react";
import Link from "next/link";
import { ALL_TYPES, typeEffectiveness } from "../lib/type-chart";
import type { PokemonType } from "../lib/types";
import { TypeBadge } from "./TypeBadge";

type Locale = "en" | "zh-Hant";

const TYPE_NAMES_ZH: Record<PokemonType, string> = {
  Normal: "一般", Fire: "火", Water: "水", Electric: "電", Grass: "草", Ice: "冰",
  Fighting: "格鬥", Poison: "毒", Ground: "地面", Flying: "飛行", Psychic: "超能力",
  Bug: "蟲", Rock: "岩石", Ghost: "幽靈", Dragon: "龍", Dark: "惡", Steel: "鋼", Fairy: "妖精",
};

const cellText = (value: number) => value === 2 ? "2×" : value === .5 ? "½×" : value === 0 ? "0×" : "—";
const typeName = (type: PokemonType, locale: Locale) => locale === "zh-Hant" ? TYPE_NAMES_ZH[type] : type;

export function TypeChart({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const copy = locale === "zh-Hant"
    ? { eyebrow: "屬性指南", title: "屬性相剋表", intro: "左側為攻擊招式屬性，上方為防守方屬性。雙屬性寶可夢需將兩個倍率相乘。", attack: "攻擊 ↓ / 防守 →", strong: "效果絕佳", resist: "效果不好", immune: "沒有效果", neutral: "一般傷害" }
    : { eyebrow: "TYPE GUIDE", title: "Type Matchup Chart", intro: "Attack types run down the left; defending types run across the top. Multiply both values for a dual-type Pokémon.", attack: "Attack ↓ / Defend →", strong: "Super effective", resist: "Not very effective", immune: "No effect", neutral: "Neutral damage" };

  return <section className={compact ? "type-chart-card compact" : "panel type-chart-page"}>
    <div className="type-chart-head">
      <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p></div>
    </div>
    <div className="type-chart-legend" aria-label="Effectiveness legend">
      <span className="chart-effect effect-super"><b>2×</b> {copy.strong}</span>
      <span className="chart-effect effect-resist"><b>½×</b> {copy.resist}</span>
      <span className="chart-effect effect-immune"><b>0×</b> {copy.immune}</span>
      <span className="chart-effect effect-neutral"><b>—</b> {copy.neutral}</span>
    </div>
    <div className="type-chart-scroll" tabIndex={0} aria-label={copy.title}>
      <table className="type-chart-table">
        <thead><tr><th className="chart-axis">{copy.attack}</th>{ALL_TYPES.map((type) => <th key={type} title={typeName(type, locale)}><span className={`chart-type-dot type-${type.toLowerCase()}`}>{typeName(type, locale).slice(0, compact ? 1 : 2)}</span></th>)}</tr></thead>
        <tbody>{ALL_TYPES.map((attacking) => <tr key={attacking}><th><TypeBadge type={attacking} /><span>{typeName(attacking, locale)}</span></th>{ALL_TYPES.map((defending) => { const value = typeEffectiveness(attacking, defending); const className = value === 2 ? "effect-super" : value === .5 ? "effect-resist" : value === 0 ? "effect-immune" : "effect-neutral"; return <td className={className} key={defending} title={`${typeName(attacking, locale)} → ${typeName(defending, locale)}: ${value}×`}>{cellText(value)}</td>; })}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export function TypeChartFloating({ locale = "en" }: { locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const [chartLocale, setChartLocale] = useState(locale);
  const copy = chartLocale === "zh-Hant" ? { toggle: "屬性相剋", close: "收合屬性相剋表", full: "開啟完整屬性頁面" } : { toggle: "Type chart", close: "Collapse type chart", full: "Open full type chart page" };
  return <>
    <aside className={`type-chart-float ${open ? "open" : "collapsed"}`} aria-label={copy.toggle}>
      <button className="type-chart-float-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="floating-type-chart"><span className="type-chart-toggle-icon">{open ? "×" : "18"}</span><span>{copy.toggle}</span></button>
      {open && <div className="floating-chart-panel" id="floating-type-chart"><div className="floating-chart-actions"><Link href="/type-chart">{copy.full} ↗</Link><button onClick={() => setChartLocale((value) => value === "en" ? "zh-Hant" : "en")}>{chartLocale === "en" ? "繁中" : "EN"}</button><button onClick={() => setOpen(false)} aria-label={copy.close}>×</button></div><TypeChart locale={chartLocale} compact /></div>}
    </aside>
    <Link className="type-chart-mobile-link" href="/type-chart">{copy.toggle}</Link>
  </>;
}

export function TypeChartPageShell() {
  const [locale, setLocale] = useState<Locale>("en");
  return <main className="standalone-type-chart"><div className="standalone-chart-actions"><Link className="back-to-app" href="/">← Champions Lab</Link><button className="locale-button" onClick={() => setLocale((value) => value === "en" ? "zh-Hant" : "en")}>{locale === "en" ? "繁中" : "EN"}</button></div><TypeChart locale={locale} /></main>;
}
