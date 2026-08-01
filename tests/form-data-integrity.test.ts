import { describe, expect, it } from "vitest";
import { pokemonById } from "../lib/catalog";

const expectedBattleKeys: Record<string, string> = {
  "alolan-ninetales": "ninetalesalola",
  ninetales: "ninetales",
  "alolan-raichu": "raichualola",
  raichu: "raichu",
  "galarian-slowking": "slowkinggalar",
  slowking: "slowking",
  "galarian-stunfisk": "stunfiskgalar",
  stunfisk: "stunfisk",
  "basculegion-female": "basculegionf",
  "basculegion-male": "basculegion",
  "meowstic-female": "meowsticf",
  meowstic: "meowstic",
  "paldean-tauros-aqua-breed": "taurospaldeaaqua",
  "paldean-tauros-blaze-breed": "taurospaldeablaze",
  "paldean-tauros-combat-breed": "taurospaldeacombat",
  tauros: "tauros",
  "rotom-wash": "rotomwash",
  "rotom-heat": "rotomheat",
  "rotom-mow": "rotommow",
  "rotom-frost": "rotomfrost",
  "rotom-fan": "rotomfan",
  rotom: "rotom",
};

describe("form-specific catalog integrity", () => {
  it("keeps regional, gender, breed, and appliance forms on distinct battle sources", () => {
    for (const [id, battleDataKey] of Object.entries(expectedBattleKeys)) {
      expect(pokemonById.get(id), `${id} should exist`).toBeDefined();
      expect(pokemonById.get(id)?.battleDataKey, `${id} battle source`).toBe(battleDataKey);
    }
  });

  it("does not overwrite Alolan Ninetales with the regular Ninetales catalog data", () => {
    const alolan = pokemonById.get("alolan-ninetales");
    const regular = pokemonById.get("ninetales");
    expect(alolan?.speciesKey).toBe(regular?.speciesKey);
    expect(alolan?.battleDataKey).not.toBe(regular?.battleDataKey);
    expect(alolan?.types).toEqual(["Ice", "Fairy"]);
    expect(regular?.types).toEqual(["Fire"]);
    expect(alolan?.abilityIds).toEqual(expect.arrayContaining(["snow-cloak", "snow-warning"]));
    expect(regular?.abilityIds).toEqual(expect.arrayContaining(["flash-fire", "drought"]));
    expect(alolan?.moveIds).toContain("aurora-veil");
    expect(regular?.moveIds).not.toContain("aurora-veil");
  });
});
