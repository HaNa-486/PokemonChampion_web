import { describe, expect, it } from "vitest";
import { championsPp, parseShowdownTable, showdownFlags, showdownTarget, toShowdownId } from "../scripts/showdown-move-data.mjs";

describe("Pokémon Showdown Champions move adapter", () => {
  it("statically parses base and inherited Champions move records", () => {
    const base = parseShowdownTable(`export const Moves = {
      appleacid: { accuracy: 100, basePower: 80, category: "Special", name: "Apple Acid", pp: 10, priority: 0, flags: { protect: 1, mirror: 1 }, target: "normal", type: "Grass", secondary: { chance: 100, boosts: { spd: -1 } } },
    };`);
    const champions = parseShowdownTable(`export const Moves = {
      appleacid: { inherit: true, basePower: 90 },
    };`);
    expect({ ...base.get("appleacid"), ...champions.get("appleacid") }).toMatchObject({
      name: "Apple Acid", basePower: 90, accuracy: 100, pp: 10, priority: 0, target: "normal", type: "Grass",
      secondary: { chance: 100, boosts: { spd: -1 } },
    });
  });

  it("applies the Champions PP rule and cap", () => {
    expect(championsPp({ name: "Apple Acid", pp: 10 })).toBe(12);
    expect(championsPp({ name: "Protect", pp: 5 })).toBe(8);
    expect(championsPp({ name: "High PP", pp: 40 })).toBe(20);
    expect(championsPp({ name: "Fixed PP", pp: 10, noPPBoosts: true })).toBe(10);
  });

  it("exposes battle properties but excludes engine-only flags", () => {
    expect(showdownFlags({ contact: 1, protect: 1, bullet: 1, slicing: 1, metronome: 1, noassist: 1 })).toEqual([
      "Ballistics", "Contact", "Protect", "Slicing",
    ]);
  });

  it("normalizes IDs and user-facing targets", () => {
    expect(toShowdownId("King's Shield")).toBe("kingsshield");
    expect(showdownTarget("allAdjacentFoes")).toBe("All foes");
    expect(showdownTarget("normal")).toBe("1 target");
    expect(showdownTarget("future-target")).toBe("Varies");
  });
});
