import type { BattleUsage, BattleUsageRow, Stats } from "./types";

type UpstreamRow = Record<string, unknown>;

const numberOrZero = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function normalizeBattleUsage(input: unknown, expectedFormat: "Singles" | "Doubles"): BattleUsage {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const rows = Array.isArray(value.rows) ? value.rows : [];
  return {
    pokemon: typeof value.pokemon === "string" ? value.pokemon : "",
    format: value.format === "Singles" || value.format === "Doubles" ? value.format : expectedFormat,
    season: typeof value.season === "string" ? value.season : "Current",
    date: typeof value.date === "string" ? value.date : null,
    source: typeof value.source === "string" ? value.source : "Pokémon Champions Battle Data",
    rows: rows.map((raw) => normalizeBattleRow(raw as UpstreamRow)).filter((row): row is BattleUsageRow => Boolean(row)),
  };
}

function normalizeBattleRow(row: UpstreamRow): BattleUsageRow | null {
  if (typeof row.category !== "string") return null;
  const apKeys: Array<[keyof Stats, string]> = [["hp", "hp_points"], ["attack", "attack_points"], ["defense", "defense_points"], ["specialAttack", "sp_atk_points"], ["specialDefense", "sp_def_points"], ["speed", "speed_points"]];
  const hasAp = row.category === "stat_points";
  return {
    category: row.category,
    rank: Math.max(0, Math.trunc(numberOrZero(row.rank))),
    name: typeof row.name === "string" ? row.name : "",
    percentage: typeof row.percentage === "string" ? row.percentage : "",
    percentageValue: Number.isFinite(Number(row.percentage_value)) ? Number(row.percentage_value) : null,
    statUp: typeof row.stat_up === "string" ? row.stat_up : "",
    statDown: typeof row.stat_down === "string" ? row.stat_down : "",
    ap: hasAp ? Object.fromEntries(apKeys.map(([key, upstream]) => [key, numberOrZero(row[upstream])])) as Stats : null,
  };
}
