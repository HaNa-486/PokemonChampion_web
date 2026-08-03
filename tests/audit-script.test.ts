import { describe, expect, it } from "vitest";
import snapshot from "../data/generated/champions-snapshot.json";
import { auditSnapshot } from "../scripts/audit-form-integrity.mjs";

describe("deployment data audit", () => {
  it("accepts the committed form-specific snapshot", () => {
    expect(auditSnapshot(snapshot).errors).toEqual([]);
  });

  it("rejects a regional form mapped to its base form battle source", () => {
    const broken = structuredClone(snapshot);
    const alolan = broken.pokemon.find((entry) => entry.id === "alolan-ninetales")!;
    alolan.battleDataKey = "ninetales";
    expect(auditSnapshot(broken).errors).toEqual(expect.arrayContaining([
      expect.stringContaining("alolan-ninetales uses ninetales"),
      expect.stringContaining("must not share a battleDataKey"),
    ]));
  });
});
