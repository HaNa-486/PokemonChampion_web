import { abilityIdByUsageName, itemIdByUsageName, moveIdByUsageName, usageEntityKey } from "./catalog";
import type { BattleUsage, Pokemon } from "./types";

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
