import { describe, expect, it } from "vitest";
import { normalizeBattleUsage } from "../lib/battle-data";

describe("Champions battle data normalization", () => {
  it("keeps category ranks, percentages, natures, and AP spreads", () => {
    const result = normalizeBattleUsage({ pokemon: "Garchomp", format: "Doubles", season: "Current", rows: [
      { category: "move", rank: 1, name: "Earthquake", percentage: "82.5%", percentage_value: 82.5 },
      { category: "stat_alignment", rank: 1, name: "Jolly", stat_up: "Speed", stat_down: "Sp. Atk", percentage: "33.9%" },
      { category: "stat_points", rank: 1, hp_points: 2, attack_points: 32, defense_points: 0, sp_atk_points: 0, sp_def_points: 0, speed_points: 32, percentage: "52.6%" },
    ] }, "Doubles");
    expect(result.rows[0]).toMatchObject({ category: "move", rank: 1, name: "Earthquake", percentageValue: 82.5 });
    expect(result.rows[1]).toMatchObject({ statUp: "Speed", statDown: "Sp. Atk" });
    expect(result.rows[2].ap).toEqual({ hp: 2, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 });
    expect(result.rankGaps).toEqual([]);
  });

  it("reports missing upstream ranks without renumbering the remaining rows", () => {
    const result = normalizeBattleUsage({ pokemon: "Clefable", format: "Doubles", rows: [
      { category: "move", rank: 6, name: "Cosmic Power", percentage: "15.3%" },
      { category: "move", rank: 7, name: "Dazzling Gleam", percentage: "14.1%" },
      { category: "move", rank: 8, name: "Moonlight", percentage: "13.4%" },
      { category: "move", rank: 9, name: "Stored Power", percentage: "10.0%" },
      { category: "move", rank: 10, name: "Heal Pulse", percentage: "8.9%" },
    ] }, "Doubles");
    expect(result.rows.map((row) => row.rank)).toEqual([6, 7, 8, 9, 10]);
    expect(result.rankGaps).toEqual([{ category: "move", missingRanks: [1, 2, 3, 4, 5] }]);
  });
});
