import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { auditItemSpriteAssets, publishStagedPathsAtomically, stageItemSpriteAssets, type ItemSpriteManifest } from "../scripts/item-sprites.mjs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const roots: string[] = [];

async function temporaryRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "champions-item-sprites-"));
  roots.push(root);
  return root;
}

function manifest(): ItemSpriteManifest {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-12T00:00:00.000Z",
    source: { repository: "https://github.com/PokeAPI/sprites", revision: "a".repeat(40), purpose: "Held-item sprites", directories: ["sprites/items/", "sprites/items/gen9/"] },
    counts: { items: 2, available: 1, missing: 1 },
    items: { leftovers: { imageUrl: "/items/leftovers.png", sourcePath: "sprites/items/leftovers.png" } },
    missing: ["not-yet-available"],
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("held-item sprite publication", () => {
  it("stages existing valid assets without a network request", async () => {
    const root = await temporaryRoot();
    await mkdir(path.join(root, "public", "items"), { recursive: true });
    await writeFile(path.join(root, "public", "items", "leftovers.png"), PNG_SIGNATURE);
    const staged = await stageItemSpriteAssets(manifest(), { projectRoot: root });
    expect(staged.stats).toEqual({ downloaded: 0, unchanged: 1, unavailable: 1 });
    expect(await readFile(path.join(staged.staged, "leftovers.png"))).toEqual(PNG_SIGNATURE);
    await rm(staged.staged, { recursive: true, force: true });
  });

  it("publishes multiple generated paths together", async () => {
    const root = await temporaryRoot();
    const catalog = path.join(root, "catalog.json");
    const stagedCatalog = path.join(root, "catalog.stage.json");
    const assets = path.join(root, "items");
    const stagedAssets = path.join(root, "items.stage");
    await writeFile(catalog, "old catalog");
    await writeFile(stagedCatalog, "new catalog");
    await mkdir(assets);
    await writeFile(path.join(assets, "old.png"), "old asset");
    await mkdir(stagedAssets);
    await writeFile(path.join(stagedAssets, "new.png"), "new asset");

    await publishStagedPathsAtomically([
      { destination: assets, staged: stagedAssets },
      { destination: catalog, staged: stagedCatalog },
    ]);

    expect(await readFile(catalog, "utf8")).toBe("new catalog");
    expect(await readdir(assets)).toEqual(["new.png"]);
  });

  it("restores every previous path when a later activation fails", async () => {
    const root = await temporaryRoot();
    const first = path.join(root, "first.txt");
    const stagedFirst = path.join(root, "first.stage.txt");
    const second = path.join(root, "second.txt");
    await writeFile(first, "old first");
    await writeFile(stagedFirst, "new first");
    await writeFile(second, "old second");

    await expect(publishStagedPathsAtomically([
      { destination: first, staged: stagedFirst },
      { destination: second, staged: path.join(root, "missing.stage.txt") },
    ])).rejects.toThrow();

    expect(await readFile(first, "utf8")).toBe("old first");
    expect(await readFile(second, "utf8")).toBe("old second");
    expect((await readdir(root)).some((name) => name.startsWith(".generated-data-backup-"))).toBe(false);
  });

  it("keeps a committed transaction successful when backup cleanup must be retried", async () => {
    const root = await temporaryRoot();
    const destination = path.join(root, "catalog.json");
    const staged = path.join(root, "catalog.stage.json");
    await writeFile(destination, "old catalog");
    await writeFile(staged, "new catalog");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(publishStagedPathsAtomically(
      [{ destination, staged }],
      { cleanupBackups: async () => { throw new Error("locked"); } },
    )).resolves.toBeUndefined();

    expect(await readFile(destination, "utf8")).toBe("new catalog");
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("backup cleanup must be retried"));
    warning.mockRestore();
  });
});

describe("held-item sprite audit", () => {
  it("accepts a complete mutually exclusive manifest", async () => {
    const root = await temporaryRoot();
    await mkdir(path.join(root, "public", "items"), { recursive: true });
    await writeFile(path.join(root, "public", "items", "leftovers.png"), PNG_SIGNATURE);
    await expect(auditItemSpriteAssets(manifest(), root)).resolves.toEqual({ valid: true, missing: [], invalid: [] });
  });

  it("rejects unsafe paths, inconsistent counts, duplicate states, and oversized PNGs", async () => {
    const root = await temporaryRoot();
    await mkdir(path.join(root, "public", "items"), { recursive: true });
    const oversized = Buffer.alloc(1024 * 1024 + 1);
    PNG_SIGNATURE.copy(oversized);
    await writeFile(path.join(root, "public", "items", "leftovers.png"), oversized);
    const invalid = manifest();
    invalid.items.leftovers.sourcePath = "sprites/items/nested/leftovers.png";
    invalid.missing.push("leftovers");
    invalid.counts.items = 99;

    const result = await auditItemSpriteAssets(invalid, root);
    expect(result.valid).toBe(false);
    expect(result.invalid).toEqual(expect.arrayContaining(["manifest", "leftovers"]));
  });
});
