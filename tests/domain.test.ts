import { describe, expect, it } from "vitest";
import { abilities, items, megaStoneIdByPokemonId, moves, pokemon, pokemonByAbilityId, pokemonById, pokemonByMoveId } from "../lib/catalog";
import { calculateFinalStats, formatPriority, modifiedSpeed, priorityMatches, validateAp, validateTeam, ZERO_STATS } from "../lib/domain";
import type { TeamMember } from "../lib/types";
import { isAdminEmail, parseAdminEmails } from "../lib/admin-auth";
import { abilityCategories, itemEffectCategories } from "../lib/filtering";

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
