export const CHAMPIONS_INDEX_URL = "https://championsbattledata.com/api/index";

export type UpstreamStatus = {
  dataVersion: string;
  sourceGeneratedAt: string;
  snapshotDate: string;
  defaultSeason: string;
  newestDailySnapshot: string | null;
};

function requiredString(value: unknown, field: string, maxLength = 100): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new Error(`Champions index ${field} is missing or invalid.`);
  }
  return value;
}

export function normalizeUpstreamStatus(value: unknown): UpstreamStatus {
  if (!value || typeof value !== "object") throw new Error("Champions index must be an object.");
  const source = value as Record<string, unknown>;
  const sourceGeneratedAt = requiredString(source.generatedAt, "generatedAt");
  const timestamp = Date.parse(sourceGeneratedAt);
  if (!Number.isFinite(timestamp)) throw new Error("Champions index generatedAt is not a timestamp.");
  const dataVersion = requiredString(source.dataVersion, "dataVersion", 64);
  const defaultSeason = requiredString(source.defaultSeason, "defaultSeason", 40);
  const dailyFolders = Array.isArray(source.dailyDataFolders) ? source.dailyDataFolders : [];
  const newestDailySnapshot = dailyFolders.find((entry): entry is string => typeof entry === "string" && /^[-A-Za-z0-9_]+\/\d{2}_\d{2}_\d{4}$/.test(entry)) ?? null;
  return {
    dataVersion,
    sourceGeneratedAt: new Date(timestamp).toISOString(),
    snapshotDate: new Date(timestamp).toISOString().slice(0, 10),
    defaultSeason,
    newestDailySnapshot,
  };
}
