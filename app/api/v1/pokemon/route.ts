import { pokemon } from "../../../../lib/catalog";
import { apiSuccess } from "../../../../lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").toLowerCase();
  const format = url.searchParams.get("format") === "singles" ? "singles" : "doubles";
  const data = pokemon.filter((entry) => `${entry.name} ${entry.nameZh} ${entry.types.join(" ")}`.toLowerCase().includes(query)).sort((a, b) => format === "singles" ? a.usageSingles - b.usageSingles : a.usageDoubles - b.usageDoubles);
  return apiSuccess(data);
}
