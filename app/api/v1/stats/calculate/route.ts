import { calculateStatsSchema, apiError, apiSuccess, readJsonBody } from "../../../../../lib/api";
import { pokemonById } from "../../../../../lib/catalog";
import { calculateFinalStats } from "../../../../../lib/domain";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = calculateStatsSchema.safeParse(body.value);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Invalid calculation input.", parsed.error.flatten());
  const pokemon = pokemonById.get(parsed.data.pokemonId);
  if (!pokemon) return apiError(404, "POKEMON_NOT_FOUND", "Pokémon is unavailable in the current Regulation.");
  return apiSuccess({ pokemonId: pokemon.id, calculationVersion: "champions-v1", baseStats: pokemon.baseStats, finalStats: calculateFinalStats(pokemon.baseStats, parsed.data.ap, parsed.data.nature) }, { headers: { "cache-control": "no-store" } });
}
