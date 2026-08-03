import { moves } from "../../../../lib/catalog";
import { priorityMatches } from "../../../../lib/domain";
import { apiError, apiSuccess } from "../../../../lib/api";

const allowed = new Set(["positive", "zero", "negative"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  if (rawQuery.length > 100) return apiError(400, "INVALID_FILTER", "Search query must not exceed 100 characters.");
  const query = rawQuery.toLowerCase();
  const rawClass = url.searchParams.get("priorityClass");
  if (rawClass && rawClass !== "nonzero" && !allowed.has(rawClass)) return apiError(400, "INVALID_FILTER", "priorityClass must be positive, zero, negative, or nonzero.");
  const classes = rawClass === "nonzero" ? ["positive", "negative"] : rawClass ? [rawClass] : [];
  const min = url.searchParams.has("priorityMin") ? Number(url.searchParams.get("priorityMin")) : -8;
  const max = url.searchParams.has("priorityMax") ? Number(url.searchParams.get("priorityMax")) : 8;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max || min < -8 || max > 8) return apiError(400, "INVALID_FILTER", "Priority range must be integers between -8 and 8.");
  const data = moves.filter((move) => `${move.name} ${move.nameZh}`.toLowerCase().includes(query) && priorityMatches(move, classes as Array<"positive" | "zero" | "negative">) && move.priority >= min && move.priority <= max).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  return apiSuccess(data);
}
