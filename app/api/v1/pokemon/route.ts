import { pokemon } from "../../../../lib/catalog";
import { apiSuccess } from "../../../../lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").toLowerCase();
  const data = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name)).map((entry) => ({
    id: entry.id, speciesKey: entry.speciesKey, name: entry.name, nameZh: entry.nameZh, types: entry.types,
    baseStats: entry.baseStats, imageUrl: entry.imageUrl, abilityIds: entry.abilityIds, moveIds: entry.moveIds, isMega: entry.isMega,
  }));
  return apiSuccess(data);
}
