import type { Move, Nature, NonHpStat, Pokemon, Stats, TeamMember } from "./types";

export const ZERO_STATS: Stats = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
export const NEUTRAL_NATURE: Nature = { name: "Serious", nameZh: "認真", up: null, down: null };
export const NATURES: Nature[] = [
  NEUTRAL_NATURE,
  { name: "Lonely", nameZh: "怕寂寞", up: "attack", down: "defense" },
  { name: "Adamant", nameZh: "固執", up: "attack", down: "specialAttack" },
  { name: "Naughty", nameZh: "頑皮", up: "attack", down: "specialDefense" },
  { name: "Brave", nameZh: "勇敢", up: "attack", down: "speed" },
  { name: "Bold", nameZh: "大膽", up: "defense", down: "attack" },
  { name: "Impish", nameZh: "淘氣", up: "defense", down: "specialAttack" },
  { name: "Lax", nameZh: "樂天", up: "defense", down: "specialDefense" },
  { name: "Relaxed", nameZh: "悠閒", up: "defense", down: "speed" },
  { name: "Modest", nameZh: "內斂", up: "specialAttack", down: "attack" },
  { name: "Mild", nameZh: "慢吞吞", up: "specialAttack", down: "defense" },
  { name: "Rash", nameZh: "馬虎", up: "specialAttack", down: "specialDefense" },
  { name: "Quiet", nameZh: "冷靜", up: "specialAttack", down: "speed" },
  { name: "Calm", nameZh: "溫和", up: "specialDefense", down: "attack" },
  { name: "Gentle", nameZh: "溫順", up: "specialDefense", down: "defense" },
  { name: "Careful", nameZh: "慎重", up: "specialDefense", down: "specialAttack" },
  { name: "Sassy", nameZh: "自大", up: "specialDefense", down: "speed" },
  { name: "Timid", nameZh: "膽小", up: "speed", down: "attack" },
  { name: "Hasty", nameZh: "急躁", up: "speed", down: "defense" },
  { name: "Jolly", nameZh: "爽朗", up: "speed", down: "specialAttack" },
  { name: "Naive", nameZh: "天真", up: "speed", down: "specialDefense" },
];

export type ValidationIssue = { code: string; message: string; memberId?: string };

export function validateAp(ap: Stats): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [stat, value] of Object.entries(ap)) {
    if (!Number.isInteger(value) || value < 0 || value > 32) issues.push({ code: "AP_OUT_OF_RANGE", message: `${stat} AP must be an integer from 0 to 32.` });
  }
  if (Object.values(ap).reduce((sum, value) => sum + value, 0) > 66) issues.push({ code: "AP_TOTAL_EXCEEDED", message: "Total AP cannot exceed 66." });
  return issues;
}

export function calculateFinalStats(base: Stats, ap: Stats, nature: Nature): Stats {
  const multiplier = (stat: NonHpStat) => nature.up === stat ? 1.1 : nature.down === stat ? 0.9 : 1;
  return {
    hp: base.hp + 75 + ap.hp,
    attack: Math.floor((base.attack + 20 + ap.attack) * multiplier("attack")),
    defense: Math.floor((base.defense + 20 + ap.defense) * multiplier("defense")),
    specialAttack: Math.floor((base.specialAttack + 20 + ap.specialAttack) * multiplier("specialAttack")),
    specialDefense: Math.floor((base.specialDefense + 20 + ap.specialDefense) * multiplier("specialDefense")),
    speed: Math.floor((base.speed + 20 + ap.speed) * multiplier("speed")),
  };
}

export const apTotal = (ap: Stats) => Object.values(ap).reduce((sum, value) => sum + value, 0);
export const priorityMatches = (move: Move, classes: Array<"positive" | "zero" | "negative">) => classes.length === 0 || classes.some((value) => value === "positive" ? move.priority > 0 : value === "negative" ? move.priority < 0 : move.priority === 0);
export const formatPriority = (priority: number) => priority > 0 ? `+${priority}` : String(priority);

export function validateTeam(members: TeamMember[], pokemonById: Map<string, Pokemon>, legalItemIds: Set<string>, megaStoneIdByPokemonId: Map<string, string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (members.length > 6) issues.push({ code: "TEAM_FULL", message: "A team can contain at most six Pokémon." });
  const pokemonIds = new Set<string>();
  const items = new Set<string>();
  for (const member of members) {
    const pokemon = pokemonById.get(member.pokemonId);
    if (!pokemon) { issues.push({ code: "POKEMON_UNAVAILABLE", message: "This Pokémon is unavailable.", memberId: member.id }); continue; }
    if (pokemonIds.has(pokemon.id)) issues.push({ code: "DUPLICATE_POKEMON", message: `${pokemon.name} is already on the team.`, memberId: member.id });
    pokemonIds.add(pokemon.id);
    if (pokemon.isMega) {
      const requiredStone = megaStoneIdByPokemonId.get(pokemon.id);
      if (!requiredStone) issues.push({ code: "MEGA_STONE_CONFIGURATION_MISSING", message: `${pokemon.name} does not have a configured Mega Stone.`, memberId: member.id });
      else if (member.itemId !== requiredStone) issues.push({ code: "MEGA_STONE_REQUIRED", message: `${pokemon.name} must hold its required Mega Stone.`, memberId: member.id });
    }
    if (member.itemId) {
      if (!legalItemIds.has(member.itemId)) issues.push({ code: "ITEM_UNAVAILABLE", message: "Selected item is unavailable.", memberId: member.id });
      if (items.has(member.itemId)) issues.push({ code: "DUPLICATE_ITEM", message: "Held items cannot be duplicated.", memberId: member.id });
      items.add(member.itemId);
    }
    if (member.moveIds.length > 4) issues.push({ code: "TOO_MANY_MOVES", message: "A Pokémon can know at most four moves.", memberId: member.id });
    if (new Set(member.moveIds).size !== member.moveIds.length) issues.push({ code: "DUPLICATE_MOVE", message: "Moves cannot be duplicated.", memberId: member.id });
    for (const moveId of member.moveIds) if (!pokemon.moveIds.includes(moveId)) issues.push({ code: "MOVE_NOT_LEARNABLE", message: `${pokemon.name} cannot learn the selected move.`, memberId: member.id });
    if (member.abilityId && !pokemon.abilityIds.includes(member.abilityId)) issues.push({ code: "ABILITY_UNAVAILABLE", message: `${pokemon.name} cannot use the selected ability.`, memberId: member.id });
    issues.push(...validateAp(member.ap).map((issue) => ({ ...issue, memberId: member.id })));
  }
  return issues;
}

export function speedStageMultiplier(stage: number) {
  const safe = Math.max(-6, Math.min(6, Math.trunc(stage)));
  return safe >= 0 ? (2 + safe) / 2 : 2 / (2 - safe);
}

export const modifiedSpeed = (finalSpeed: number, stage: number, multiplier = 1) => Math.floor(finalSpeed * speedStageMultiplier(stage) * multiplier);
