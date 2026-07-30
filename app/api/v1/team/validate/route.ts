import { apiError, apiSuccess, validateTeamSchema } from "../../../../../lib/api";
import { items, pokemonById } from "../../../../../lib/catalog";
import { validateTeam } from "../../../../../lib/domain";

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return apiError(400, "INVALID_JSON", "Request body must be valid JSON."); }
  const parsed = validateTeamSchema.safeParse(input);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Invalid team input.", parsed.error.flatten());
  const issues = validateTeam(parsed.data.members, pokemonById, new Set(items.map((item) => item.id)));
  return apiSuccess({ legal: issues.length === 0, issues }, { headers: { "cache-control": "no-store" } });
}
