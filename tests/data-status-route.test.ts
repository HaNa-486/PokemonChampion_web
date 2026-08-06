import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/v1/data-status/route";
import { API_META } from "../lib/api";

describe("data status API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the live upstream generation date", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      generatedAt: "2026-08-05T06:46:04.669Z",
      dataVersion: "20260805064604669",
      defaultSeason: "Current",
      dailyDataFolders: ["M4/04_08_2026"],
    })));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: {
      snapshotDate: "2026-08-05",
      dataVersion: "20260805064604669",
      newestDailySnapshot: "M4/04_08_2026",
      stale: false,
    } });
  });

  it("keeps the bundled snapshot available when upstream is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { snapshotDate: API_META.snapshotDate, stale: true } });
  });
});
