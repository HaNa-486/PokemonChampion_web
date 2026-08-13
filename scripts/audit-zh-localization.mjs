import { readFile } from "node:fs/promises";
import * as OpenCC from "opencc-js";

const toTaiwanTraditional = OpenCC.Converter({ from: "cn", to: "twp" });
const snapshot = JSON.parse(await readFile("data/generated/champions-snapshot.json", "utf8"));
const localization = JSON.parse(await readFile("data/localization/zh-Hant.json", "utf8"));
const errors = [];
const allowedLatinTerms = /\b(?:HP|PP|STAB|kg)\b/g;

function numericTokens(value) {
  return [...value.matchAll(/\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?%?/g)].map((match) => match[0].replaceAll(" ", ""));
}

for (const section of ["moves", "abilities", "items"]) {
  const descriptions = localization.descriptions?.[section] ?? {};
  const sources = localization.sourceDescriptions?.[section] ?? {};
  for (const entry of snapshot[section]) {
    const zh = descriptions[entry.id] ?? "";
    const en = entry.description ?? "";
    if (sources[entry.id] !== en) errors.push(`${section}:${entry.id} source English is stale or missing`);
    if (!zh || !/[\u3400-\u9fff]/u.test(zh)) errors.push(`${section}:${entry.id} has no Traditional Chinese description`);
    if (toTaiwanTraditional(zh) !== zh) errors.push(`${section}:${entry.id} is not normalized to Taiwan Traditional Chinese`);
    const unexpectedLatin = zh.replace(allowedLatinTerms, "").match(/[A-Za-z][A-Za-z-]{2,}/g);
    if (unexpectedLatin) errors.push(`${section}:${entry.id} contains untranslated English: ${[...new Set(unexpectedLatin)].join(", ")}`);
    if (/(?:ZXQ|TERM|QXZ|ZQZ)/.test(zh)) errors.push(`${section}:${entry.id} contains a broken translation placeholder`);
    for (const token of numericTokens(en)) {
      if (!numericTokens(zh).includes(token)) errors.push(`${section}:${entry.id} lost numeric mechanic ${token}`);
    }
    if (/single use/i.test(en) && !/(一次|單次|使用後|消失)/.test(zh)) errors.push(`${section}:${entry.id} lost the single-use condition`);
    if (/rounded down/i.test(en) && !/(向下|捨去|無條件捨去)/.test(zh)) errors.push(`${section}:${entry.id} lost the rounded-down condition`);
    if (/multiplied by/i.test(en) && !/(乘以|倍)/.test(zh)) errors.push(`${section}:${entry.id} lost the multiplier relationship`);
  }
}

for (const [section, entries] of Object.entries({
  pokemon: snapshot.pokemon,
  moves: snapshot.moves,
  abilities: snapshot.abilities,
  items: snapshot.items,
})) {
  for (const entry of entries) {
    const name = section === "pokemon" ? localization.pokemonNames?.[entry.id] : localization.names?.[section]?.[entry.id] ?? entry.nameZh;
    const source = localization.nameSources?.[section]?.[entry.id];
    if (!name || !/[\u3400-\u9fff]/u.test(name)) errors.push(`${section}:${entry.id} has no Traditional Chinese name`);
    // Official PokeAPI zh-Hant names take precedence over OpenCC's Taiwan lexical
    // preferences; OpenCC may rewrite valid official spellings even when no
    // Simplified Chinese is present.
    if (!source) errors.push(`${section}:${entry.id} has no name provenance`);
  }
}

const blaze = localization.descriptions.abilities.blaze;
if (!blaze.includes("1/3") || !blaze.includes("1.5")) errors.push("golden: Blaze must retain the 1/3 threshold and 1.5 multiplier");
const sitrus = localization.descriptions.items["sitrus-berry"];
if (!sitrus.includes("1/2") || !sitrus.includes("1/4") || !/(一次|使用後|消失)/.test(sitrus)) errors.push("golden: Sitrus Berry must retain 1/2, 1/4, and single-use mechanics");

if (errors.length) {
  console.error(`Traditional Chinese semantic audit failed (${errors.length}):\n${errors.slice(0, 100).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Traditional Chinese semantic audit passed: ${snapshot.moves.length} moves, ${snapshot.abilities.length} abilities, ${snapshot.items.length} items.`);
}
