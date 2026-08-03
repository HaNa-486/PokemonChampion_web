import { pokemon } from "../../../../lib/catalog";
import { apiError, apiSuccess } from "../../../../lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  if (rawQuery.length > 100) return apiError(400, "INVALID_FILTER", "Search query must not exceed 100 characters.");
  const query = rawQuery.toLowerCase();
  const data = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name)).map((entry) => ({
    id: entry.id, speciesKey: entry.speciesKey, name: entry.name, nameZh: entry.nameZh, types: entry.types,
    baseStats: entry.baseStats, imageUrl: entry.imageUrl, abilityIds: entry.abilityIds, moveIds: entry.moveIds, isMega: entry.isMega,
  }));
  return apiSuccess(data);
}
