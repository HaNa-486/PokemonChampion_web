import snapshot from "../../../../data/generated/champions-snapshot.json";
import { apiSuccess, readBoundedJsonResponse } from "../../../../lib/api";
import { CHAMPIONS_INDEX_URL, normalizeUpstreamStatus } from "../../../../lib/upstream-status";

function bundledStatus() {
  const source = snapshot.sources.champions;
  return {
    dataVersion: source.dataVersion,
    sourceGeneratedAt: source.generatedAt,
    snapshotDate: source.generatedAt.slice(0, 10),
    defaultSeason: snapshot.ruleset.defaultSeason,
    newestDailySnapshot: null,
    stale: true,
  };
}

export async function GET() {
  try {
    const response = await fetch(CHAMPIONS_INDEX_URL, {
      headers: { accept: "application/json", "user-agent": "ChampionsLab/0.1 (+https://championsbattledata.com/)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Champions index request failed with ${response.status}.`);
    return apiSuccess({ ...normalizeUpstreamStatus(await readBoundedJsonResponse(response, 8 * 1024 * 1024)), stale: false }, {
      headers: { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return apiSuccess(bundledStatus(), {
      headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" },
    });
  }
}
