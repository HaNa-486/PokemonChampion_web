import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/v1/pokemon/battle/route";

describe("battle data API proxy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the catalog species key and returns both formats", async () => {
    const upstreamFetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const format = url.includes("/Singles/") ? "Singles" : "Doubles";
      return Response.json({ pokemon: "Absol", format, season: "Current", rows: [{ category: "held_item", rank: 1, name: "Absolite", percentage: "39.5%", percentage_value: 39.5 }] });
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=mega-absol"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(upstreamFetch).toHaveBeenCalledTimes(2);
    expect(upstreamFetch.mock.calls.every(([url]) => String(url).endsWith("/absol"))).toBe(true);
    expect(body.data.scope).toBe("species-and-mega-forms");
    expect(body.data.singles.rows[0]).toMatchObject({ name: "Absolite", percentageValue: 39.5 });
  });

  it("does not let an arbitrary id become an upstream URL", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await GET(new Request("http://localhost/api/v1/pokemon/battle?pokemonId=https%3A%2F%2Fevil.example"));
    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });
});
