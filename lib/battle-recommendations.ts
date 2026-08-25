import { abilityIdByUsageName, itemIdByUsageName, moveIdByUsageName, usageEntityKey } from "./catalog";
import { apTotal, NATURES } from "./domain";
import type { BattleUsage, Nature, NonHpStat, Pokemon, Stats } from "./types";

export type RankedChoice = { id: string; rank: number };
export type RankedNatureChoice = { nature: Nature; rank: number };

const rankedRows = (usage: BattleUsage | null | undefined, category: string) => (usage?.rows ?? [])
  .filter((row) => row.category === category)
  .sort((left, right) => (left.rank || Number.MAX_SAFE_INTEGER) - (right.rank || Number.MAX_SAFE_INTEGER) || (right.percentageValue ?? 0) - (left.percentageValue ?? 0));

export function recommendedItemId(usage: BattleUsage | null | undefined) {
  return rankedItemChoices(usage, 10)[0]?.id ?? null;
}

export function rankedItemChoices(usage: BattleUsage | null | undefined, maxRank = 10): RankedChoice[] {
  const seen = new Set<string>();
  return rankedRows(usage, "held_item").flatMap((row) => {
    const id = itemIdByUsageName.get(usageEntityKey(row.name));
    if (!id || row.rank < 1 || row.rank > maxRank || seen.has(id)) return [];
    seen.add(id);
    return [{ id, rank: row.rank }];
  });
}

export function recommendedMoveIds(usage: BattleUsage | null | undefined, pokemon: Pokemon) {
  return rankedMoveChoices(usage, pokemon, 10).slice(0, 4).map((choice) => choice.id);
}

export function rankedMoveChoices(usage: BattleUsage | null | undefined, pokemon: Pokemon, maxRank = 10): RankedChoice[] {
  const legal = new Set(pokemon.moveIds);
  const seen = new Set<string>();
  return rankedRows(usage, "move").flatMap((row) => {
    const id = moveIdByUsageName.get(usageEntityKey(row.name));
    if (!id || !legal.has(id) || row.rank < 1 || row.rank > maxRank || seen.has(id)) return [];
    seen.add(id);
    return [{ id, rank: row.rank }];
  });
}

export function recommendedAbilityId(usage: BattleUsage | null | undefined, pokemon: Pokemon) {
  return rankedAbilityChoices(usage, pokemon, 10)[0]?.id ?? null;
}

export function rankedAbilityChoices(usage: BattleUsage | null | undefined, pokemon: Pokemon, maxRank = 10): RankedChoice[] {
  const seen = new Set<string>();
  return rankedRows(usage, "ability").flatMap((row) => {
    const id = abilityIdByUsageName.get(usageEntityKey(row.name));
    if (!id || !pokemon.abilityIds.includes(id) || row.rank < 1 || row.rank > maxRank || seen.has(id)) return [];
    seen.add(id);
    return [{ id, rank: row.rank }];
  });
}

const natureStatAliases: Record<string, NonHpStat> = {
  attack: "attack", atk: "attack", defense: "defense", def: "defense",
  "sp atk": "specialAttack", "sp. atk": "specialAttack", "special attack": "specialAttack", spa: "specialAttack",
  "sp def": "specialDefense", "sp. def": "specialDefense", "special defense": "specialDefense", spd: "specialDefense",
  speed: "speed", spe: "speed",
};

const natureStat = (value: string) => natureStatAliases[value.trim().toLowerCase()] ?? null;

export function recommendedNature(usage: BattleUsage | null | undefined): Nature | null {
  return rankedNatureChoices(usage, 10)[0]?.nature ?? null;
}

export function rankedNatureChoices(usage: BattleUsage | null | undefined, maxRank = 10): RankedNatureChoice[] {
  const seen = new Set<string>();
  const choices: RankedNatureChoice[] = [];
  for (const row of rankedRows(usage, "stat_alignment")) {
    const byName = NATURES.find((nature) => usageEntityKey(nature.name) === usageEntityKey(row.name) || usageEntityKey(nature.nameZh ?? "") === usageEntityKey(row.name));
    const up = natureStat(row.statUp);
    const down = natureStat(row.statDown);
    const nature = byName ?? NATURES.find((entry) => entry.up === up && entry.down === down);
    if (!nature || row.rank < 1 || row.rank > maxRank || seen.has(nature.name)) continue;
    seen.add(nature.name);
    choices.push({ nature, rank: row.rank });
  }
  return choices;
}

export function recommendedAp(usage: BattleUsage | null | undefined): Stats | null {
  for (const row of rankedRows(usage, "stat_points")) {
    if (!row.ap) continue;
    const values = Object.values(row.ap);
    if (values.every((value) => Number.isInteger(value) && value >= 0 && value <= 32) && apTotal(row.ap) <= 66) return { ...row.ap };
  }
  return null;
}
