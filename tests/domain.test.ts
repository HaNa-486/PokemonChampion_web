import { describe, expect, it } from "vitest";
import { abilities, items, megaStoneIdByPokemonId, moves, pokemon, pokemonByAbilityId, pokemonById, pokemonByMoveId } from "../lib/catalog";
import { calculateFinalStats, formatPriority, modifiedSpeed, NATURES, priorityMatches, sanitizeTeamMembers, validateAp, validateTeam, ZERO_STATS } from "../lib/domain";
import type { TeamMember } from "../lib/types";
import { isAdminEmail, parseAdminEmails } from "../lib/admin-auth";
import { abilityCategories, itemEffectCategories } from "../lib/filtering";
import { defensiveMatchups, formatMultiplier, typeEffectiveness } from "../lib/type-chart";
import { recommendedAbilityId, recommendedAp, recommendedItemId, recommendedMoveIds, recommendedNature } from "../lib/battle-recommendations";
import { migrateSavedTeams } from "../lib/team-store";
import type { BattleUsage } from "../lib/types";

const usageFixture = (rows: BattleUsage["rows"]): BattleUsage => ({ pokemon: "Blastoise", format: "Doubles", season: "Current", date: null, source: "test", rows });
const usageRow = (category: string, rank: number, name: string) => ({ category, rank, name, percentage: "50%", percentageValue: 50, statUp: "", statDown: "", ap: null });

describe("battle-data build recommendations", () => {
  it("maps ranked upstream names to the best legal item, ability, and four moves", () => {
    const selected = pokemonById.get("blastoise")!;
    const usage = usageFixture([
      usageRow("move", 3, "Aqua Tail"), usageRow("move", 1, "Aqua Jet"), usageRow("move", 5, "Not A Real Move"),
      usageRow("move", 2, "Aura Sphere"), usageRow("move", 4, "Body Press"), usageRow("held_item", 1, "Blastoisinite"),
      usageRow("ability", 1, "Torrent"),
      { ...usageRow("stat_alignment", 1, "Modest"), statUp: "Sp. Atk", statDown: "Attack" },
      { ...usageRow("stat_points", 1, ""), ap: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 } },
    ]);
    expect(recommendedItemId(usage)).toBe("blastoisinite");
    expect(recommendedMoveIds(usage, selected)).toEqual(["aqua-jet", "aura-sphere", "aqua-tail", "body-press"]);
    expect(recommendedAbilityId(usage, selected)).toBe("torrent");
    expect(recommendedNature(usage)).toMatchObject({ name: "Modest", up: "specialAttack", down: "attack" });
    expect(recommendedAp(usage)).toEqual({ hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 });
  });

  it("rejects invalid upstream AP spreads", () => {
    const usage = usageFixture([{ ...usageRow("stat_points", 1, ""), ap: { hp: 3, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 } }]);
    expect(recommendedAp(usage)).toBeNull();
  });
});

describe("saved team migration", () => {
  const member = { id: "one", pokemonId: "absol", moveIds: [], abilityId: null, itemId: null, ap: { ...ZERO_STATS }, nature: { name: "Serious", up: null, down: null } } satisfies TeamMember;
  it("preserves the legacy team as Doubles and keeps new Singles/Doubles groups separate", () => {
    expect(migrateSavedTeams({ version: 1, members: [member] })).toEqual({ singles: [], doubles: [member] });
    expect(migrateSavedTeams({ version: 2, teams: { singles: [member], doubles: [] } })).toEqual({ singles: [member], doubles: [] });
  });
});

describe("champions-v1 stat formula golden fixtures", () => {
  it("matches the Mega Charizard X Adamant reference build", () => {
    const base = pokemonById.get("mega-charizard-x")!.baseStats;
    expect(calculateFinalStats(base, { hp: 2, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 }, { name: "Adamant", up: "attack", down: "specialAttack" })).toEqual({ hp: 155, attack: 200, defense: 131, specialAttack: 135, specialDefense: 105, speed: 152 });
  });

  it("matches the zero-AP Garchomp Champions values", () => {
    const base = pokemonById.get("garchomp")!.baseStats;
    expect(calculateFinalStats(base, ZERO_STATS, { name: "Serious", up: null, down: null })).toEqual({ hp: 183, attack: 150, defense: 115, specialAttack: 100, specialDefense: 105, speed: 122 });
  });
});

describe("AP validation", () => {
  it("allows 66 total and rejects 67 or a per-stat value above 32", () => {
    expect(validateAp({ hp: 2, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 })).toEqual([]);
    expect(validateAp({ hp: 3, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 }).map((x) => x.code)).toContain("AP_TOTAL_EXCEEDED");
    expect(validateAp({ ...ZERO_STATS, speed: 33 }).map((x) => x.code)).toContain("AP_OUT_OF_RANGE");
  });
});

describe("Champions natures", () => {
  it("exposes the 21 supported natures with every modifying stat pair", () => {
    expect(NATURES).toHaveLength(21);
    expect(NATURES.filter((nature) => nature.up === null && nature.down === null).map((nature) => nature.name)).toEqual(["Serious"]);
    const modifying = NATURES.filter((nature) => nature.up && nature.down);
    expect(modifying).toHaveLength(20);
    expect(new Set(modifying.map((nature) => `${nature.up}:${nature.down}`)).size).toBe(20);
    expect(NATURES.find((nature) => nature.name === "Adamant")).toMatchObject({ nameZh: "固執", up: "attack", down: "specialAttack" });
  });
});

describe("defensive type matchups", () => {
  it("combines both defensive types, including 4x, quarter resistance, and immunity", () => {
    const aggron = defensiveMatchups(["Steel", "Rock"]);
    expect(aggron.weak).toEqual(expect.arrayContaining([{ type: "Fighting", multiplier: 4 }, { type: "Ground", multiplier: 4 }, { type: "Water", multiplier: 2 }]));
    expect(aggron.immune).toContainEqual({ type: "Poison", multiplier: 0 });
    expect(aggron.resistant).toContainEqual({ type: "Normal", multiplier: .25 });
    expect(formatMultiplier(.25)).toBe("¼×");

    const aerodactyl = defensiveMatchups(["Rock", "Flying"]);
    expect(aerodactyl.immune).toContainEqual({ type: "Ground", multiplier: 0 });
    expect(aerodactyl.weak).toContainEqual({ type: "Electric", multiplier: 2 });
  });

  it("exposes every single-type attack/defense multiplier for the full chart", () => {
    expect(typeEffectiveness("Fire", "Grass")).toBe(2);
    expect(typeEffectiveness("Electric", "Ground")).toBe(0);
    expect(typeEffectiveness("Normal", "Normal")).toBe(1);
  });
});

describe("priority", () => {
  it("classifies and formats signed values", () => {
    const quickAttack = moves.find((move) => move.id === "quick-attack")!;
    const trickRoom = moves.find((move) => move.id === "trick-room")!;
    expect(priorityMatches(quickAttack, ["positive"])).toBe(true);
    expect(priorityMatches(quickAttack, ["negative"])).toBe(false);
    expect(priorityMatches(trickRoom, ["negative"])).toBe(true);
    expect(formatPriority(2)).toBe("+2");
    expect(formatPriority(-7)).toBe("-7");
  });
});

describe("team legality", () => {
  const member = (id: string, pokemonId: string, itemId: string | null): TeamMember => ({ id, pokemonId, itemId, abilityId: null, moveIds: [], ap: { ...ZERO_STATS }, nature: { name: "Serious", up: null, down: null } });
  it("rejects duplicate species and items but permits distinct Mega species", () => {
    const issues = validateTeam([member("a", "charizard", "life-orb"), member("b", "charizard", "life-orb")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["DUPLICATE_POKEMON", "DUPLICATE_ITEM"]));
    const legal = validateTeam([member("a", "mega-charizard-x", "charizardite-x"), member("b", "mega-charizard-y", "charizardite-y")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    expect(legal).toEqual([]);
  });

  it("rejects a base form with any of its Mega forms while permitting two distinct Mega branches", () => {
    const baseAndMega = validateTeam([member("a", "alakazam", "sitrus-berry"), member("b", "mega-alakazam", "alakazite")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    expect(baseAndMega.map((issue) => issue.code)).toContain("DUPLICATE_POKEMON");
    const twoMegaBranches = validateTeam([member("a", "mega-charizard-x", "charizardite-x"), member("b", "mega-charizard-y", "charizardite-y")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    expect(twoMegaBranches).toEqual([]);
  });

  it("removes persisted base/Mega conflicts while preserving distinct Mega branches", () => {
    const sanitized = sanitizeTeamMembers([
      member("base", "charizard", null), member("mega-x", "mega-charizard-x", "charizardite-x"), member("mega-y", "mega-charizard-y", "charizardite-y"),
    ], pokemonById);
    expect(sanitized.map((entry) => entry.id)).toEqual(["base"]);
    const megasOnly = sanitizeTeamMembers([member("mega-x", "mega-charizard-x", "charizardite-x"), member("mega-y", "mega-charizard-y", "charizardite-y")], pokemonById);
    expect(megasOnly).toHaveLength(2);
  });

  it("forces every Mega form to hold its dedicated stone", () => {
    const missing = validateTeam([member("a", "mega-absol", null)], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    const wrong = validateTeam([member("b", "mega-absol", "life-orb")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    const legal = validateTeam([member("c", "mega-absol", "absolite")], pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
    expect(missing.map((issue) => issue.code)).toContain("MEGA_STONE_REQUIRED");
    expect(wrong.map((issue) => issue.code)).toContain("MEGA_STONE_REQUIRED");
    expect(legal).toEqual([]);
    expect(pokemon.filter((entry) => entry.isMega).every((entry) => megaStoneIdByPokemonId.has(entry.id))).toBe(true);
  });
});

describe("speed modifiers", () => {
  it("applies stages and item multipliers once", () => {
    expect(modifiedSpeed(100, 1, 1.5)).toBe(225);
    expect(modifiedSpeed(100, -1, 1)).toBe(66);
  });
});

describe("admin allowlist", () => {
  it("normalizes case and denies an empty allowlist", () => {
    expect([...parseAdminEmails(" Owner@Example.com,ops@example.com ")]).toEqual(["owner@example.com", "ops@example.com"]);
    expect(isAdminEmail("OWNER@example.com", "owner@example.com")).toBe(true);
    expect(isAdminEmail("owner@example.com", undefined)).toBe(false);
  });
});

describe("normalized current-regulation catalog", () => {
  it("includes expanded forms, mapped abilities, and observed held items", () => {
    expect(pokemon.length).toBeGreaterThanOrEqual(300);
    expect(abilities.length).toBeGreaterThanOrEqual(190);
    expect(items.length).toBeGreaterThanOrEqual(60);
    expect(pokemonById.get("garchomp")?.abilityIds).toEqual(expect.arrayContaining(["rough-skin", "sand-veil"]));
    expect(pokemonById.get("mega-charizard-y")?.abilityIds).toContain("drought");
    expect(moves.find((move) => move.id === "fire-punch")?.flags).toContain("Contact");
    expect(moves.find((move) => move.id === "parting-shot")?.flags).toContain("Sound");
    expect(moves.find((move) => move.id === "air-slash")?.flags).toContain("Slicing");
    expect(items.find((item) => item.id === "charizardite-x")?.category).toBe("Mega Stone");
  });

  it("derives useful ability and item effect facets without inventing upstream fields", () => {
    expect(abilityCategories(abilities.find((ability) => ability.id === "drought")!)).toContain("Weather");
    expect(itemEffectCategories(items.find((item) => item.id === "leftovers")!)).toContain("HP Recovery");
  });

  it("builds reverse move and ability indexes from legal forms", () => {
    expect(pokemonByMoveId.get("dragon-claw")?.map((entry) => entry.id)).toEqual(expect.arrayContaining(["garchomp", "mega-charizard-x"]));
    expect(pokemonByAbilityId.get("rough-skin")?.map((entry) => entry.id)).toContain("garchomp");
    expect(pokemonByMoveId.get("dragon-claw")?.length).toBeGreaterThan(1);
  });
});
