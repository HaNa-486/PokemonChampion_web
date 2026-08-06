import { describe, expect, it } from "vitest";
import { normalizeUpstreamStatus } from "../lib/upstream-status";

describe("upstream data status", () => {
  it("normalizes the official index metadata and newest daily folder", () => {
    expect(normalizeUpstreamStatus({
      generatedAt: "2026-08-05T06:46:04.669Z",
      dataVersion: "20260805064604669",
      defaultSeason: "Current",
      dailyDataFolders: ["M4/04_08_2026", "M4/30_07_2026"],
    })).toEqual({
      sourceGeneratedAt: "2026-08-05T06:46:04.669Z",
      snapshotDate: "2026-08-05",
      dataVersion: "20260805064604669",
      defaultSeason: "Current",
      newestDailySnapshot: "M4/04_08_2026",
    });
  });

  it("rejects incomplete or malformed upstream metadata", () => {
    expect(() => normalizeUpstreamStatus({ generatedAt: "not-a-date", dataVersion: "1", defaultSeason: "Current" })).toThrow();
    expect(() => normalizeUpstreamStatus({ generatedAt: "2026-08-05T00:00:00Z", defaultSeason: "Current" })).toThrow();
  });
});
