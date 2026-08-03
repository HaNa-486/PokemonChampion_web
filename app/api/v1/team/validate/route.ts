import { apiError, apiSuccess, readJsonBody, validateTeamSchema } from "../../../../../lib/api";
import { items, megaStoneIdByPokemonId, pokemonById } from "../../../../../lib/catalog";
import { validateTeam } from "../../../../../lib/domain";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = validateTeamSchema.safeParse(body.value);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Invalid team input.", parsed.error.flatten());
  const issues = validateTeam(parsed.data.members, pokemonById, new Set(items.map((item) => item.id)), megaStoneIdByPokemonId);
  return apiSuccess({ legal: issues.length === 0, issues }, { headers: { "cache-control": "no-store" } });
}
