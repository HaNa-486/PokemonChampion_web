import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const CHAMPIONS_INDEX = "https://championsbattledata.com/api/index";
const POKEAPI_CSV = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const TYPE_BY_ID = [null, "Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
const CLASS_BY_ID = [null, "Status", "Physical", "Special"];

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

function byLanguage(rows, idKey, languageId) {
  return new Map(rows.filter((row) => row.local_language_id === String(languageId)).map((row) => [row[idKey], row]));
}

export async function buildSnapshot() {
  const [championsText, moveCsv, moveNamesCsv, effectsCsv] = await Promise.all([
    fetchText(CHAMPIONS_INDEX),
    fetchText(`${POKEAPI_CSV}/moves.csv`),
    fetchText(`${POKEAPI_CSV}/move_names.csv`),
    fetchText(`${POKEAPI_CSV}/move_effect_prose.csv`),
  ]);
  const source = JSON.parse(championsText);
  if (!Array.isArray(source.pokemon) || typeof source.dataVersion !== "string") throw new Error("Champions index contract changed: pokemon[] or dataVersion is missing.");
  const pokemon = source.pokemon.map((entry) => normalizeChampionsPokemon(entry));
  const wantedNames = new Set(pokemon.flatMap((entry) => entry.moveNames));
  const moveRows = parseCsv(moveCsv);
  const nameRows = parseCsv(moveNamesCsv);
  const effectRows = parseCsv(effectsCsv);
  const namesEn = byLanguage(nameRows, "move_id", 9);
  const namesZhHant = byLanguage(nameRows, "move_id", 4);
  const effectsEn = byLanguage(effectRows, "move_effect_id", 9);
  const effectZhHant = byLanguage(effectRows, "move_effect_id", 4);
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
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sources: {
      champions: { url: CHAMPIONS_INDEX, generatedAt: source.generatedAt, dataVersion: source.dataVersion },
      pokeapi: { repository: "https://github.com/PokeAPI/pokeapi", revision: "master", datasets: ["moves.csv", "move_names.csv", "move_effect_prose.csv"] },
    },
    ruleset: { defaultSeason: source.defaultSeason, seasons: source.seasons ?? [] },
    counts: { pokemon: pokemon.length, moves: moves.length },
    pokemon,
    moves,
  };
}

async function main() {
  const snapshot = await buildSnapshot();
  const output = path.resolve("data/generated/champions-snapshot.json");
  await mkdir(path.dirname(output), { recursive: true });
  const body = `${JSON.stringify(snapshot, null, 2)}\n`;
  await writeFile(output, body, "utf8");
  const digest = createHash("sha256").update(body).digest("hex");
  console.log(`Synced ${snapshot.counts.pokemon} Pokémon and ${snapshot.counts.moves} PokeAPI moves.`);
  console.log(`dataVersion=${snapshot.sources.champions.dataVersion} sha256=${digest}`);
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
