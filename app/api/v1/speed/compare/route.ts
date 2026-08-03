import { apiError, apiSuccess, readJsonBody, speedCompareSchema } from "../../../../../lib/api";
import { pokemonById } from "../../../../../lib/catalog";
import { calculateFinalStats, modifiedSpeed } from "../../../../../lib/domain";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = speedCompareSchema.safeParse(body.value);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Invalid speed comparison input.", parsed.error.flatten());
  const rows = parsed.data.entries.map((entry, index) => {
    const pokemon = pokemonById.get(entry.pokemonId);
    if (!pokemon) return null;
    const finalSpeed = calculateFinalStats(pokemon.baseStats, entry.ap, entry.nature).speed;
    return { inputIndex: index, pokemonId: pokemon.id, name: pokemon.name, finalSpeed, modifiedSpeed: modifiedSpeed(finalSpeed, entry.stage, entry.multiplier), stage: entry.stage, multiplier: entry.multiplier };
  });
  if (rows.some((row) => row === null)) return apiError(404, "POKEMON_NOT_FOUND", "One or more Pokémon are unavailable.");
  const sorted = rows.filter((row): row is NonNullable<typeof row> => row !== null).sort((a, b) => parsed.data.trickRoom ? a.modifiedSpeed - b.modifiedSpeed : b.modifiedSpeed - a.modifiedSpeed);
  return apiSuccess({ trickRoom: parsed.data.trickRoom, calculationVersion: "champions-v1", rows: sorted }, { headers: { "cache-control": "no-store" } });
}
