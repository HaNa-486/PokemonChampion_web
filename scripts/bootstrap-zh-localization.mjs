import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as OpenCC from "opencc-js";
import { parseCsv } from "./sync-upstream.mjs";

const REVISION = "0d8fe2bf23d53f44456dc8dd2c861c5dab827146";
const CSV_ROOT = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${REVISION}/data/v2/csv`;
const OUTPUT = path.resolve("data/localization/zh-Hant.json");
const nodeName = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const toTaiwanTraditional = OpenCC.Converter({ from: "cn", to: "twp" });
const TRANSLATION_VERSION = 5;
let translationGlossary = [];

function normalizeTranslation(value) {
  return toTaiwanTraditional(value)
    .replaceAll("Pokémon", "寶可夢")
    .replaceAll("Pokemon", "寶可夢")
    .replaceAll("神奇寶貝", "寶可夢")
    .replaceAll("口袋妖怪", "寶可夢")
    .replaceAll("特殊攻擊", "特攻")
    .replaceAll("特殊防禦", "特防")
    .replaceAll("命中點", "HP")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xfee0))
    .replaceAll("ＨＰ", "HP")
    .replaceAll("ＰＰ", "PP")
    .replace(/\s+([，。；：！？])/g, "$1")
    .replace(/([，。；：！？])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

const reviewedDescriptionOverrides = {
  moves: {
    "ceaseless-edge": "若此招式成功，會在對手場地設定場地障礙；每當對手的寶可夢替換上場時便會受到傷害，但飛行屬性或具有飄浮特性的寶可夢不受影響。最多可設定三層：一層使對手損失最大 HP 的 1/8，兩層損失 1/6，三層損失 1/4，皆向下捨去。任一寶可夢使用大掃除，或對手的寶可夢成功使用晶光轉轉、高速旋轉、清除濃霧，或被清除濃霧命中時，可移除對手場地上的此效果。",
    curse: "若使用者不是幽靈屬性，會使自己的速度降低 1 階，並使攻擊與防禦各提高 1 階。若使用者是幽靈屬性，會失去最大 HP 的 1/2（向下捨去），即使因此陷入瀕死也會生效；作為交換，目標在效果持續期間會於每回合結束時失去最大 HP 的 1/4（向下捨去）。若目標使用接棒，替換上場的寶可夢會繼續受到影響。沒有目標或目標已受此效果影響時，招式會失敗。",
    flail: "令 X 等於（使用者目前 HP × 48 ÷ 使用者最大 HP）並向下捨去。X 為 33～48 時威力為 20；17～32 時為 40；10～16 時為 80；5～9 時為 100；2～4 時為 150；0 或 1 時為 200。",
    reversal: "令 X 等於（使用者目前 HP × 48 ÷ 使用者最大 HP）並向下捨去。X 為 33～48 時威力為 20；17～32 時為 40；10～16 時為 80；5～9 時為 100；2～4 時為 150；0 或 1 時為 200。",
    spikes: "在對手場地設定場地障礙；每當對手的寶可夢替換上場時便會受到傷害，但飛行屬性或具有飄浮特性的寶可夢不受影響。最多可使用三次，之後會失敗。一層使對手損失最大 HP 的 1/8，兩層損失 1/6，三層損失 1/4，皆向下捨去。任一寶可夢使用大掃除，或對手的寶可夢成功使用晶光轉轉、高速旋轉、清除濃霧，或被清除濃霧命中時，可移除對手場地上的此效果。",
    "corrosive-gas": "目標會失去持有物。此招式無法使具有黏著特性的寶可夢失去持有物，也無法使蓋歐卡、固拉多、帝牙盧卡、帕路奇亞、騎拉帝納、阿爾宙斯、蓋諾賽克特、銀伴戰獸、蒼響、藏瑪然特、悖謬寶可夢或厲鬼椸分別失去藍色寶珠、朱紅色寶珠、大金剛寶玉、大白寶玉、大白金寶玉、石板、卡帶、記憶碟、腐朽的劍、腐朽的盾、驅勁能量或面具。此處的悖謬寶可夢指具有古代活性或夸克充能特性的所有物種，但不包含破空焰、猛雷鼓、鐵磐巖與鐵頭殼。因此招式失去的道具無法透過回收利用或收穫特性取回。",
    disable: "在 4 回合內，目標最後使用的招式會被封鎖。若目標已有一個招式被封鎖、目標尚未使用過招式、目標已不再會該招式，或該招式為極巨招式或超極巨招式，則會失敗。",
  },
  abilities: {
    blaze: "當這隻寶可夢的目前 HP 小於或等於最大 HP 的 1/3（向下捨去）時，使用火屬性攻擊期間，對應的攻擊能力值會乘以 1.5。",
    "light-metal": "這隻寶可夢的重量減半，並向下捨去至 0.1 公斤。此效果在身體輕量化的效果之後、輕石的效果之前計算。寶可夢的重量不會低於 0.1 公斤。",
    steadfast: "若這隻寶可夢陷入畏縮，速度會提高 1 級。",
    gooey: "與這隻寶可夢接觸的寶可夢，速度會降低 1 級。",
    stamina: "這隻寶可夢受到招式傷害後，防禦會提高 1 級。",
  },
  items: {
    "sitrus-berry": "當持有者的目前 HP 小於或等於最大 HP 的 1/2 時，回復最大 HP 的 1/4。使用後消失。",
    "white-herb": "當任一能力階級低於 0 時，將所有已降低的能力階級恢復為 0。使用後消失。",
    hawluchanite: "摔角鷹人攜帶後，可在戰鬥中進行超級進化。",
  },
};

const moldBreakerNegatedAbilities = "尾甲、芳香幕、氣場破壞、戰鬥盔甲、健壯胸肌、防彈、恆淨之軀、唱反調、濕氣、鮮豔之軀、畫皮、乾燥皮膚、食土、過濾、引火、花之禮、花幕、毛茸茸、友情防守、毛皮大衣、黃金之軀、草之毛皮、看門犬、耐熱、重金屬、怪力鉗、結凍頭、冰鱗粉、發光、免疫、精神力、不眠、銳利目光、葉子防守、飄浮、輕金屬、避雷針、柔軟、魔法鏡、熔岩鎧甲、神奇鱗片、心眼、鏡甲、電氣引擎、多重鱗片、遲鈍、防塵、我行我素、粉彩護幕、龐克搖滾、潔淨之鹽、女王的威嚴、沙隱、食草、硬殼盔甲、鱗粉、單純、雪隱、堅硬岩石、隔音、黏著、引水、結實、吸盤、甜幕、蹣跚、心靈感應、太晶甲殼、熱交換、厚脂肪、純樸、幹勁、蓄電、儲水、水泡、水幕、焦香之軀、白色煙霧、乘風、神奇守護與奇蹟皮膚";
reviewedDescriptionOverrides.abilities["mold-breaker"] = `這隻寶可夢的招式及其效果會無視其他寶可夢的部分特性。可被無視的特性包括：${moldBreakerNegatedAbilities}。此效果會影響場上所有其他寶可夢，不論它是否為這隻寶可夢的招式目標，也不論該特性對這隻寶可夢是否有利。`;

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

function pokemonNameSource(entry) {
  if (formNames[entry.name]) return "reviewed-official-form-name";
  if (/^Mega /.test(entry.name) || /^(Alolan|Galarian|Hisuian) /.test(entry.name)) return "pokeapi-official-species-plus-reviewed-form-composition";
  return "pokeapi-official-zh-hant";
}

async function translate(text) {
  const activeTerms = translationGlossary.filter(([english]) => text.includes(english));
  let protectedText = text;
  for (const [english, traditional] of activeTerms) {
    protectedText = protectedText.replaceAll(english, traditional);
  }
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx"); url.searchParams.set("sl", "en"); url.searchParams.set("tl", "zh-TW"); url.searchParams.set("dt", "t"); url.searchParams.set("q", protectedText);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (response.ok) {
      const body = await response.json();
      return normalizeTranslation(body[0].map((part) => part[0]).join(""));
    }
    if (attempt === 4) throw new Error(`Translation failed: ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
}

async function translateMap(entries, existing = {}, existingSources = {}) {
  const result = {};
  let cursor = 0;
  const pending = entries.filter(([id, description]) => {
    if (existing[id] && existingSources[id] === description) {
      result[id] = normalizeTranslation(existing[id]);
      return false;
    }
    return true;
  });
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
  const [speciesCsv, speciesNamesCsv, moveCsv, moveNamesCsv, abilityCsv, abilityNamesCsv, itemCsv, itemNamesCsv] = await Promise.all([
    fetchText(`${CSV_ROOT}/pokemon_species.csv`), fetchText(`${CSV_ROOT}/pokemon_species_names.csv`),
    fetchText(`${CSV_ROOT}/moves.csv`), fetchText(`${CSV_ROOT}/move_names.csv`),
    fetchText(`${CSV_ROOT}/abilities.csv`), fetchText(`${CSV_ROOT}/ability_names.csv`),
    fetchText(`${CSV_ROOT}/items.csv`), fetchText(`${CSV_ROOT}/item_names.csv`),
  ]);
  const species = parseCsv(speciesCsv); const names = parseCsv(speciesNamesCsv);
  const zhById = new Map(names.filter((row) => row.local_language_id === "4").map((row) => [row.pokemon_species_id, row.name]));
  const speciesZh = new Map(species.map((row) => [nodeName(row.identifier), zhById.get(row.id)]).filter(([, name]) => name));
  const pokemonNames = Object.fromEntries(snapshot.pokemon.map((entry) => [entry.id, officialPokemonName(entry, speciesZh)]));
  const officialPairs = (entityCsv, namesCsv, foreignKey) => {
    const identifiers = new Set(parseCsv(entityCsv).map((row) => row.id));
    const english = new Map(parseCsv(namesCsv).filter((row) => row.local_language_id === "9" && identifiers.has(row[foreignKey])).map((row) => [row[foreignKey], row.name]));
    return parseCsv(namesCsv).filter((row) => row.local_language_id === "4" && english.has(row[foreignKey])).map((row) => [english.get(row[foreignKey]), row.name]);
  };
  translationGlossary = [
    ...officialPairs(speciesCsv, speciesNamesCsv, "pokemon_species_id"),
    ...officialPairs(moveCsv, moveNamesCsv, "move_id"),
    ...officialPairs(abilityCsv, abilityNamesCsv, "ability_id"),
    ...officialPairs(itemCsv, itemNamesCsv, "item_id"),
    ...snapshot.pokemon.map((entry) => [entry.name, pokemonNames[entry.id]]),
    ...snapshot.moves.map((entry) => [entry.name, entry.nameZh]),
    ...snapshot.abilities.map((entry) => [entry.name, entry.nameZh]),
    ...snapshot.items.map((entry) => [entry.name, entry.nameZh]),
    ["Special Defense", "特防"], ["Special Attack", "特攻"],
    ["Full Belly Mode", "滿腹花紋"], ["Hangry Mode", "空腹花紋"],
    ["Ash-Greninja", "小智版甲賀忍蛙"], ["Paldean", "帕底亞"],
    ["G-Max move", "超極巨招式"], ["Max move", "極巨招式"],
    ["Flying-type", "飛行屬性"], ["Normal type", "一般屬性"],
    ["Fire type", "火屬性"], ["Water type", "水屬性"], ["Electric type", "電屬性"],
    ["Grass type", "草屬性"], ["Ice type", "冰屬性"], ["Fighting type", "格鬥屬性"],
    ["Poison type", "毒屬性"], ["Ground type", "地面屬性"], ["Psychic type", "超能力屬性"],
    ["Bug type", "蟲屬性"], ["Rock type", "岩石屬性"], ["Ghost type", "幽靈屬性"],
    ["Dragon type", "龍屬性"], ["Dark type", "惡屬性"], ["Steel type", "鋼屬性"], ["Fairy type", "妖精屬性"],
    ["Normal-type", "一般屬性"], ["Fire-type", "火屬性"], ["Water-type", "水屬性"],
    ["Electric-type", "電屬性"], ["Grass-type", "草屬性"], ["Ice-type", "冰屬性"],
    ["Fighting-type", "格鬥屬性"], ["Poison-type", "毒屬性"], ["Ground-type", "地面屬性"],
    ["Psychic-type", "超能力屬性"], ["Bug-type", "蟲屬性"], ["Rock-type", "岩石屬性"],
    ["Ghost-type", "幽靈屬性"], ["Dragon-type", "龍屬性"], ["Dark-type", "惡屬性"],
    ["Steel-type", "鋼屬性"], ["Fairy-type", "妖精屬性"],
    ["Attack", "攻擊"], ["Defense", "防禦"], ["Speed", "速度"], ["Berry", "樹果"], ["Holder", "持有者"],
    ["Mask", "面具"], ["Plate", "石板"], ["Drive", "卡帶"], ["Memory", "記憶碟"],
    ["Terastallized", "太晶化"], ["Pokemon", "寶可夢"], ["Pokémon", "寶可夢"], ["Abilities", "特性"], ["Ability", "特性"], ["Moves", "招式"], ["Move", "招式"], ["Single use", "使用後消失"], ["OHKO", "一擊必殺"], ["STAB", "同屬性加成（STAB）"],
  ].filter(([english, traditional]) => english && traditional && english !== traditional).sort((left, right) => right[0].length - left[0].length);
  const nameSources = {
    pokemon: Object.fromEntries(snapshot.pokemon.map((entry) => [entry.id, pokemonNameSource(entry)])),
    moves: Object.fromEntries(snapshot.moves.map((entry) => [entry.id, manualMoveNames[entry.id] ? "reviewed-champions-name" : "pokeapi-official-zh-hant"])),
    abilities: Object.fromEntries(snapshot.abilities.map((entry) => [entry.id, manualAbilityNames[entry.id] ? "reviewed-champions-name" : "pokeapi-official-zh-hant"])),
    items: Object.fromEntries(snapshot.items.map((entry) => [entry.id, manualItemNames[entry.id] ? "reviewed-champions-name" : "pokeapi-official-zh-hant"])),
  };
  const sourceDescriptions = {
    moves: Object.fromEntries(snapshot.moves.map((entry) => [entry.id, entry.description])),
    abilities: Object.fromEntries(snapshot.abilities.map((entry) => [entry.id, entry.description])),
    items: Object.fromEntries(snapshot.items.map((entry) => [entry.id, entry.description])),
  };
  const descriptions = {
    moves: await translateMap(snapshot.moves.map((entry) => [entry.id, entry.description]), existing.translationVersion === TRANSLATION_VERSION ? existing.descriptions?.moves : {}, existing.translationVersion === TRANSLATION_VERSION ? existing.sourceDescriptions?.moves : {}),
    abilities: await translateMap(snapshot.abilities.map((entry) => [entry.id, entry.description]), existing.translationVersion === TRANSLATION_VERSION ? existing.descriptions?.abilities : {}, existing.translationVersion === TRANSLATION_VERSION ? existing.sourceDescriptions?.abilities : {}),
    items: await translateMap(snapshot.items.map((entry) => [entry.id, entry.description]), existing.translationVersion === TRANSLATION_VERSION ? existing.descriptions?.items : {}, existing.translationVersion === TRANSLATION_VERSION ? existing.sourceDescriptions?.items : {}),
  };
  for (const section of ["moves", "abilities", "items"]) Object.assign(descriptions[section], reviewedDescriptionOverrides[section]);
  const payload = {
    schemaVersion: 2,
    translationVersion: TRANSLATION_VERSION,
    locale: "zh-Hant",
    provenance: {
      pokemonNames: "PokeAPI official Traditional Chinese species names plus reviewed official form naming; never machine translated",
      resourceNames: "PokeAPI official Traditional Chinese move, ability, and item names plus reviewed mappings for Champions-only entities",
      descriptions: "Machine translation of the complete effective Pokémon Showdown Champions English mechanics, normalized to Taiwan Traditional Chinese with OpenCC; requires editorial review",
      reviewedDescriptionOverrides: "Human-reviewed Traditional Chinese overrides for entries that failed semantic parity or critical golden checks",
      generatedAt: new Date().toISOString(),
    },
    pokemonNames,
    nameSources,
    names: { moves: manualMoveNames, abilities: manualAbilityNames, items: manualItemNames },
    descriptions,
    reviewedDescriptionIds: Object.fromEntries(Object.entries(reviewedDescriptionOverrides).map(([section, values]) => [section, Object.keys(values)])),
    descriptionSources: Object.fromEntries(["moves", "abilities", "items"].map((section) => {
      const reviewed = new Set(Object.keys(reviewedDescriptionOverrides[section]));
      return [section, Object.fromEntries(snapshot[section].map((entry) => [entry.id, reviewed.has(entry.id) ? "machine-translation-semantic-override" : "machine-translation-effective-showdown"]))];
    })),
    sourceDescriptions,
  };
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT}: ${Object.keys(pokemonNames).length} Pokémon, ${Object.keys(descriptions.moves).length} moves, ${Object.keys(descriptions.abilities).length} abilities, ${Object.keys(descriptions.items).length} items.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1]).replaceAll("\\", "/")}`).href) main().catch((error) => { console.error(error); process.exitCode = 1; });
