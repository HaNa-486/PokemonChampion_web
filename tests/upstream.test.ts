import { describe, expect, it } from "vitest";
import { matchChampionsSourceForForm, normalizeChampionsPokemon, parseCsv } from "../scripts/sync-upstream.mjs";

describe("upstream adapters", () => {
  it("parses quoted CSV fields and escaped quotes", () => {
    expect(parseCsv('id,name,description\r\n1,Protect,"Stops, then says ""safe""."\r\n')).toEqual([
      { id: "1", name: "Protect", description: 'Stops, then says "safe".' },
    ]);
  });

  it("normalizes Champions paths and derives raw stats", () => {
    const result = normalizeChampionsPokemon({
      name: "Garchomp", slug: "garchomp", showdownId: "garchomp", savedName: "Garchomp",
      learnableMoveNames: ["Dragon Claw"],
      summary: { sprite: "pokemon_champions_assets\\pokemon\\Garchomp.png", types: ["Dragon", "Ground"], baseStats: { hp: 183, attack: 150, defense: 115, specialAttack: 100, specialDefense: 105, speed: 122 } },
    });
    expect(result.baseStats).toEqual({ hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 });
    expect(result.imageUrl).toBe("https://championsbattledata.com/pokemon_champions_assets/pokemon/Garchomp.png");
    expect(result.battleDataKey).toBe("garchomp");
  });

  it("maps regional metadata rows to their own Showdown battle keys", () => {
    const entries = [
      { name: "Alolan Ninetales", slug: "alolan-ninetales", showdownId: "ninetalesalola" },
      { name: "Ninetales", slug: "ninetales", showdownId: "ninetales" },
    ];
    expect(matchChampionsSourceForForm({ saved_name: "Alolan Ninetales", base_name: "Ninetales" }, entries)?.showdownId).toBe("ninetalesalola");
    expect(matchChampionsSourceForForm({ saved_name: "Ninetales", base_name: "Ninetales" }, entries)?.showdownId).toBe("ninetales");
  });

  it("only lets an unindexed Mega form inherit its base form source", () => {
    const entries = [
      { name: "Alolan Raichu", slug: "alolan-raichu", showdownId: "raichualola" },
      { name: "Raichu", slug: "raichu", showdownId: "raichu" },
    ];
    expect(matchChampionsSourceForForm({ saved_name: "Mega Raichu X", base_name: "Raichu" }, entries)?.showdownId).toBe("raichu");
    expect(matchChampionsSourceForForm({ saved_name: "Unknown Form", base_name: "Raichu" }, entries)).toBeNull();
  });
});
