import { abilityIdByUsageName, itemIdByUsageName, moveIdByUsageName, usageEntityKey } from "./catalog";
import { apTotal, NATURES } from "./domain";
import type { BattleUsage, Nature, NonHpStat, Pokemon, Stats } from "./types";

const rankedRows = (usage: BattleUsage | null | undefined, category: string) => (usage?.rows ?? [])
  .filter((row) => row.category === category)
  .sort((left, right) => (left.rank || Number.MAX_SAFE_INTEGER) - (right.rank || Number.MAX_SAFE_INTEGER) || (right.percentageValue ?? 0) - (left.percentageValue ?? 0));

export function recommendedItemId(usage: BattleUsage | null | undefined) {
  for (const row of rankedRows(usage, "held_item")) {
    const id = itemIdByUsageName.get(usageEntityKey(row.name));
    if (id) return id;
  }
  return null;
}

export function recommendedMoveIds(usage: BattleUsage | null | undefined, pokemon: Pokemon) {
  const legal = new Set(pokemon.moveIds);
  const selected: string[] = [];
  for (const row of rankedRows(usage, "move")) {
    const id = moveIdByUsageName.get(usageEntityKey(row.name));
    if (id && legal.has(id) && !selected.includes(id)) selected.push(id);
    if (selected.length === 4) break;
  }
  return selected;
}

export function recommendedAbilityId(usage: BattleUsage | null | undefined, pokemon: Pokemon) {
  for (const row of rankedRows(usage, "ability")) {
    const id = abilityIdByUsageName.get(usageEntityKey(row.name));
    if (id && pokemon.abilityIds.includes(id)) return id;
  }
  return null;
}

const natureStatAliases: Record<string, NonHpStat> = {
  attack: "attack", atk: "attack", defense: "defense", def: "defense",
  "sp atk": "specialAttack", "sp. atk": "specialAttack", "special attack": "specialAttack", spa: "specialAttack",
  "sp def": "specialDefense", "sp. def": "specialDefense", "special defense": "specialDefense", spd: "specialDefense",
  speed: "speed", spe: "speed",
};

const natureStat = (value: string) => natureStatAliases[value.trim().toLowerCase()] ?? null;

export function recommendedNature(usage: BattleUsage | null | undefined): Nature | null {
  for (const row of rankedRows(usage, "stat_alignment")) {
    const byName = NATURES.find((nature) => usageEntityKey(nature.name) === usageEntityKey(row.name) || usageEntityKey(nature.nameZh ?? "") === usageEntityKey(row.name));
    if (byName) return byName;
    const up = natureStat(row.statUp);
    const down = natureStat(row.statDown);
    const byStats = NATURES.find((nature) => nature.up === up && nature.down === down);
    if (byStats) return byStats;
  }
  return null;
}

export function recommendedAp(usage: BattleUsage | null | undefined): Stats | null {
  for (const row of rankedRows(usage, "stat_points")) {
    if (!row.ap) continue;
    const values = Object.values(row.ap);
    if (values.every((value) => Number.isInteger(value) && value >= 0 && value <= 32) && apTotal(row.ap) <= 66) return { ...row.ap };
  }
  return null;
}
