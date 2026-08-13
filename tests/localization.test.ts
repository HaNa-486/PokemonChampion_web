import { describe, expect, it } from "vitest";
import snapshot from "../data/generated/champions-snapshot.json";
import { localizedTerm } from "../lib/localization";

describe("Traditional Chinese catalog completeness", () => {
  it("has an official Chinese display name for every legal Pokémon form", () => {
    expect(snapshot.pokemon).toHaveLength(358);
    for (const entry of snapshot.pokemon) {
      expect(entry.nameZh, entry.id).toBeTruthy();
      expect(entry.nameZh, entry.id).not.toBe(entry.name);
      expect(entry.nameZh, entry.id).toMatch(/[\u3400-\u9fff]/u);
    }
    expect(snapshot.pokemon.find((entry) => entry.id === "abomasnow")?.nameZh).toBe("暴雪王");
    expect(snapshot.pokemon.find((entry) => entry.id === "alolan-ninetales")?.nameZh).toBe("阿羅拉九尾");
    expect(snapshot.pokemon.find((entry) => entry.id === "mega-charizard-x")?.nameZh).toBe("超級噴火龍 Ｘ");
  });

  it.each(["moves", "abilities", "items"] as const)("has non-English Chinese descriptions for every %s entry", (section) => {
    for (const entry of snapshot[section]) {
      expect(entry.nameZh, `${section}:${entry.id}:name`).toBeTruthy();
      expect(entry.nameZh, `${section}:${entry.id}:name`).not.toBe(entry.name);
      expect(entry.descriptionZh, `${section}:${entry.id}:description`).toBeTruthy();
      expect(entry.descriptionZh, `${section}:${entry.id}:description`).not.toBe(entry.description);
      expect(entry.descriptionZh, `${section}:${entry.id}:description`).toMatch(/[\u3400-\u9fff]/u);
      expect(entry.localizationSource, `${section}:${entry.id}:source`).not.toBe("english-fallback");
    }
  });

  it("localizes filter taxonomy without changing stored filter keys", () => {
    expect(localizedTerm("Fire", "zh-Hant")).toBe("火");
    expect(localizedTerm("Physical", "zh-Hant")).toBe("物理");
    expect(localizedTerm("All foes", "zh-Hant")).toBe("所有對手");
    expect(localizedTerm("Contact", "zh-Hant")).toBe("接觸");
    expect(localizedTerm("Mega Stone", "zh-Hant")).toBe("超級石");
    expect(localizedTerm("Fire", "en")).toBe("Fire");
  });
});
