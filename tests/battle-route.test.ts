import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/v1/pokemon/battle/route";

describe("battle data API proxy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses a form-specific battle data key and returns both formats", async () => {
    const upstreamFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      const url = String(input);
      const format = url.includes("/Singles/") ? "Singles" : "Doubles";
      const pokemon = url.endsWith("/ninetalesalola") ? "Alolan Ninetales" : "Ninetales";
      return Response.json({ pokemon, format, season: "Current", rows: [{ category: "held_item", rank: 1, name: pokemon === "Alolan Ninetales" ? "Light Clay" : "Heat Rock", percentage: "39.5%", percentage_value: 39.5 }] });
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=alolan-ninetales"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(upstreamFetch).toHaveBeenCalledTimes(2);
    expect(upstreamFetch.mock.calls.every(([url]) => String(url).endsWith("/ninetalesalola"))).toBe(true);
    expect(body.data.battleDataKey).toBe("ninetalesalola");
    expect(body.data.scope).toBe("species");
    expect(body.data.singles.rows[0]).toMatchObject({ name: "Light Clay", percentageValue: 39.5 });
  });

  it("keeps related regional forms on distinct upstream URLs", async () => {
    const upstreamFetch = vi.fn(async (input: string | URL | Request) => Response.json({ pokemon: String(input).endsWith("ninetalesalola") ? "Alolan Ninetales" : "Ninetales", format: String(input).includes("/Singles/") ? "Singles" : "Doubles", season: "Current", rows: [] }));
    vi.stubGlobal("fetch", upstreamFetch);
    await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=ninetales"));
    await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=alolan-ninetales"));
    const urls = upstreamFetch.mock.calls.map(([url]) => String(url));
    expect(urls.filter((url) => url.endsWith("/ninetales"))).toHaveLength(2);
    expect(urls.filter((url) => url.endsWith("/ninetalesalola"))).toHaveLength(2);
  });

  it("does not let an arbitrary id become an upstream URL", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=https%3A%2F%2Fevil.example"));
    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("rejects oversized upstream payloads", async () => {
    const upstreamFetch = vi.fn(async () => new Response("{}", {
      headers: { "content-type": "application/json", "content-length": String(2 * 1024 * 1024) },
    }));
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=ninetales"));
    expect(response.status).toBe(502);
  });
});
