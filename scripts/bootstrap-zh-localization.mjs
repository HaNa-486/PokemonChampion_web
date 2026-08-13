import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./sync-upstream.mjs";

const REVISION = "0d8fe2bf23d53f44456dc8dd2c861c5dab827146";
const CSV_ROOT = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${REVISION}/data/v2/csv`;
const OUTPUT = path.resolve("data/localization/zh-Hant.json");
const nodeName = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

const manualMoveNames = { "matcha-gotcha": "刷刷茶炮", "syrup-bomb": "糖漿炸彈" };
const manualAbilityNames = { eelevate: "電氣升空", "fire-mane": "火焰鬃毛" };
const itemBaseNames = {
  barbaracite: "龜足巨鎧", chandelurite: "水晶燈火靈", chesnaughtite: "布里卡隆", chimechite: "風鈴鈴",
  clefablite: "皮可西", crabominite: "好勝毛蟹", delphoxite: "妖火紅狐", dragalgite: "毒藻龍", dragoninite: "快龍",
  drampanite: "老翁龍", eelektrossite: "麻麻鰻魚王", emboarite: "炎武王", excadrite: "龍頭地鼠", falinksite: "列陣兵",
  feraligite: "大力鱷", floettite: "花葉蒂", froslassite: "雪妖女", glimmoranite: "晶光花", golurkite: "泥偶巨人",
  greninjite: "甲賀忍蛙", hawluchanite: "摔角鷹人", malamarite: "烏賊王", meganiumite: "大竺葵", meowsticite: "超能妙喵",
  pyroarite: "火炎獅", scolipite: "蜈蚣王", scovillainite: "狠辣椒", scraftinite: "頭巾混混", skarmorite: "盔甲鳥",
  staraptite: "姆克鷹", starminite: "寶石海星", victreebelite: "大食花",
};
const manualItemNames = Object.fromEntries(Object.entries(itemBaseNames).map(([id, name]) => [id, `${name}進化石`]));
Object.assign(manualItemNames, { "fairy-feather": "妖精之羽", "raichunite-x": "雷丘進化石Ｘ", "raichunite-y": "雷丘進化石Ｙ" });

const formNames = {
  "Aegislash Shield Forme": "堅盾劍怪（盾牌形態）", "Aegislash Blade Forme": "堅盾劍怪（刀劍形態）",
  "Alcremie Caramel Swirl": "霜奶仙（焦糖綜合）", "Alcremie Lemon Cream": "霜奶仙（奶香檸檬）",
  "Alcremie Matcha Cream": "霜奶仙（奶香抹茶）", "Alcremie Mint Cream": "霜奶仙（奶香薄荷）",
  "Alcremie Rainbow Swirl": "霜奶仙（三色綜合）", "Alcremie Ruby Cream": "霜奶仙（奶香紅鑽）",
  "Alcremie Ruby Swirl": "霜奶仙（紅鑽綜合）", "Alcremie Salted Cream": "霜奶仙（奶香雪鹽）",
  "Basculegion Male": "幽尾玄魚（雄性）", "Basculegion Female": "幽尾玄魚（雌性）",
  "Castform Rainy Form": "飄浮泡泡（雨水的樣子）", "Castform Snowy Form": "飄浮泡泡（雪雲的樣子）", "Castform Sunny Form": "飄浮泡泡（太陽的樣子）",
  "Florges Red Flower": "花潔夫人（紅花）", "Florges Blue Flower": "花潔夫人（藍花）", "Florges Orange Flower": "花潔夫人（橙花）", "Florges White Flower": "花潔夫人（白花）", "Florges Yellow Flower": "花潔夫人（黃花）",
  "Furfrou Natural Form": "多麗米亞（自然造型）", "Furfrou Dandy Trim": "多麗米亞（紳士造型）", "Furfrou Debutante Trim": "多麗米亞（淑女造型）", "Furfrou Diamond Trim": "多麗米亞（鑽石造型）", "Furfrou Heart Trim": "多麗米亞（愛心造型）", "Furfrou Kabuki Trim": "多麗米亞（歌舞伎造型）", "Furfrou La Reine Trim": "多麗米亞（女王造型）", "Furfrou Matron Trim": "多麗米亞（貴婦造型）", "Furfrou Pharaoh Trim": "多麗米亞（法老造型）", "Furfrou Star Trim": "多麗米亞（星星造型）",
  "Gourgeist Jumbo Variety": "南瓜怪人（特大尺寸）", "Gourgeist Large Variety": "南瓜怪人（大尺寸）", "Gourgeist Small Variety": "南瓜怪人（小尺寸）",
  "Lycanroc Dusk Form": "鬃岩狼人（黃昏的樣子）", "Lycanroc Midnight Form": "鬃岩狼人（黑夜的樣子）",
  "Maushold Family of Four": "一家鼠（四隻家庭）", "Meowstic Female": "超能妙喵（雌性）", "Morpeko Hangry Mode": "莫魯貝可（空腹花紋）",
  "Palafin Zero Form": "海豚俠（平凡形態）", "Palafin Hero Form": "海豚俠（全能形態）",
  "Paldean Tauros Aqua Breed": "肯泰羅（帕底亞的樣子・水瀾種）", "Paldean Tauros Blaze Breed": "肯泰羅（帕底亞的樣子・火熾種）", "Paldean Tauros Combat Breed": "肯泰羅（帕底亞的樣子・鬥戰種）",
  "Rotom Wash": "清洗洛托姆", "Wash Rotom": "清洗洛托姆", "Rotom Fan": "旋轉洛托姆", "Fan Rotom": "旋轉洛托姆", "Rotom Frost": "結冰洛托姆", "Frost Rotom": "結冰洛托姆", "Rotom Heat": "加熱洛托姆", "Heat Rotom": "加熱洛托姆", "Rotom Mow": "切割洛托姆", "Mow Rotom": "切割洛托姆",
};
const vivillonPatterns = { "Icy Snow": "冰雪", Archipelago: "群島", Continental: "大陸", Elegant: "高雅", Fancy: "幻彩", Garden: "庭園", "High Plains": "荒野", Jungle: "熱帶雨林", Marine: "大海", Meadow: "花園", Modern: "摩登", Monsoon: "驟雨", Ocean: "大洋", "Poké Ball": "精靈球", Polar: "雪國", River: "大河", Sandstorm: "沙塵", Savanna: "熱帶草原", Sun: "太陽", Tundra: "冰原" };
for (const [en, zh] of Object.entries(vivillonPatterns)) formNames[`Vivillon ${en} Pattern`] = `彩粉蝶（${zh}花紋）`;

function officialPokemonName(entry, speciesZh) {
  if (formNames[entry.name]) return formNames[entry.name];
  const base = speciesZh.get(nodeName(entry.speciesKey));
  if (!base) throw new Error(`Missing official species name for ${entry.name} (${entry.speciesKey})`);
  const mega = entry.name.match(/^Mega .+?(?: ([XY]))?$/);
  if (mega) return `超級${base}${mega[1] ? ` ${mega[1] === "X" ? "Ｘ" : "Ｙ"}` : ""}`;
  if (entry.name.startsWith("Alolan ")) return `阿羅拉${base}`;
  if (entry.name.startsWith("Galarian ")) return `伽勒爾${base}`;
  if (entry.name.startsWith("Hisuian ")) return `洗翠${base}`;
  return base;
}

async function translate(text) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx"); url.searchParams.set("sl", "en"); url.searchParams.set("tl", "zh-TW"); url.searchParams.set("dt", "t"); url.searchParams.set("q", text);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (response.ok) {
      const body = await response.json();
      return body[0].map((part) => part[0]).join("").replaceAll("Pokemon", "寶可夢").replaceAll("Pokémon", "寶可夢");
    }
    if (attempt === 4) throw new Error(`Translation failed: ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
}

function flavorMap(entityCsv, flavorCsv, foreignKey) {
  const entities = parseCsv(entityCsv);
  const identifierById = new Map(entities.map((row) => [row.id, row.identifier]));
  const result = new Map();
  for (const row of parseCsv(flavorCsv)) {
    if (row.language_id !== "4") continue;
    const id = identifierById.get(row[foreignKey]);
    if (!id) continue;
    const rank = Number(row.version_group_id ?? row.version_id ?? 0);
    if (!result.has(id) || rank >= result.get(id).rank) result.set(id, { rank, text: row.flavor_text.replace(/[\r\n]+/g, " ").replaceAll("­", "") });
  }
  return new Map([...result].map(([id, value]) => [id, value.text]));
}

async function translateMap(entries, existing = {}) {
  const result = { ...existing };
  let cursor = 0;
  const pending = entries.filter(([id]) => !result[id]);
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < pending.length) {
      const [id, description] = pending[cursor++];
      result[id] = await translate(description);
      if (cursor % 25 === 0) console.log(`Translated ${cursor}/${pending.length}`);
    }
  }));
  return result;
}

async function main() {
  const snapshot = JSON.parse(await readFile("data/generated/champions-snapshot.json", "utf8"));
  const existing = await readFile(OUTPUT, "utf8").then(JSON.parse).catch(() => ({}));
  const [speciesCsv, speciesNamesCsv, moveCsv, moveFlavorCsv, abilityCsv, abilityFlavorCsv, itemCsv, itemFlavorCsv] = await Promise.all([
    fetchText(`${CSV_ROOT}/pokemon_species.csv`), fetchText(`${CSV_ROOT}/pokemon_species_names.csv`),
    fetchText(`${CSV_ROOT}/moves.csv`), fetchText(`${CSV_ROOT}/move_flavor_text.csv`),
    fetchText(`${CSV_ROOT}/abilities.csv`), fetchText(`${CSV_ROOT}/ability_flavor_text.csv`),
    fetchText(`${CSV_ROOT}/items.csv`), fetchText(`${CSV_ROOT}/item_flavor_text.csv`),
  ]);
  const species = parseCsv(speciesCsv); const names = parseCsv(speciesNamesCsv);
  const zhById = new Map(names.filter((row) => row.local_language_id === "4").map((row) => [row.pokemon_species_id, row.name]));
  const speciesZh = new Map(species.map((row) => [nodeName(row.identifier), zhById.get(row.id)]).filter(([, name]) => name));
  const pokemonNames = Object.fromEntries(snapshot.pokemon.map((entry) => [entry.id, officialPokemonName(entry, speciesZh)]));
  const moveFlavor = flavorMap(moveCsv, moveFlavorCsv, "move_id");
  const abilityFlavor = flavorMap(abilityCsv, abilityFlavorCsv, "ability_id");
  const itemFlavor = flavorMap(itemCsv, itemFlavorCsv, "item_id");
  const seed = (entries, flavors, previous) => Object.fromEntries(entries.flatMap((entry) => {
    const text = entry.mechanicsSource !== "showdown-champions" ? flavors.get(entry.id) : null;
    return text ? [[entry.id, text]] : previous?.[entry.id] ? [[entry.id, previous[entry.id]]] : [];
  }));
  const descriptions = {
    moves: await translateMap(snapshot.moves.map((entry) => [entry.id, entry.description]), seed(snapshot.moves, moveFlavor, existing.descriptions?.moves)),
    abilities: await translateMap(snapshot.abilities.map((entry) => [entry.id, entry.description]), seed(snapshot.abilities, abilityFlavor, existing.descriptions?.abilities)),
    items: await translateMap(snapshot.items.map((entry) => [entry.id, entry.description]), seed(snapshot.items, itemFlavor, existing.descriptions?.items)),
  };
  const payload = {
    schemaVersion: 1,
    locale: "zh-Hant",
    provenance: { pokemonNames: "PokeAPI official Traditional Chinese species names plus reviewed official form naming", descriptions: "Machine translation of the effective Pokémon Showdown Champions English mechanics; requires editorial review", generatedAt: new Date().toISOString() },
    pokemonNames,
    names: { moves: manualMoveNames, abilities: manualAbilityNames, items: manualItemNames },
    descriptions,
  };
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT}: ${Object.keys(pokemonNames).length} Pokémon, ${Object.keys(descriptions.moves).length} moves, ${Object.keys(descriptions.abilities).length} abilities, ${Object.keys(descriptions.items).length} items.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1]).replaceAll("\\", "/")}`).href) main().catch((error) => { console.error(error); process.exitCode = 1; });
