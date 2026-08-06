import type { Ability, HeldItem, Move, Pokemon } from "./types";
import snapshot from "../data/generated/champions-snapshot.json";

export const catalogSnapshotDate = snapshot.sources.champions.generatedAt.slice(0, 10);

const asset = (name: string) => `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent(name)}.png`;
const targetById: Record<number, string> = { 3: "Ally", 4: "Ally side", 6: "Opposing side", 7: "Self", 8: "Random foe", 9: "All adjacent", 10: "1 target", 11: "All foes", 12: "Whole field", 13: "User and allies", 14: "All Pokémon", 15: "All allies" };

const curatedAbilities: Ability[] = [
  { id: "rough-skin", name: "Rough Skin", nameZh: "粗糙皮膚", description: "Damages an attacker that makes contact.", descriptionZh: "受到接觸類招式攻擊時，會使攻擊者受傷。" },
  { id: "sand-veil", name: "Sand Veil", nameZh: "沙隱", description: "Raises evasiveness during a sandstorm.", descriptionZh: "沙暴天氣時提高閃避率。" },
  { id: "drought", name: "Drought", nameZh: "日照", description: "Creates harsh sunlight when entering battle.", descriptionZh: "出場時會讓天氣變為大晴天。" },
  { id: "tough-claws", name: "Tough Claws", nameZh: "硬爪", description: "Boosts contact moves by 30%.", descriptionZh: "接觸類招式的威力提高 30%。" },
  { id: "prankster", name: "Prankster", nameZh: "惡作劇之心", description: "Gives priority to status moves.", descriptionZh: "使用變化招式時優先度提高。" },
  { id: "intimidate", name: "Intimidate", nameZh: "威嚇", description: "Lowers opposing Pokémon's Attack on entry.", descriptionZh: "出場時降低對手的攻擊。" },
  { id: "inner-focus", name: "Inner Focus", nameZh: "精神力", description: "Prevents flinching and ignores Intimidate.", descriptionZh: "不會畏縮，並不受威嚇影響。" },
  { id: "multiscale", name: "Multiscale", nameZh: "多重鱗片", description: "Reduces damage while at full HP.", descriptionZh: "HP 全滿時，受到的傷害會減少。" },
];

const curatedAbilityById = new Map(curatedAbilities.map((entry) => [entry.id, entry]));
export const abilities: Ability[] = snapshot.abilities.map((entry) => curatedAbilityById.get(entry.id) ?? {
  id: entry.id, name: entry.name, nameZh: entry.nameZh || entry.name,
  description: entry.description || "No ability description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有特性說明。",
});

const curatedItems: HeldItem[] = [
  { id: "life-orb", name: "Life Orb", nameZh: "生命寶珠", category: "Item", description: "Boosts move damage by 30%, but costs 1/10 max HP after a successful attack.", descriptionZh: "招式威力提高 30%，但命中後會失去最大 HP 的 1/10。" },
  { id: "choice-scarf", name: "Choice Scarf", nameZh: "講究圍巾", category: "Item", description: "Boosts Speed by 50%, but locks the holder into its first selected move.", descriptionZh: "速度提高 50%，但只能使出首次選擇的招式。" },
  { id: "focus-sash", name: "Focus Sash", nameZh: "氣勢披帶", category: "Item", description: "At full HP, survives a knockout with 1 HP once.", descriptionZh: "HP 全滿時，受到致命傷害會以 1 HP 撐住一次。" },
  { id: "sitrus-berry", name: "Sitrus Berry", nameZh: "文柚果", category: "Berry", description: "Restores HP when the holder's HP falls low.", descriptionZh: "HP 降低時會回復 HP。" },
  { id: "leftovers", name: "Leftovers", nameZh: "吃剩的東西", category: "Item", description: "Restores 1/16 max HP at the end of every turn.", descriptionZh: "每回合結束時回復最大 HP 的 1/16。" },
  { id: "charizardite-x", name: "Charizardite X", nameZh: "噴火龍進化石Ｘ", category: "Mega Stone", description: "Enables Mega Evolution into Mega Charizard X.", descriptionZh: "讓噴火龍超級進化為超級噴火龍Ｘ。" },
];

// Names verified against the current Champions Battle Data held-item distributions.
const megaStoneNameByPokemonId: Record<string, string> = {
  "mega-abomasnow": "Abomasite", "mega-absol": "Absolite", "mega-aerodactyl": "Aerodactylite", "mega-aggron": "Aggronite", "mega-alakazam": "Alakazite",
  "mega-raichu-x": "Raichunite X", "mega-raichu-y": "Raichunite Y", "mega-altaria": "Altarianite", "mega-ampharos": "Ampharosite", "mega-audino": "Audinite",
  "mega-banette": "Banettite", "mega-barbaracle": "Barbaracite", "mega-beedrill": "Beedrillite", "mega-blastoise": "Blastoisinite", "mega-blaziken": "Blazikenite",
  "mega-camerupt": "Cameruptite", "mega-chandelure": "Chandelurite", "mega-charizard-x": "Charizardite X", "mega-charizard-y": "Charizardite Y", "mega-chesnaught": "Chesnaughtite",
  "mega-chimecho": "Chimechite", "mega-clefable": "Clefablite", "mega-crabominable": "Crabominite", "mega-delphox": "Delphoxite", "mega-dragalge": "Dragalgite",
  "mega-dragonite": "Dragoninite", "mega-drampa": "Drampanite", "mega-eelektross": "Eelektrossite", "mega-emboar": "Emboarite", "mega-excadrill": "Excadrite",
  "mega-falinks": "Falinksite", "mega-feraligatr": "Feraligite", "mega-floette": "Floettite", "mega-froslass": "Froslassite", "mega-slowbro": "Slowbronite",
  "mega-gallade": "Galladite", "mega-garchomp": "Garchompite", "mega-gardevoir": "Gardevoirite", "mega-gengar": "Gengarite", "mega-glalie": "Glalitite",
  "mega-glimmora": "Glimmoranite", "mega-golurk": "Golurkite", "mega-greninja": "Greninjite", "mega-gyarados": "Gyaradosite", "mega-hawlucha": "Hawluchanite",
  "mega-heracross": "Heracronite", "mega-houndoom": "Houndoominite", "mega-kangaskhan": "Kangaskhanite", "mega-lopunny": "Lopunnite", "mega-lucario": "Lucarionite",
  "mega-malamar": "Malamarite", "mega-manectric": "Manectite", "mega-mawile": "Mawilite", "mega-medicham": "Medichamite", "mega-meganium": "Meganiumite",
  "mega-meowstic": "Meowsticite", "mega-metagross": "Metagrossite", "mega-pidgeot": "Pidgeotite", "mega-pinsir": "Pinsirite", "mega-pyroar": "Pyroarite",
  "mega-sableye": "Sablenite", "mega-sceptile": "Sceptilite", "mega-scizor": "Scizorite", "mega-scolipede": "Scolipite", "mega-scovillain": "Scovillainite",
  "mega-scrafty": "Scraftinite", "mega-sharpedo": "Sharpedonite", "mega-skarmory": "Skarmorite", "mega-staraptor": "Staraptite", "mega-starmie": "Starminite",
  "mega-steelix": "Steelixite", "mega-swampert": "Swampertite", "mega-tyranitar": "Tyranitarite", "mega-venusaur": "Venusaurite", "mega-victreebel": "Victreebelite",
};
const itemId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const megaStoneIdByPokemonId = new Map(Object.entries(megaStoneNameByPokemonId).map(([pokemonId, name]) => [pokemonId, itemId(name)]));

const generatedItemById = new Map(snapshot.items.map((entry) => [entry.id, entry]));
for (const entry of curatedItems) generatedItemById.set(entry.id, entry);
for (const [pokemonId, name] of Object.entries(megaStoneNameByPokemonId)) {
  const id = itemId(name);
  if (!generatedItemById.has(id)) generatedItemById.set(id, { id, name, nameZh: name, category: "Mega Stone", description: `Required for ${pokemonId.replaceAll("-", " ").replace(/^mega /, "Mega ")} to Mega Evolve.`, descriptionZh: `此超級石為 ${name}，是該寶可夢進行超級進化時的必備持有物。` });
}
export const items: HeldItem[] = [...generatedItemById.values()].map((entry) => ({
  id: entry.id, name: entry.name, nameZh: entry.nameZh || entry.name,
  category: entry.category || "Held item",
  description: entry.description || "No held item description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有持有物說明。",
}));

const curatedMoves: Move[] = [
  { id: "dragon-claw", name: "Dragon Claw", nameZh: "龍爪", type: "Dragon", category: "Physical", power: 80, accuracy: 100, pp: 16, priority: 0, target: "1 Foe", flags: ["Contact"], description: "An ordinary physical attack.", descriptionZh: "用尖銳的巨爪劈開對手。" },
  { id: "earthquake", name: "Earthquake", nameZh: "地震", type: "Ground", category: "Physical", power: 100, accuracy: 100, pp: 16, priority: 0, target: "All adjacent", flags: [], description: "Hits all adjacent Pokémon.", descriptionZh: "利用地震攻擊周圍所有寶可夢。" },
  { id: "protect", name: "Protect", nameZh: "守住", type: "Normal", category: "Status", power: null, accuracy: null, pp: 16, priority: 4, target: "Self", flags: [], description: "Protects the user from most moves this turn.", descriptionZh: "在該回合防住大部分招式。" },
  { id: "quick-attack", name: "Quick Attack", nameZh: "電光一閃", type: "Normal", category: "Physical", power: 40, accuracy: 100, pp: 30, priority: 1, target: "1 Foe", flags: ["Contact"], description: "Usually moves before ordinary attacks.", descriptionZh: "以迅雷不及掩耳之勢攻擊，通常能先制。" },
  { id: "extreme-speed", name: "Extreme Speed", nameZh: "神速", type: "Normal", category: "Physical", power: 80, accuracy: 100, pp: 8, priority: 2, target: "1 Foe", flags: ["Contact"], description: "A very fast attack with +2 priority.", descriptionZh: "以極快速度攻擊，優先度為 +2。" },
  { id: "vital-throw", name: "Vital Throw", nameZh: "借力摔", type: "Fighting", category: "Physical", power: 70, accuracy: null, pp: 10, priority: -1, target: "1 Foe", flags: ["Contact"], description: "Always hits, but acts after ordinary moves.", descriptionZh: "必定命中，但優先度為 -1。" },
  { id: "trick-room", name: "Trick Room", nameZh: "戲法空間", type: "Psychic", category: "Status", power: null, accuracy: null, pp: 8, priority: -7, target: "Whole field", flags: [], description: "Slower Pokémon move first for five turns.", descriptionZh: "在 5 回合內，速度較慢的寶可夢會先行動。" },
  { id: "flare-blitz", name: "Flare Blitz", nameZh: "閃焰衝鋒", type: "Fire", category: "Physical", power: 120, accuracy: 100, pp: 16, priority: 0, target: "1 Foe", flags: ["Contact"], description: "May burn the target; the user takes recoil.", descriptionZh: "可能使對手灼傷，使用者也會受到反作用力傷害。" },
  { id: "dragon-dance", name: "Dragon Dance", nameZh: "龍之舞", type: "Dragon", category: "Status", power: null, accuracy: null, pp: 20, priority: 0, target: "Self", flags: ["Dance"], description: "Raises the user's Attack and Speed.", descriptionZh: "提高使用者的攻擊和速度。" },
  { id: "heat-wave", name: "Heat Wave", nameZh: "熱風", type: "Fire", category: "Special", power: 95, accuracy: 90, pp: 16, priority: 0, target: "All foes", flags: ["Wind"], description: "May burn opposing Pokémon.", descriptionZh: "用炎熱氣息攻擊所有對手，可能使其灼傷。" },
  { id: "tailwind", name: "Tailwind", nameZh: "順風", type: "Flying", category: "Status", power: null, accuracy: null, pp: 16, priority: 0, target: "Ally side", flags: ["Wind"], description: "Doubles the Speed of the user's side temporarily.", descriptionZh: "暫時讓我方全體速度加倍。" },
  { id: "moonblast", name: "Moonblast", nameZh: "月亮之力", type: "Fairy", category: "Special", power: 95, accuracy: 100, pp: 16, priority: 0, target: "1 Foe", flags: [], description: "May lower the target's Special Attack.", descriptionZh: "可能降低對手的特攻。" },
  { id: "fake-out", name: "Fake Out", nameZh: "擊掌奇襲", type: "Normal", category: "Physical", power: 40, accuracy: 100, pp: 16, priority: 3, target: "1 Foe", flags: ["Contact"], description: "Works on the first turn out and makes the target flinch.", descriptionZh: "只能在出場後立刻使用，並使對手畏縮。" },
  { id: "parting-shot", name: "Parting Shot", nameZh: "拋下狠話", type: "Dark", category: "Status", power: null, accuracy: 100, pp: 20, priority: 0, target: "1 Foe", flags: ["Sound"], description: "Lowers offenses, then switches the user out.", descriptionZh: "降低對手攻擊與特攻後，與後備寶可夢交換。" },
  { id: "hurricane", name: "Hurricane", nameZh: "暴風", type: "Flying", category: "Special", power: 110, accuracy: 70, pp: 16, priority: 0, target: "1 Foe", flags: ["Wind"], description: "May confuse the target.", descriptionZh: "可能使對手陷入混亂。" },
];

const curatedPokemon: Pokemon[] = [
  { id: "garchomp", speciesKey: "garchomp", name: "Garchomp", nameZh: "烈咬陸鯊", types: ["Dragon", "Ground"], baseStats: { hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 }, imageUrl: asset("Garchomp"), abilityIds: ["sand-veil", "rough-skin"], moveIds: ["dragon-claw", "earthquake", "protect", "dragon-dance"], usageSingles: 1, usageDoubles: 1 },
  { id: "mega-charizard-x", speciesKey: "charizard", name: "Mega Charizard X", nameZh: "超級噴火龍Ｘ", types: ["Fire", "Dragon"], baseStats: { hp: 78, attack: 130, defense: 111, specialAttack: 130, specialDefense: 85, speed: 100 }, imageUrl: asset("Mega Charizard X"), abilityIds: ["tough-claws"], moveIds: ["flare-blitz", "dragon-claw", "dragon-dance", "protect"], usageSingles: 5, usageDoubles: 5, isMega: true },
  { id: "charizard", speciesKey: "charizard", name: "Charizard", nameZh: "噴火龍", types: ["Fire", "Flying"], baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 }, imageUrl: asset("Charizard"), abilityIds: ["drought"], moveIds: ["heat-wave", "hurricane", "protect", "tailwind"], usageSingles: 11, usageDoubles: 6 },
  { id: "whimsicott", speciesKey: "whimsicott", name: "Whimsicott", nameZh: "風妖精", types: ["Grass", "Fairy"], baseStats: { hp: 60, attack: 67, defense: 85, specialAttack: 77, specialDefense: 75, speed: 116 }, imageUrl: asset("Whimsicott"), abilityIds: ["prankster"], moveIds: ["tailwind", "moonblast", "protect", "trick-room"], usageSingles: 14, usageDoubles: 2 },
  { id: "incineroar", speciesKey: "incineroar", name: "Incineroar", nameZh: "熾焰咆哮虎", types: ["Fire", "Dark"], baseStats: { hp: 95, attack: 115, defense: 90, specialAttack: 80, specialDefense: 90, speed: 60 }, imageUrl: asset("Incineroar"), abilityIds: ["intimidate"], moveIds: ["fake-out", "parting-shot", "flare-blitz", "protect"], usageSingles: 83, usageDoubles: 3 },
  { id: "dragonite", speciesKey: "dragonite", name: "Dragonite", nameZh: "快龍", types: ["Dragon", "Flying"], baseStats: { hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80 }, imageUrl: asset("Dragonite"), abilityIds: ["inner-focus", "multiscale"], moveIds: ["extreme-speed", "dragon-claw", "dragon-dance", "protect"], usageSingles: 7, usageDoubles: 9 },
  { id: "sylveon", speciesKey: "sylveon", name: "Sylveon", nameZh: "仙子伊布", types: ["Fairy"], baseStats: { hp: 95, attack: 65, defense: 65, specialAttack: 110, specialDefense: 130, speed: 60 }, imageUrl: asset("Sylveon"), abilityIds: [], moveIds: ["moonblast", "quick-attack", "protect"], usageSingles: 10, usageDoubles: 10 },
  { id: "staraptor", speciesKey: "staraptor", name: "Staraptor", nameZh: "姆克鷹", types: ["Normal", "Flying"], baseStats: { hp: 85, attack: 120, defense: 70, specialAttack: 50, specialDefense: 60, speed: 100 }, imageUrl: asset("Staraptor"), abilityIds: ["intimidate"], moveIds: ["quick-attack", "tailwind", "protect"], usageSingles: 11, usageDoubles: 11 },
];

const curatedMoveById = new Map(curatedMoves.map((entry) => [entry.id, entry]));
const slicingMoveIds = new Set(["air-cutter", "air-slash", "aqua-cutter", "behemoth-blade", "bitter-blade", "ceaseless-edge", "cross-poison", "cut", "fury-cutter", "kowtow-cleave", "leaf-blade", "mighty-cleave", "night-slash", "psycho-cut", "razor-leaf", "razor-shell", "sacred-sword", "secret-sword", "slash", "solar-blade", "stone-axe", "tachyon-cutter", "x-scissor"]);
const generatedMoves: Move[] = snapshot.moves.map((entry) => ({
  id: entry.id,
  name: entry.name,
  nameZh: entry.nameZh || entry.name,
  type: entry.type as Move["type"],
  category: entry.category as Move["category"],
  power: entry.power,
  accuracy: entry.accuracy,
  pp: entry.pp ?? 0,
  priority: entry.priority,
  target: targetById[entry.targetId] ?? "Varies",
  flags: [...(entry.flags ?? []), ...(slicingMoveIds.has(entry.id) ? ["Slicing"] : [])],
  description: entry.description || "No effect description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有招式說明。",
}));

export const moves: Move[] = generatedMoves.map((entry) => curatedMoveById.get(entry.id) ?? entry);
const generatedMoveIdByName = new Map(snapshot.moves.map((entry) => [entry.name, entry.id]));
const curatedPokemonById = new Map(curatedPokemon.map((entry) => [entry.id, entry]));
const curatedPokemonNameZh = new Map(curatedPokemon.map((entry) => [entry.id, entry.nameZh]));

const generatedPokemon: Pokemon[] = snapshot.pokemon.map((entry, index) => {
  const curated = curatedPokemonById.get(entry.id);
  return {
    id: entry.id,
    speciesKey: entry.speciesKey,
    battleDataKey: entry.battleDataKey ?? entry.speciesKey,
    name: entry.name,
    nameZh: curatedPokemonNameZh.get(entry.id) ?? entry.name,
    types: entry.types as Pokemon["types"],
    baseStats: entry.baseStats,
    imageUrl: entry.imageUrl,
    abilityIds: entry.abilityIds.length ? entry.abilityIds : curated?.abilityIds ?? [],
    moveIds: entry.moveNames.map((name) => generatedMoveIdByName.get(name)).filter((id): id is string => Boolean(id)),
    usageSingles: curated?.usageSingles ?? index + 1,
    usageDoubles: curated?.usageDoubles ?? index + 1,
    isMega: curated?.isMega ?? entry.name.startsWith("Mega "),
  };
});
const pokemonMap = new Map(generatedPokemon.map((entry) => [entry.id, entry]));
for (const entry of curatedPokemon) if (!pokemonMap.has(entry.id)) pokemonMap.set(entry.id, entry);
export const pokemon: Pokemon[] = [...pokemonMap.values()];

export const moveById = new Map(moves.map((entry) => [entry.id, entry]));
export const abilityById = new Map(abilities.map((entry) => [entry.id, entry]));
export const itemById = new Map(items.map((entry) => [entry.id, entry]));
export const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
export const megaPokemonByStoneId = new Map<string, Pokemon>();
for (const [pokemonId, stoneId] of megaStoneIdByPokemonId) {
  const entry = pokemonById.get(pokemonId);
  if (entry) megaPokemonByStoneId.set(stoneId, entry);
}

const usageNameKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");
export const moveIdByUsageName = new Map(moves.map((entry) => [usageNameKey(entry.name), entry.id]));
export const itemIdByUsageName = new Map(items.map((entry) => [usageNameKey(entry.name), entry.id]));
export const abilityIdByUsageName = new Map(abilities.map((entry) => [usageNameKey(entry.name), entry.id]));
export const usageEntityKey = usageNameKey;

function reversePokemonIndex(selectIds: (entry: Pokemon) => string[]) {
  const index = new Map<string, Pokemon[]>();
  for (const entry of pokemon) {
    for (const id of selectIds(entry)) {
      const users = index.get(id) ?? [];
      users.push(entry);
      index.set(id, users);
    }
  }
  for (const users of index.values()) users.sort((left, right) => left.name.localeCompare(right.name));
  return index;
}

export const pokemonByMoveId = reversePokemonIndex((entry) => entry.moveIds);
export const pokemonByAbilityId = reversePokemonIndex((entry) => entry.abilityIds);
