import { apiError, apiSuccess, readBoundedJsonResponse } from "../../../../../lib/api";
import { normalizeBattleUsage } from "../../../../../lib/battle-data";
import { battleDataKeyForPokemon, pokemonById } from "../../../../../lib/catalog";

const UPSTREAM = "https://championsbattledata.com/api/battle";

async function load(format: "Singles" | "Doubles", battleDataKey: string) {
  const response = await fetch(`${UPSTREAM}/${format}/${encodeURIComponent(battleDataKey)}`, {
    headers: { accept: "application/json", "user-agent": "ChampionsLab/0.1 (+https://championsbattledata.com/)" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Upstream ${format} request failed with ${response.status}.`);
  return normalizeBattleUsage(await readBoundedJsonResponse(response), format);
}

export async function GET(request: Request) {
  const pokemonId = new URL(request.url).searchParams.get("pokemonId") ?? "";
  const selected = pokemonById.get(pokemonId);
  if (!selected) return apiError(404, "POKEMON_NOT_FOUND", "The requested Pokémon is not in the current regulation.");
  const battleDataKey = battleDataKeyForPokemon(selected);
  const [singles, doubles] = await Promise.allSettled([load("Singles", battleDataKey), load("Doubles", battleDataKey)]);
  if (singles.status === "rejected" && doubles.status === "rejected") return apiError(502, "BATTLE_DATA_UNAVAILABLE", "Current battle data is temporarily unavailable.");
  return apiSuccess({
    pokemonId: selected.id,
    speciesKey: selected.speciesKey,
    battleDataKey,
    scope: selected.isMega ? "species-and-mega-forms" : "species",
    singles: singles.status === "fulfilled" ? singles.value : null,
    doubles: doubles.status === "fulfilled" ? doubles.value : null,
  }, { headers: { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
}
