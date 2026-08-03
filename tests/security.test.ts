import { describe, expect, it } from "vitest";
import { isSameOriginRequest, readBoundedJsonResponse, readJsonBody } from "../lib/api";

describe("public API request hardening", () => {
  it("rejects non-JSON and oversized request bodies before parsing", async () => {
    const wrongType = await readJsonBody(new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    }));
    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.response.status).toBe(415);

    const oversized = await readJsonBody(new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(128) }),
    }), 64);
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) expect(oversized.response.status).toBe(413);
  });

  it("accepts bounded JSON and rejects malformed JSON", async () => {
    const valid = await readJsonBody(new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ safe: true }),
    }));
    expect(valid).toEqual({ ok: true, value: { safe: true } });

    const malformed = await readJsonBody(new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }));
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.response.status).toBe(400);
  });

  it("requires an exact same-origin Origin header for protected writes", () => {
    expect(isSameOriginRequest(new Request("https://champions.example/api", {
      headers: { origin: "https://champions.example" },
    }))).toBe(true);
    expect(isSameOriginRequest(new Request("https://champions.example/api", {
      headers: { origin: "https://evil.example" },
    }))).toBe(false);
    expect(isSameOriginRequest(new Request("https://champions.example/api"))).toBe(false);
  });

  it("caps upstream JSON before parsing it", async () => {
    const response = new Response(JSON.stringify({ value: "x".repeat(128) }));
    await expect(readBoundedJsonResponse(response, 64)).rejects.toThrow();
  });
});
