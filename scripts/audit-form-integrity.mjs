import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const SNAPSHOT_PATH = new URL("../data/generated/champions-snapshot.json", import.meta.url);
const CHAMPIONS_INDEX = "https://championsbattledata.com/api/index";
const CHAMPIONS_BATTLE = "https://championsbattledata.com/api/battle";

const FORM_KEY_CONTRACT = {
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

const MINIMUM_COUNTS = { pokemon: 300, moves: 500, abilities: 150, items: 148 };
const REVIEWED_LEGAL_ITEM_COUNT = 148;

export function auditSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  const pokemon = Array.isArray(snapshot?.pokemon) ? snapshot.pokemon : [];
  const moves = Array.isArray(snapshot?.moves) ? snapshot.moves : [];
  const abilities = Array.isArray(snapshot?.abilities) ? snapshot.abilities : [];
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
  const byId = new Map();

  for (const entry of pokemon) {
    if (!entry?.id || !entry?.name || !entry?.speciesKey || !entry?.battleDataKey) errors.push(`Pokemon record is missing a required identity key: ${entry?.name ?? entry?.id ?? "unknown"}`);
    if (byId.has(entry?.id)) errors.push(`Duplicate Pokemon id: ${entry.id}`);
    byId.set(entry?.id, entry);
  }

  for (const [id, expectedKey] of Object.entries(FORM_KEY_CONTRACT)) {
    const entry = byId.get(id);
    if (!entry) errors.push(`Required form is missing: ${id}`);
    else if (entry.battleDataKey !== expectedKey) errors.push(`${id} uses ${entry.battleDataKey}; expected ${expectedKey}`);
  }

  const alolan = byId.get("alolan-ninetales");
  const regular = byId.get("ninetales");
  if (alolan && regular) {
    if (alolan.speciesKey !== regular.speciesKey) errors.push("Ninetales forms must share a speciesKey for team legality.");
    if (alolan.battleDataKey === regular.battleDataKey) errors.push("Ninetales forms must not share a battleDataKey.");
    if (JSON.stringify(alolan.types) === JSON.stringify(regular.types)) errors.push("Ninetales forms unexpectedly share identical types.");
    if (JSON.stringify(alolan.abilityIds) === JSON.stringify(regular.abilityIds)) errors.push("Ninetales forms unexpectedly share identical abilities.");
    if (!alolan.moveNames?.includes("Aurora Veil") || regular.moveNames?.includes("Aurora Veil")) errors.push("Ninetales learnsets failed the Aurora Veil regression contract.");
  }

  for (const [key, minimum] of Object.entries(MINIMUM_COUNTS)) {
    const actual = Array.isArray(snapshot?.[key]) ? snapshot[key].length : 0;
    if (actual < minimum) errors.push(`${key} count collapsed to ${actual}; expected at least ${minimum}`);
    if (snapshot?.counts?.[key] !== actual) errors.push(`${key} count metadata ${snapshot?.counts?.[key]} does not match array length ${actual}`);
  }

  const moveIds = new Set();
  for (const move of moves) {
    if (!move?.id || !move?.showdownId || !move?.name) errors.push(`Move record is missing an identity key: ${move?.name ?? move?.id ?? "unknown"}`);
    if (moveIds.has(move?.id)) errors.push(`Duplicate move id: ${move.id}`);
    moveIds.add(move?.id);
    if (!move?.description?.trim()) errors.push(`Move is missing its Pokémon Showdown description: ${move?.name ?? move?.id}`);
    if (!move?.descriptionZh?.trim()) errors.push(`Move is missing its localized description fallback: ${move?.name ?? move?.id}`);
    if (!Number.isFinite(move?.pp) || move.pp <= 0) errors.push(`Move has invalid Champions PP: ${move?.name ?? move?.id}`);
    if (!Number.isFinite(move?.priority) || !move?.target || !Array.isArray(move?.flags)) errors.push(`Move mechanics are incomplete: ${move?.name ?? move?.id}`);
  }

  const appleAcid = moves.find((move) => move.id === "apple-acid");
  if (!appleAcid) errors.push("Apple Acid is missing from the legal move catalog.");
  else {
    if (appleAcid.power !== 90 || appleAcid.accuracy !== 100 || appleAcid.pp !== 12) errors.push("Apple Acid does not match the Pokémon Showdown Champions contract (Power 90, Accuracy 100, PP 12).");
    if (!/Special Defense by 1 stage/i.test(appleAcid.description)) errors.push("Apple Acid is missing its verified Special Defense effect description.");
  }

  for (const [kind, entries] of [["Ability", abilities], ["Held item", items]]) {
    const ids = new Set();
    for (const entry of entries) {
      if (!entry?.id || !entry?.showdownId || !entry?.name) errors.push(`${kind} record is missing an identity key: ${entry?.name ?? entry?.id ?? "unknown"}`);
      if (ids.has(entry?.id)) errors.push(`Duplicate ${kind.toLowerCase()} id: ${entry.id}`);
      ids.add(entry?.id);
      if (!entry?.description?.trim()) errors.push(`${kind} is missing its Pokémon Showdown description: ${entry?.name ?? entry?.id}`);
      if (!entry?.descriptionZh?.trim()) errors.push(`${kind} is missing its localized description fallback: ${entry?.name ?? entry?.id}`);
      if (!entry?.mechanicsSource || !entry?.descriptionSource || !entry?.localizationSource || !entry?.nameLocalizationSource) errors.push(`${kind} provenance is incomplete: ${entry?.name ?? entry?.id}`);
    }
  }

  const healer = abilities.find((entry) => entry.id === "healer");
  if (!healer || !/50% chance/i.test(healer.description)) errors.push("Healer does not use the Champions 50% cure chance description.");
  const unseenFist = abilities.find((entry) => entry.id === "unseen-fist");
  if (!unseenFist || !/1\/4 the usual damage/i.test(unseenFist.description)) errors.push("Unseen Fist is missing its Champions protection damage restriction.");
  const fairyFeather = items.find((entry) => entry.id === "fairy-feather");
  if (!fairyFeather?.description?.trim()) errors.push("Fairy Feather is missing its held-item description.");
  const slowbronite = items.find((entry) => entry.id === "slowbronite");
  if (!slowbronite || !/not Galarian Slowbro/i.test(slowbronite.description)) errors.push("Slowbronite is missing its Champions form restriction.");
  if (items.length !== REVIEWED_LEGAL_ITEM_COUNT) errors.push(`Champions legal held-item catalog has ${items.length} entries; expected the reviewed pinned-source count ${REVIEWED_LEGAL_ITEM_COUNT}.`);
  for (const requiredId of ["big-root", "focus-band", "hard-stone", "icy-rock", "iron-ball"]) {
    if (!items.some((entry) => entry.id === requiredId)) errors.push(`Legal low-usage held item is missing: ${requiredId}`);
  }

  if (snapshot?.schemaVersion !== 7) errors.push(`Snapshot schemaVersion ${snapshot?.schemaVersion} is not the complete Champions entity and localization schema v7.`);
  if (!snapshot?.sources?.champions?.dataVersion) errors.push("Champions dataVersion is missing.");
  if (!/^[0-9a-f]{40}$/.test(snapshot?.sources?.showdown?.revision ?? "")) errors.push("Pokémon Showdown source revision is missing or unpinned.");
  if (!/^[0-9a-f]{40}$/.test(snapshot?.sources?.pokeapi?.revision ?? "")) errors.push("PokeAPI source revision is missing or unpinned.");
  if (!snapshot?.generatedAt) warnings.push("Snapshot generatedAt is missing.");
  return { errors, warnings, checkedPokemon: pokemon.length };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "ChampionsLabAudit/1.0 (+https://championsbattledata.com/)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

export async function auditLiveContracts(snapshot) {
  const errors = [];
  const index = await fetchJson(CHAMPIONS_INDEX);
  const byName = new Map(snapshot.pokemon.map((entry) => [entry.name, entry]));
  const sourceForms = Array.isArray(index?.pokemon) ? index.pokemon : [];
  const relatedGroups = Object.values(Object.groupBy(sourceForms, (entry) => entry.metadataCsv ?? `__${entry.showdownId}`)).filter((entries) => entries.length > 1);

  for (const source of sourceForms) {
    const entry = byName.get(source.name);
    if (!entry) errors.push(`Live index form is missing from snapshot: ${source.name}`);
    else if (entry.battleDataKey !== source.showdownId) errors.push(`${source.name} maps to ${entry.battleDataKey}; live Showdown id is ${source.showdownId}`);
  }

  const usages = await Promise.all([
    fetchJson(`${CHAMPIONS_BATTLE}/Singles/ninetales`),
    fetchJson(`${CHAMPIONS_BATTLE}/Doubles/ninetales`),
    fetchJson(`${CHAMPIONS_BATTLE}/Singles/ninetalesalola`),
    fetchJson(`${CHAMPIONS_BATTLE}/Doubles/ninetalesalola`),
  ]);
  const [regularSingles, regularDoubles, alolanSingles, alolanDoubles] = usages;
  if (regularSingles.pokemon !== "Ninetales" || regularDoubles.pokemon !== "Ninetales") errors.push("Live regular Ninetales endpoints returned another form.");
  if (alolanSingles.pokemon !== "Alolan Ninetales" || alolanDoubles.pokemon !== "Alolan Ninetales") errors.push("Live Alolan Ninetales endpoints returned another form.");
  if (regularSingles.source === alolanSingles.source || regularDoubles.source === alolanDoubles.source) errors.push("Live Ninetales forms unexpectedly share a battle source.");

  return { errors, sourceForms: sourceForms.length, relatedGroups: relatedGroups.length };
}

async function main() {
  const snapshot = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  const offline = auditSnapshot(snapshot);
  for (const warning of offline.warnings) console.warn(`WARN ${warning}`);
  let live = null;
  if (process.argv.includes("--live")) live = await auditLiveContracts(snapshot);
  const errors = [...offline.errors, ...(live?.errors ?? [])];
  if (errors.length) {
    for (const error of errors) console.error(`ERROR ${error}`);
    throw new Error(`Form integrity audit failed with ${errors.length} error(s).`);
  }
  console.log(`Form integrity audit passed for ${offline.checkedPokemon} snapshot forms.${live ? ` Live index: ${live.sourceForms} forms across ${live.relatedGroups} related metadata groups.` : ""}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
