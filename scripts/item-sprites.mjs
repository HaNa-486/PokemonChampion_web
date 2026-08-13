import { copyFile, mkdir, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const ITEM_SPRITES_REPOSITORY = "PokeAPI/sprites";
const ITEM_SPRITES_PREFIX = "sprites/items";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_JSON_BYTES = 16 * 1024 * 1024;
const MAX_PNG_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

function assertRevision(revision) {
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error(`Invalid PokeAPI sprites revision: ${revision}`);
}

function isPng(buffer) {
  return buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

async function fetchBytes(url, { accept, maxBytes }) {
  const response = await fetch(url, {
    headers: { accept, "user-agent": "ChampionsLabSync/0.1 (+https://championsbattledata.com/)" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) throw new Error(`Response is too large (${declaredLength} bytes): ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) throw new Error(`Response is too large (${buffer.length} bytes): ${url}`);
  return { buffer, contentType: response.headers.get("content-type") ?? "" };
}

async function fetchJson(url) {
  const { buffer, contentType } = await fetchBytes(url, { accept: "application/vnd.github+json", maxBytes: MAX_JSON_BYTES });
  if (!contentType.toLowerCase().includes("json")) throw new Error(`Expected JSON from ${url}, received ${contentType || "an unknown content type"}.`);
  return JSON.parse(buffer.toString("utf8"));
}

export function resolveItemSpritePath(id, availablePaths) {
  const paths = availablePaths instanceof Set ? availablePaths : new Set(availablePaths);
  const candidates = [`${ITEM_SPRITES_PREFIX}/${id}.png`, `${ITEM_SPRITES_PREFIX}/gen9/${id}.png`];
  return candidates.find((candidate) => paths.has(candidate)) ?? null;
}

export async function fetchItemSpritePaths(revision) {
  assertRevision(revision);
  const apiRoot = `https://api.github.com/repos/${ITEM_SPRITES_REPOSITORY}/git/trees`;
  let tree = await fetchJson(`${apiRoot}/${revision}`);
  for (const segment of ["sprites", "items"]) {
    const entry = tree.tree?.find((candidate) => candidate.type === "tree" && candidate.path === segment);
    if (!entry?.sha) throw new Error(`Could not resolve ${ITEM_SPRITES_PREFIX} at PokeAPI sprites revision ${revision}.`);
    tree = await fetchJson(`${apiRoot}/${entry.sha}`);
  }
  const recursive = await fetchJson(`${apiRoot}/${tree.sha}?recursive=1`);
  if (recursive.truncated) throw new Error(`PokeAPI item sprite tree was truncated at revision ${revision}.`);
  return new Set((recursive.tree ?? [])
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string" && entry.path.endsWith(".png"))
    .map((entry) => `${ITEM_SPRITES_PREFIX}/${entry.path}`));
}

export function createItemSpriteManifest(items, revision, availablePaths, generatedAt = new Date().toISOString()) {
  assertRevision(revision);
  const entries = /** @type {Record<string, { imageUrl: string, sourcePath: string }>} */ ({});
  const missing = [];
  for (const item of [...items].sort((left, right) => left.id.localeCompare(right.id, "en"))) {
    const sourcePath = resolveItemSpritePath(item.id, availablePaths);
    if (!sourcePath) { missing.push(item.id); continue; }
    entries[item.id] = { imageUrl: `/items/${item.id}.png`, sourcePath };
  }
  return {
    schemaVersion: 1,
    generatedAt,
    source: {
      repository: `https://github.com/${ITEM_SPRITES_REPOSITORY}`,
      revision,
      purpose: "Held-item sprites",
      directories: [`${ITEM_SPRITES_PREFIX}/`, `${ITEM_SPRITES_PREFIX}/gen9/`],
    },
    counts: { items: items.length, available: Object.keys(entries).length, missing: missing.length },
    items: entries,
    missing,
  };
}

export function manifestMatchesItems(items, manifest, revision) {
  if (manifest?.schemaVersion !== 1 || manifest?.source?.revision !== revision) return false;
  const expectedIds = new Set(items.map((item) => item.id));
  const manifestIds = [...Object.keys(manifest.items ?? {}), ...(manifest.missing ?? [])];
  return manifestIds.length === expectedIds.size && manifestIds.every((id) => expectedIds.has(id));
}

export async function auditItemSpriteAssets(manifest, projectRoot = process.cwd()) {
  const missing = [];
  const invalid = [];
  const entries = Object.entries(manifest?.items ?? {});
  const unavailable = Array.isArray(manifest?.missing) ? manifest.missing : [];
  const availableIds = new Set(entries.map(([id]) => id));
  const allIds = [...availableIds, ...unavailable];
  const countsAreValid = manifest?.counts?.items === allIds.length
    && manifest?.counts?.available === entries.length
    && manifest?.counts?.missing === unavailable.length;
  if (manifest?.schemaVersion !== 1 || !/^[0-9a-f]{40}$/.test(manifest?.source?.revision ?? "") || !countsAreValid) invalid.push("manifest");
  for (const id of unavailable) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || availableIds.has(id)) invalid.push(id);
  }
  if (new Set(allIds).size !== allIds.length) invalid.push("manifest");
  for (const [id, entry] of entries) {
    const expectedUrl = `/items/${id}.png`;
    const allowedSourcePaths = new Set([`${ITEM_SPRITES_PREFIX}/${id}.png`, `${ITEM_SPRITES_PREFIX}/gen9/${id}.png`]);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || entry?.imageUrl !== expectedUrl || !allowedSourcePaths.has(entry?.sourcePath)) { invalid.push(id); continue; }
    const filePath = path.join(projectRoot, "public", ...expectedUrl.split("/").filter(Boolean));
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat) missing.push(id);
    else if (!fileStat.isFile() || fileStat.size > MAX_PNG_BYTES) invalid.push(id);
    else if (!isPng(await readFile(filePath))) invalid.push(id);
  }
  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid: [...new Set(invalid)] };
}

async function mapLimit(values, concurrency, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) { const index = cursor++; results[index] = await mapper(values[index], index); }
  }));
  return results;
}

export async function stageItemSpriteAssets(manifest, { projectRoot = process.cwd(), force = false } = {}) {
  assertRevision(manifest.source.revision);
  const destinationRoot = path.join(projectRoot, "public", "items");
  const swapId = `${process.pid}-${Date.now()}`;
  const stagingRoot = path.join(projectRoot, "public", `.items-sync-${swapId}`);
  await mkdir(stagingRoot, { recursive: false });
  let results;
  try {
    results = await mapLimit(Object.entries(manifest.items), 8, async ([id, entry], index) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Unsafe item sprite id: ${id}`);
      if (!entry.sourcePath.startsWith(`${ITEM_SPRITES_PREFIX}/`) || !entry.sourcePath.endsWith(`/${id}.png`)) {
        throw new Error(`Unsafe item sprite source path for ${id}: ${entry.sourcePath}`);
      }
      const existingPath = path.join(destinationRoot, `${id}.png`);
      const destination = path.join(stagingRoot, `${id}.png`);
      const existingStat = await stat(existingPath).catch(() => null);
      const existing = existingStat?.isFile() && existingStat.size <= MAX_PNG_BYTES ? await readFile(existingPath) : null;
      if (!force && existing && existing.length <= MAX_PNG_BYTES && isPng(existing)) {
        await copyFile(existingPath, destination);
        return "unchanged";
      }
      const url = `https://raw.githubusercontent.com/${ITEM_SPRITES_REPOSITORY}/${manifest.source.revision}/${entry.sourcePath}`;
      const { buffer, contentType } = await fetchBytes(url, { accept: "image/png", maxBytes: MAX_PNG_BYTES });
      if (!contentType.toLowerCase().includes("image/png") || !isPng(buffer)) throw new Error(`Invalid PNG response for ${id}: ${url}`);
      const temporary = `${destination}.tmp-${index}`;
      try {
        await writeFile(temporary, buffer, { flag: "wx" });
        await rename(temporary, destination);
      } catch (error) {
        await unlink(temporary).catch(() => undefined);
        throw error;
      }
      return existing?.equals(buffer) ? "unchanged" : "downloaded";
    });
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }
  return {
    destination: destinationRoot,
    staged: stagingRoot,
    stats: {
      downloaded: results.filter((result) => result === "downloaded").length,
      unchanged: results.filter((result) => result === "unchanged").length,
      unavailable: manifest.missing.length,
    },
  };
}

function commonParentDirectory(destinations) {
  let candidate = path.dirname(path.resolve(destinations[0]));
  const resolved = destinations.map((destination) => path.resolve(destination));
  while (!resolved.every((destination) => destination.startsWith(`${candidate}${path.sep}`))) {
    const parent = path.dirname(candidate);
    if (parent === candidate) return parent;
    candidate = parent;
  }
  return candidate;
}

export async function publishStagedPathsAtomically(entries, {
  cleanupBackups = (target) => rm(target, { recursive: true, force: true }),
  restoreBackup = (backup, destination) => rename(backup, destination),
} = {}) {
  if (!entries.length) return;
  const transactionId = `${process.pid}-${Date.now()}`;
  const backupRoot = path.join(commonParentDirectory(entries.map((entry) => entry.destination)), `.generated-data-backup-${transactionId}`);
  await mkdir(backupRoot, { recursive: false });
  const activated = [];
  let restoreFailed = false;
  try {
    for (const [index, entry] of entries.entries()) {
      const destination = path.resolve(entry.destination);
      const staged = path.resolve(entry.staged);
      if (destination === staged) throw new Error(`Staged path must differ from its destination: ${destination}`);
      const backup = path.join(backupRoot, String(index));
      const hadPrevious = await rename(destination, backup).then(() => true).catch((error) => {
        if (error?.code === "ENOENT") return false;
        throw error;
      });
      try {
        await rename(staged, destination);
      } catch (error) {
        if (hadPrevious) {
          try { await restoreBackup(backup, destination); }
          catch (restoreError) {
            restoreFailed = true;
            throw new AggregateError([error, restoreError], `Could not publish or restore ${destination}.`);
          }
        }
        throw error;
      }
      activated.push({ destination, backup, hadPrevious });
    }
  } catch (error) {
    const rollbackErrors = [error];
    for (const entry of activated.reverse()) {
      try {
        await rm(entry.destination, { recursive: true, force: true });
        if (entry.hadPrevious) await restoreBackup(entry.backup, entry.destination);
      } catch (rollbackError) {
        restoreFailed = true;
        rollbackErrors.push(rollbackError);
      }
    }
    await Promise.all(entries.map((entry) => rm(entry.staged, { recursive: true, force: true }).catch((cleanupError) => rollbackErrors.push(cleanupError))));
    if (!restoreFailed && rollbackErrors.length === 1) await rm(backupRoot, { recursive: true, force: true });
    else throw new AggregateError(rollbackErrors, `Generated data publication failed and rollback was incomplete; recovery files remain in ${backupRoot}.`);
    throw error;
  }
  try { await cleanupBackups(backupRoot); }
  catch (error) { console.warn(`Generated data was committed, but backup cleanup must be retried for ${backupRoot}: ${error instanceof Error ? error.message : error}`); }
}
