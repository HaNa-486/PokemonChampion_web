import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../data/generated/item-sprites.json";
import { items } from "../lib/catalog";
import { auditItemSpriteAssets, createItemSpriteManifest, manifestMatchesItems, resolveItemSpritePath } from "../scripts/item-sprites.mjs";

describe("held-item sprite manifest", () => {
  it("resolves standard, Gen 9, and missing sprite paths without guessing", () => {
    const paths = new Set([
      "sprites/items/garchompite.png",
      "sprites/items/gen9/dragoninite.png",
      "sprites/items/gen9/raichunite-x.png",
    ]);
    expect(resolveItemSpritePath("garchompite", paths)).toBe("sprites/items/garchompite.png");
    expect(resolveItemSpritePath("dragoninite", paths)).toBe("sprites/items/gen9/dragoninite.png");
    expect(resolveItemSpritePath("raichunite-x", paths)).toBe("sprites/items/gen9/raichunite-x.png");
    expect(resolveItemSpritePath("not-a-real-item", paths)).toBeNull();
  });

  it("records unavailable items explicitly instead of producing a broken URL", () => {
    const generated = createItemSpriteManifest([{ id: "leftovers" }, { id: "not-a-real-item" }], "a".repeat(40), new Set(["sprites/items/leftovers.png"]), "2026-08-12T00:00:00.000Z");
    expect(generated.items.leftovers).toEqual({ imageUrl: "/items/leftovers.png", sourcePath: "sprites/items/leftovers.png" });
    expect(generated.items["not-a-real-item"]).toBeUndefined();
    expect(generated.missing).toEqual(["not-a-real-item"]);
    expect(manifestMatchesItems([{ id: "leftovers" }, { id: "not-a-real-item" }], generated, "a".repeat(40))).toBe(true);
  });

  it("partitions every current item and provides a valid local PNG for every Mega Stone", async () => {
    await expect(auditItemSpriteAssets(manifest)).resolves.toEqual({ valid: true, missing: [], invalid: [] });
    expect(manifest.counts.items).toBe(items.length);
    expect(manifest.counts.available + manifest.counts.missing).toBe(items.length);
    const available = manifest.items as Record<string, { imageUrl: string; sourcePath: string }>;
    const missing = new Set<string>(manifest.missing as string[]);
    const megaStones = items.filter((item) => item.category === "Mega Stone");
    expect(megaStones.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(Number(Boolean(available[item.id])) + Number(missing.has(item.id)), item.id).toBe(1);
      if (available[item.id]) {
        expect(item.imageUrl, item.id).toBe(`/items/${item.id}.png`);
        const file = path.join(process.cwd(), "public", ...item.imageUrl!.split("/").filter(Boolean));
        expect(existsSync(file), file).toBe(true);
        expect(readFileSync(file).subarray(0, 8), file).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      } else expect(item.imageUrl, item.id).toBeNull();
    }
    expect(megaStones.every((item) => Boolean(item.imageUrl))).toBe(true);
  });
});
