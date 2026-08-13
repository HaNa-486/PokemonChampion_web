import type { Ability, HeldItem, Move, Pokemon } from "./types";
import snapshot from "../data/generated/champions-snapshot.json";
import itemSprites from "../data/generated/item-sprites.json";

export const catalogSnapshotDate = snapshot.sources.champions.generatedAt.slice(0, 10);

const asset = (name: string) => `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent(name)}.png`;
export const abilities: Ability[] = snapshot.abilities.map((entry) => ({
  id: entry.id, name: entry.name, nameZh: entry.nameZh || entry.name,
  description: entry.description || "No ability description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有特性說明。",
}));

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

const itemSpriteById = itemSprites.items as Record<string, { imageUrl: string; sourcePath: string }>;
const generatedItemById = new Map<string, HeldItem>(snapshot.items.map((entry) => [entry.id, { ...entry, imageUrl: itemSpriteById[entry.id]?.imageUrl ?? null }]));
for (const [pokemonId, name] of Object.entries(megaStoneNameByPokemonId)) {
  const id = itemId(name);
  if (!generatedItemById.has(id)) generatedItemById.set(id, { id, name, nameZh: name, category: "Mega Stone", description: `Required for ${pokemonId.replaceAll("-", " ").replace(/^mega /, "Mega ")} to Mega Evolve.`, descriptionZh: `此超級石為 ${name}，是該寶可夢進行超級進化時的必備持有物。`, imageUrl: null });
}
export const items: HeldItem[] = [...generatedItemById.values()].map((entry) => ({
  id: entry.id, name: entry.name, nameZh: entry.nameZh || entry.name,
  category: entry.category || "Held item",
  description: entry.description || "No held item description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有持有物說明。",
  imageUrl: entry.imageUrl,
}));

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
  target: entry.target ?? "Varies",
  flags: entry.flags ?? [],
  description: entry.description || "No effect description is available.",
  descriptionZh: entry.descriptionZh || entry.description || "目前沒有招式說明。",
}));

export const moves: Move[] = generatedMoves;
const generatedMoveIdByName = new Map(snapshot.moves.map((entry) => [entry.name, entry.id]));
const curatedPokemonById = new Map(curatedPokemon.map((entry) => [entry.id, entry]));

const generatedPokemon: Pokemon[] = snapshot.pokemon.map((entry, index) => {
  const curated = curatedPokemonById.get(entry.id);
  return {
    id: entry.id,
    speciesKey: entry.speciesKey,
    battleDataKey: entry.battleDataKey ?? entry.speciesKey,
    name: entry.name,
    nameZh: entry.nameZh || curated?.nameZh || entry.name,
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
