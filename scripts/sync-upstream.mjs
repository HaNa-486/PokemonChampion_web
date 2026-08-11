import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { championsPp, parseShowdownTable, showdownFlags, showdownTarget, toShowdownId } from "./showdown-move-data.mjs";

const CHAMPIONS_INDEX = "https://championsbattledata.com/api/index";
const SHOWDOWN_REPOSITORY = "smogon/pokemon-showdown";
const POKEAPI_REPOSITORY = "PokeAPI/pokeapi";
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
    battleDataKey: entry.showdownId ?? entry.slug,
    name: entry.name,
    savedName,
    types: Array.isArray(summary.types) ? summary.types : [],
    baseStats: { hp: Math.max(1, hp - 75), attack: Math.max(1, attack - 20), defense: Math.max(1, defense - 20), specialAttack: Math.max(1, specialAttack - 20), specialDefense: Math.max(1, specialDefense - 20), speed: Math.max(1, speed - 20) },
    imageUrl: new URL(String(spritePath).replaceAll("\\", "/"), `${origin}/`).href,
    moveNames: Array.isArray(entry.learnableMoveNames) ? entry.learnableMoveNames : [],
  };
}

export function matchChampionsSourceForForm(form, entries) {
  const savedName = String(form?.saved_name ?? "");
  const savedSlug = slugify(savedName);
  const direct = entries.find((entry) => String(entry.name ?? "").toLocaleLowerCase("en") === savedName.toLocaleLowerCase("en"))
    ?? entries.find((entry) => entry.slug === savedSlug);
  if (direct) return direct;

  const baseSlug = slugify(String(form?.base_name ?? ""));
  const base = entries.find((entry) => entry.slug === baseSlug)
    ?? entries.find((entry) => slugify(String(entry.name ?? "")) === baseSlug);
  if (base && /^mega\b/i.test(savedName)) return base;
  if (entries.length === 1) return entries[0];
  return null;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "ChampionsLabSync/0.1 (+https://championsbattledata.com/)" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function githubRevision(repository) {
  const source = JSON.parse(await fetchText(`https://api.github.com/repos/${repository}/git/ref/heads/master`));
  if (!/^[0-9a-f]{40}$/.test(source?.object?.sha ?? "")) throw new Error(`Could not resolve the ${repository} master revision.`);
  return source.object.sha;
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

function resolveShowdownDescription(text, override) {
  const championsDescription = override?.desc ?? text?.champions?.desc ?? override?.shortDesc ?? text?.champions?.shortDesc ?? "";
  return {
    championsDescription,
    description: championsDescription || text?.desc || text?.shortDesc || "",
  };
}

export async function buildSnapshot(championsSource, revisions = {}) {
  const showdownRevision = revisions.showdown ?? await githubRevision(SHOWDOWN_REPOSITORY);
  const pokeapiRevision = revisions.pokeapi ?? await githubRevision(POKEAPI_REPOSITORY);
  const showdownRaw = `https://raw.githubusercontent.com/${SHOWDOWN_REPOSITORY}/${showdownRevision}`;
  const pokeapiCsv = `https://raw.githubusercontent.com/${POKEAPI_REPOSITORY}/${pokeapiRevision}/data/v2/csv`;
  const [championsText, showdownMoveSource, showdownTextSource, championsMoveSource, showdownAbilitySource, showdownAbilityTextSource, championsAbilitySource, showdownItemSource, showdownItemTextSource, championsItemSource, championsScriptSource, moveCsv, moveNamesCsv, effectsCsv, abilityCsv, abilityNamesCsv, abilityProseCsv, itemCsv, itemNamesCsv, itemProseCsv] = await Promise.all([
    championsSource ? Promise.resolve(JSON.stringify(championsSource)) : fetchText(CHAMPIONS_INDEX),
    fetchText(`${showdownRaw}/data/moves.ts`),
    fetchText(`${showdownRaw}/data/text/moves.ts`),
    fetchText(`${showdownRaw}/data/mods/champions/moves.ts`),
    fetchText(`${showdownRaw}/data/abilities.ts`),
    fetchText(`${showdownRaw}/data/text/abilities.ts`),
    fetchText(`${showdownRaw}/data/mods/champions/abilities.ts`),
    fetchText(`${showdownRaw}/data/items.ts`),
    fetchText(`${showdownRaw}/data/text/items.ts`),
    fetchText(`${showdownRaw}/data/mods/champions/items.ts`),
    fetchText(`${showdownRaw}/data/mods/champions/scripts.ts`),
    fetchText(`${pokeapiCsv}/moves.csv`),
    fetchText(`${pokeapiCsv}/move_names.csv`),
    fetchText(`${pokeapiCsv}/move_effect_prose.csv`),
    fetchText(`${pokeapiCsv}/abilities.csv`),
    fetchText(`${pokeapiCsv}/ability_names.csv`),
    fetchText(`${pokeapiCsv}/ability_prose.csv`),
    fetchText(`${pokeapiCsv}/items.csv`),
    fetchText(`${pokeapiCsv}/item_names.csv`),
    fetchText(`${pokeapiCsv}/item_prose.csv`),
  ]);
  const source = JSON.parse(championsText);
  if (!Array.isArray(source.pokemon) || typeof source.dataVersion !== "string") throw new Error("Champions index contract changed: pokemon[] or dataVersion is missing.");
  if (!/this\.data\.Moves\[i\]\.pp > 20/.test(championsScriptSource) || !/\(move\.pp \/ 5 \+ 1\) \* 4/.test(championsScriptSource)) {
    throw new Error("Pokémon Showdown Champions PP rules changed and require review.");
  }
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
  const effectZhHant = byLanguage(effectRows, "move_effect_id", 4);
  const abilityRows = parseCsv(abilityCsv);
  const abilityNameRows = parseCsv(abilityNamesCsv);
  const abilityProseRows = parseCsv(abilityProseCsv);
  const abilityNamesEn = byLanguage(abilityNameRows, "ability_id", 9);
  const abilityNamesZhHant = byLanguage(abilityNameRows, "ability_id", 4);
  const abilityProseZhHant = byLanguage(abilityProseRows, "ability_id", 4);
  const abilityIdByName = new Map(abilityRows.map((row) => [abilityNamesEn.get(row.id)?.name, row.identifier]).filter(([name]) => Boolean(name)));
  const pokemonMap = new Map();
  const groupsByMetadataPath = new Map();
  for (const group of metadataGroups) {
    const metadataPath = String(group.entry.metadataCsv ?? "").replaceAll("\\", "/");
    if (!metadataPath) {
      groupsByMetadataPath.set(`__${group.entry.showdownId ?? group.entry.slug}`, { entries: [group.entry], rows: group.rows });
      continue;
    }
    const existing = groupsByMetadataPath.get(metadataPath) ?? { entries: [], rows: group.rows };
    existing.entries.push(group.entry);
    groupsByMetadataPath.set(metadataPath, existing);
  }
  for (const { entries, rows } of groupsByMetadataPath.values()) {
    const fallback = normalizeChampionsPokemon(entries[0]);
    const forms = rows.length ? rows : [{ saved_name: fallback.savedName, base_name: entries[0].name, types: fallback.types.join("/"), abilities: "", hp: fallback.baseStats.hp + 75, atk: fallback.baseStats.attack + 20, def: fallback.baseStats.defense + 20, spa: fallback.baseStats.specialAttack + 20, spd: fallback.baseStats.specialDefense + 20, spe: fallback.baseStats.speed + 20 }];
    for (const form of forms) {
      const entry = matchChampionsSourceForForm(form, entries);
      if (!entry) throw new Error(`Could not map metadata form ${form.saved_name} to a unique Champions index entry.`);
      const name = form.saved_name || entry.name;
      const number = (value, offset) => Math.max(1, Number(value || 0) - offset);
      const id = slugify(name);
      pokemonMap.set(id, {
        id,
        speciesKey: slugify(form.base_name || entry.name),
        battleDataKey: entry.showdownId ?? entry.slug,
        name, savedName: name,
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
  const showdownMoves = parseShowdownTable(showdownMoveSource);
  const championsMoves = parseShowdownTable(championsMoveSource);
  const showdownText = parseShowdownTable(showdownTextSource, "MovesText");
  const pokeRowByShowdownId = new Map(moveRows.flatMap((row) => {
    const name = namesEn.get(row.id)?.name;
    return name ? [[toShowdownId(name), row]] : [];
  }));
  const missingMechanics = [];
  const missingDescriptions = [];
  const moves = [...wantedNames].sort((left, right) => left.localeCompare(right, "en")).flatMap((legalName) => {
    const showdownId = toShowdownId(legalName);
    const base = showdownMoves.get(showdownId);
    const override = championsMoves.get(showdownId);
    if (!base && (!override || override.inherit)) { missingMechanics.push(legalName); return []; }
    const move = { ...(base ?? {}), ...(override ?? {}) };
    const text = showdownText.get(showdownId) ?? {};
    const { championsDescription, description } = resolveShowdownDescription(text, override);
    if (!description.trim()) { missingDescriptions.push(legalName); return []; }
    const pokeRow = pokeRowByShowdownId.get(showdownId);
    const localizedEffect = pokeRow ? effectZhHant.get(pokeRow.effect_id)?.short_effect ?? "" : "";
    const name = String(move.name ?? text.name ?? legalName);
    const type = String(move.type ?? "");
    const category = String(move.category ?? "");
    const overrideKeys = override?._explicitKeys ?? [];
    const hasChampionsMechanicOverride = overrideKeys.some((key) => !["inherit", "isNonstandard", "desc", "shortDesc"].includes(key));
    const hasChampionsEffectOverride = overrideKeys.some((key) => ["boosts", "condition", "desc", "onDisableMove", "secondary", "secondaries", "self", "shortDesc", "status", "volatileStatus"].includes(key));
    if (!type || !["Physical", "Special", "Status"].includes(category)) { missingMechanics.push(legalName); return []; }
    return [{
      id: pokeRow?.identifier ?? slugify(name),
      showdownId,
      name,
      nameZh: pokeRow ? namesZhHant.get(pokeRow.id)?.name ?? name : name,
      type,
      category,
      power: Number(move.basePower) > 0 ? Number(move.basePower) : null,
      accuracy: move.accuracy === true ? null : Number.isFinite(Number(move.accuracy)) ? Number(move.accuracy) : null,
      pp: championsPp(move),
      priority: Number(move.priority ?? 0),
      target: showdownTarget(move.target),
      flags: showdownFlags(move.flags),
      description,
      descriptionZh: !hasChampionsEffectOverride && localizedEffect ? localizedEffect.replaceAll("$effect_chance", pokeRow.effect_chance || "0") : description,
      mechanicsSource: hasChampionsMechanicOverride ? "showdown-champions" : "showdown-base",
      descriptionSource: championsDescription ? "showdown-champions" : "showdown-text",
      localizationSource: !hasChampionsEffectOverride && localizedEffect ? "pokeapi" : "english-fallback",
    }];
  });
  if (missingMechanics.length) throw new Error(`Pokémon Showdown mechanics are missing for legal Champions moves: ${missingMechanics.join(", ")}`);
  if (missingDescriptions.length) throw new Error(`Pokémon Showdown descriptions are missing for legal Champions moves: ${missingDescriptions.join(", ")}`);
  const wantedAbilities = new Set(pokemon.flatMap((entry) => entry.abilityIds));
  const showdownAbilities = parseShowdownTable(showdownAbilitySource, "Abilities");
  const showdownAbilityText = parseShowdownTable(showdownAbilityTextSource, "AbilitiesText");
  const championsAbilities = parseShowdownTable(championsAbilitySource, "Abilities");
  const missingAbilityDescriptions = [];
  const abilities = abilityRows.flatMap((row) => {
    if (!wantedAbilities.has(row.identifier)) return [];
    const name = abilityNamesEn.get(row.id)?.name ?? row.identifier;
    const showdownId = toShowdownId(name);
    const base = showdownAbilities.get(showdownId);
    const override = championsAbilities.get(showdownId);
    const text = showdownAbilityText.get(showdownId) ?? {};
    const { championsDescription, description } = resolveShowdownDescription(text, override);
    if (!base || !description.trim()) { missingAbilityDescriptions.push(name); return []; }
    const overrideKeys = override?._explicitKeys ?? [];
    const hasChampionsMechanicOverride = overrideKeys.some((key) => !["inherit", "isNonstandard", "desc", "shortDesc"].includes(key));
    const localizedDescription = abilityProseZhHant.get(row.id)?.short_effect ?? "";
    const useLocalizedDescription = !championsDescription && !hasChampionsMechanicOverride && Boolean(localizedDescription);
    return [{
      id: row.identifier, showdownId, name: String(base.name ?? text.name ?? name), nameZh: abilityNamesZhHant.get(row.id)?.name ?? name,
      description, descriptionZh: useLocalizedDescription ? localizedDescription : description,
      mechanicsSource: hasChampionsMechanicOverride ? "showdown-champions" : "showdown-base",
      descriptionSource: championsDescription ? "showdown-champions" : "showdown-text",
      localizationSource: useLocalizedDescription ? "pokeapi" : "english-fallback",
    }];
  });
  if (missingAbilityDescriptions.length) throw new Error(`Pokémon Showdown data is missing for legal Champions abilities: ${missingAbilityDescriptions.join(", ")}`);
  const itemRows = parseCsv(itemCsv);
  const itemNameRows = parseCsv(itemNamesCsv);
  const itemProseRows = parseCsv(itemProseCsv);
  const itemNamesEn = byLanguage(itemNameRows, "item_id", 9);
  const itemNamesZhHant = byLanguage(itemNameRows, "item_id", 4);
  const itemProseZhHant = byLanguage(itemProseRows, "item_id", 4);
  const showdownItems = parseShowdownTable(showdownItemSource, "Items");
  const showdownItemText = parseShowdownTable(showdownItemTextSource, "ItemsText");
  const championsItems = parseShowdownTable(championsItemSource, "Items");
  const itemRowByShowdownId = new Map(itemRows.flatMap((row) => {
    const name = itemNamesEn.get(row.id)?.name;
    return name ? [[toShowdownId(name), row]] : [];
  }));
  const missingItemDescriptions = [];
  const itemIds = new Set([...showdownItems.keys(), ...championsItems.keys()]);
  const items = [...itemIds].sort((left, right) => left.localeCompare(right, "en")).flatMap((showdownId) => {
    const base = showdownItems.get(showdownId);
    const override = championsItems.get(showdownId);
    const item = { ...(base ?? {}), ...(override ?? {}) };
    if (item.isNonstandard != null) return [];
    const text = showdownItemText.get(showdownId) ?? {};
    const { championsDescription, description } = resolveShowdownDescription(text, override);
    const name = String(item.name ?? text.name ?? showdownId);
    if ((!base && override?.inherit) || !description.trim()) { missingItemDescriptions.push(name); return []; }
    const row = itemRowByShowdownId.get(showdownId);
    const overrideKeys = override?._explicitKeys ?? [];
    const hasChampionsMechanicOverride = overrideKeys.some((key) => !["inherit", "isNonstandard", "desc", "shortDesc"].includes(key));
    const localizedDescription = row ? itemProseZhHant.get(row.id)?.short_effect ?? "" : "";
    const useLocalizedDescription = !championsDescription && !hasChampionsMechanicOverride && Boolean(localizedDescription);
    const id = row?.identifier ?? slugify(name);
    const category = item.megaStone ? "Mega Stone" : item.isBerry || id.endsWith("-berry") ? "Berry" : "Item";
    return [{
      id, showdownId, name, nameZh: (row ? itemNamesZhHant.get(row.id)?.name : null) ?? name, category,
      description, descriptionZh: useLocalizedDescription ? localizedDescription : description,
      mechanicsSource: hasChampionsMechanicOverride ? "showdown-champions" : "showdown-base",
      descriptionSource: championsDescription ? "showdown-champions" : "showdown-text",
      localizationSource: useLocalizedDescription ? "pokeapi" : "english-fallback",
    }];
  });
  if (missingItemDescriptions.length) throw new Error(`Pokémon Showdown data is missing for legal Champions held items: ${missingItemDescriptions.join(", ")}`);
  return {
    schemaVersion: 6,
    generatedAt: new Date().toISOString(),
    sources: {
      champions: { url: CHAMPIONS_INDEX, generatedAt: source.generatedAt, dataVersion: source.dataVersion },
      showdown: { repository: `https://github.com/${SHOWDOWN_REPOSITORY}`, revision: showdownRevision, mod: "champions", datasets: ["data/moves.ts", "data/text/moves.ts", "data/mods/champions/moves.ts", "data/abilities.ts", "data/text/abilities.ts", "data/mods/champions/abilities.ts", "data/items.ts", "data/text/items.ts", "data/mods/champions/items.ts", "data/mods/champions/scripts.ts"] },
      pokeapi: { repository: `https://github.com/${POKEAPI_REPOSITORY}`, revision: pokeapiRevision, purpose: "IDs and localization", datasets: ["moves.csv", "move_names.csv", "move_effect_prose.csv", "abilities.csv", "ability_names.csv", "ability_prose.csv", "items.csv", "item_names.csv", "item_prose.csv"] },
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
  const output = path.resolve("data/generated/champions-snapshot.json");
  const [championsSource, showdownRevision, pokeapiRevision] = await Promise.all([
    fetchText(CHAMPIONS_INDEX).then(JSON.parse),
    githubRevision(SHOWDOWN_REPOSITORY),
    githubRevision(POKEAPI_REPOSITORY),
  ]);
  const existing = await readFile(output, "utf8").then(JSON.parse).catch(() => null);
  if (existing?.schemaVersion === 6 && existing?.sources?.champions?.dataVersion === championsSource.dataVersion && existing?.sources?.showdown?.revision === showdownRevision && existing?.sources?.pokeapi?.revision === pokeapiRevision) {
    console.log(`All upstream entity sources are already current (Champions=${championsSource.dataVersion}, Showdown=${showdownRevision.slice(0, 12)}, PokeAPI=${pokeapiRevision.slice(0, 12)}).`);
    return;
  }
  const snapshot = await buildSnapshot(championsSource, { showdown: showdownRevision, pokeapi: pokeapiRevision });
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
