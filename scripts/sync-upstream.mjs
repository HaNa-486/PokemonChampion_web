import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const CHAMPIONS_INDEX = "https://championsbattledata.com/api/index";
const POKEAPI_CSV = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const TYPE_BY_ID = [null, "Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
const CLASS_BY_ID = [null, "Status", "Physical", "Special"];
const slugify = (value) => value.normalize("NFKD").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function parseCsv(source) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

export function normalizeChampionsPokemon(entry, origin = "https://championsbattledata.com") {
  const summary = entry?.summary ?? {};
  const stats = summary.baseStats ?? {};
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const hp = number(stats.hp ?? stats.HP);
  const attack = number(stats.attack ?? stats.atk ?? stats.Attack);
  const defense = number(stats.defense ?? stats.def ?? stats.Defense);
  const specialAttack = number(stats.specialAttack ?? stats.spAttack ?? stats.spAtk ?? stats.sp_atk ?? stats.sp_attack ?? stats.special_attack ?? stats.spa ?? stats.SpA);
  const specialDefense = number(stats.specialDefense ?? stats.spDefense ?? stats.spDef ?? stats.sp_def ?? stats.sp_defense ?? stats.special_defense ?? stats.spd ?? stats.SpD);
  const speed = number(stats.speed ?? stats.spe ?? stats.Speed);
  const savedName = entry.savedName ?? entry.saved_name ?? entry.name;
  const spritePath = summary.sprite ?? `pokemon_champions_assets/pokemon/${encodeURIComponent(savedName)}.png`;
  return {
    id: entry.showdownId ?? entry.slug,
    speciesKey: entry.slug ?? entry.showdownId,
    name: entry.name,
    savedName,
    types: Array.isArray(summary.types) ? summary.types : [],
    baseStats: { hp: Math.max(1, hp - 75), attack: Math.max(1, attack - 20), defense: Math.max(1, defense - 20), specialAttack: Math.max(1, specialAttack - 20), specialDefense: Math.max(1, specialDefense - 20), speed: Math.max(1, speed - 20) },
    imageUrl: new URL(String(spritePath).replaceAll("\\", "/"), `${origin}/`).href,
    moveNames: Array.isArray(entry.learnableMoveNames) ? entry.learnableMoveNames : [],
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "ChampionsLabSync/0.1 (+https://championsbattledata.com/)" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function mapLimit(values, concurrency, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) { const index = cursor++; results[index] = await mapper(values[index], index); }
  }));
  return results;
}

function byLanguage(rows, idKey, languageId) {
  return new Map(rows.filter((row) => row.local_language_id === String(languageId)).map((row) => [row[idKey], row]));
}

function collectCategoryNames(value, category, result) {
  if (Array.isArray(value)) { for (const entry of value) collectCategoryNames(entry, category, result); return; }
  if (!value || typeof value !== "object") return;
  if (value.category === category && typeof value.name === "string" && value.name) result.add(value.name);
  for (const child of Object.values(value)) collectCategoryNames(child, category, result);
}

export async function buildSnapshot() {
  const [championsText, moveCsv, moveNamesCsv, effectsCsv, abilityCsv, abilityNamesCsv, abilityProseCsv, itemCsv, itemNamesCsv, itemProseCsv] = await Promise.all([
    fetchText(CHAMPIONS_INDEX),
    fetchText(`${POKEAPI_CSV}/moves.csv`),
    fetchText(`${POKEAPI_CSV}/move_names.csv`),
    fetchText(`${POKEAPI_CSV}/move_effect_prose.csv`),
    fetchText(`${POKEAPI_CSV}/abilities.csv`),
    fetchText(`${POKEAPI_CSV}/ability_names.csv`),
    fetchText(`${POKEAPI_CSV}/ability_prose.csv`),
    fetchText(`${POKEAPI_CSV}/items.csv`),
    fetchText(`${POKEAPI_CSV}/item_names.csv`),
    fetchText(`${POKEAPI_CSV}/item_prose.csv`),
  ]);
  const source = JSON.parse(championsText);
  if (!Array.isArray(source.pokemon) || typeof source.dataVersion !== "string") throw new Error("Champions index contract changed: pokemon[] or dataVersion is missing.");
  const metadataCache = new Map();
  const metadataGroups = await mapLimit(source.pokemon, 8, async (entry) => {
    const metadataPath = String(entry.metadataCsv ?? "").replaceAll("\\", "/");
    if (!metadataPath) return { entry, rows: [] };
    if (!metadataCache.has(metadataPath)) metadataCache.set(metadataPath, fetchText(new URL(metadataPath, "https://championsbattledata.com/").href).then(parseCsv));
    return { entry, rows: await metadataCache.get(metadataPath) };
  });
  const moveRows = parseCsv(moveCsv);
  const nameRows = parseCsv(moveNamesCsv);
  const effectRows = parseCsv(effectsCsv);
  const namesEn = byLanguage(nameRows, "move_id", 9);
  const namesZhHant = byLanguage(nameRows, "move_id", 4);
  const effectsEn = byLanguage(effectRows, "move_effect_id", 9);
  const effectZhHant = byLanguage(effectRows, "move_effect_id", 4);
  const abilityRows = parseCsv(abilityCsv);
  const abilityNameRows = parseCsv(abilityNamesCsv);
  const abilityProseRows = parseCsv(abilityProseCsv);
  const abilityNamesEn = byLanguage(abilityNameRows, "ability_id", 9);
  const abilityNamesZhHant = byLanguage(abilityNameRows, "ability_id", 4);
  const abilityProseEn = byLanguage(abilityProseRows, "ability_id", 9);
  const abilityProseZhHant = byLanguage(abilityProseRows, "ability_id", 4);
  const abilityIdByName = new Map(abilityRows.map((row) => [abilityNamesEn.get(row.id)?.name, row.identifier]).filter(([name]) => Boolean(name)));
  const pokemonMap = new Map();
  for (const { entry, rows } of metadataGroups) {
    const fallback = normalizeChampionsPokemon(entry);
    const forms = rows.length ? rows : [{ saved_name: fallback.savedName, types: fallback.types.join("/"), abilities: "", hp: fallback.baseStats.hp + 75, atk: fallback.baseStats.attack + 20, def: fallback.baseStats.defense + 20, spa: fallback.baseStats.specialAttack + 20, spd: fallback.baseStats.specialDefense + 20, spe: fallback.baseStats.speed + 20 }];
    for (const form of forms) {
      const name = form.saved_name || entry.name;
      const number = (value, offset) => Math.max(1, Number(value || 0) - offset);
      const id = slugify(name);
      pokemonMap.set(id, {
        id, speciesKey: entry.slug ?? entry.showdownId, name, savedName: name,
        types: String(form.types || "").split("/").filter(Boolean),
        baseStats: { hp: number(form.hp, 75), attack: number(form.atk, 20), defense: number(form.def, 20), specialAttack: number(form.spa, 20), specialDefense: number(form.spd, 20), speed: number(form.spe, 20) },
        imageUrl: `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent(name)}.png`,
        moveNames: Array.isArray(entry.learnableMoveNames) ? entry.learnableMoveNames : [],
        abilityIds: String(form.abilities || "").split("|").map((ability) => abilityIdByName.get(ability)).filter(Boolean),
      });
    }
  }
  const pokemon = [...pokemonMap.values()];
  const wantedNames = new Set(pokemon.flatMap((entry) => entry.moveNames));
  const moves = moveRows.flatMap((row) => {
    const name = namesEn.get(row.id)?.name;
    if (!name || !wantedNames.has(name)) return [];
    const effect = effectsEn.get(row.effect_id)?.short_effect ?? "";
    return [{
      id: row.identifier, name, nameZh: namesZhHant.get(row.id)?.name ?? name,
      type: TYPE_BY_ID[Number(row.type_id)] ?? "Normal",
      category: CLASS_BY_ID[Number(row.damage_class_id)] ?? "Status",
      power: row.power === "" ? null : Number(row.power), accuracy: row.accuracy === "" ? null : Number(row.accuracy),
      pp: row.pp === "" ? null : Number(row.pp), priority: Number(row.priority || 0), targetId: Number(row.target_id || 0),
      description: effect.replaceAll("$effect_chance", row.effect_chance || "0"),
      descriptionZh: (effectZhHant.get(row.effect_id)?.short_effect ?? effect).replaceAll("$effect_chance", row.effect_chance || "0"),
    }];
  });
  const wantedAbilities = new Set(pokemon.flatMap((entry) => entry.abilityIds));
  const abilities = abilityRows.flatMap((row) => {
    if (!wantedAbilities.has(row.identifier)) return [];
    const name = abilityNamesEn.get(row.id)?.name ?? row.identifier;
    return [{ id: row.identifier, name, nameZh: abilityNamesZhHant.get(row.id)?.name ?? name, description: abilityProseEn.get(row.id)?.short_effect ?? "", descriptionZh: abilityProseZhHant.get(row.id)?.short_effect ?? abilityProseEn.get(row.id)?.short_effect ?? "" }];
  });
  const wantedItems = new Set();
  for (const entry of source.pokemon) collectCategoryNames(entry?.summary?.battleSummary, "held_item", wantedItems);
  const itemRows = parseCsv(itemCsv);
  const itemNameRows = parseCsv(itemNamesCsv);
  const itemProseRows = parseCsv(itemProseCsv);
  const itemNamesEn = byLanguage(itemNameRows, "item_id", 9);
  const itemNamesZhHant = byLanguage(itemNameRows, "item_id", 4);
  const itemProseEn = byLanguage(itemProseRows, "item_id", 9);
  const itemProseZhHant = byLanguage(itemProseRows, "item_id", 4);
  const items = itemRows.flatMap((row) => {
    const name = itemNamesEn.get(row.id)?.name;
    if (!name || !wantedItems.has(name)) return [];
    return [{ id: row.identifier, name, nameZh: itemNamesZhHant.get(row.id)?.name ?? name, category: "Held item", description: itemProseEn.get(row.id)?.short_effect ?? "", descriptionZh: itemProseZhHant.get(row.id)?.short_effect ?? itemProseEn.get(row.id)?.short_effect ?? "" }];
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sources: {
      champions: { url: CHAMPIONS_INDEX, generatedAt: source.generatedAt, dataVersion: source.dataVersion },
      pokeapi: { repository: "https://github.com/PokeAPI/pokeapi", revision: "master", datasets: ["moves.csv", "move_names.csv", "move_effect_prose.csv", "abilities.csv", "ability_names.csv", "ability_prose.csv", "items.csv", "item_names.csv", "item_prose.csv"] },
    },
    ruleset: { defaultSeason: source.defaultSeason, seasons: source.seasons ?? [] },
    counts: { pokemon: pokemon.length, moves: moves.length, abilities: abilities.length, items: items.length },
    pokemon,
    moves,
    abilities,
    items,
  };
}

async function main() {
  const snapshot = await buildSnapshot();
  const output = path.resolve("data/generated/champions-snapshot.json");
  await mkdir(path.dirname(output), { recursive: true });
  const body = `${JSON.stringify(snapshot, null, 2)}\n`;
  await writeFile(output, body, "utf8");
  const digest = createHash("sha256").update(body).digest("hex");
  console.log(`Synced ${snapshot.counts.pokemon} Pokémon forms, ${snapshot.counts.moves} moves, ${snapshot.counts.abilities} abilities, and ${snapshot.counts.items} items.`);
  console.log(`dataVersion=${snapshot.sources.champions.dataVersion} sha256=${digest}`);
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
