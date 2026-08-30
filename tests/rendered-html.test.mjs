import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html", ...init.headers }, ...init }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders Champions Lab instead of the starter", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /upgrade-insecure-requests/);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Champions Lab/);
  assert.match(html, /CHAMPIONS LAB/);
  assert.match(html, /Pokémon DB/);
  assert.match(html, /Battle data provided by/);
  assert.match(html, /inspect move priority and type matchups/);
  assert.doesNotMatch(html, /compare Speed/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("server-renders the standalone type matchup chart", async () => {
  const response = await render("/type-chart");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Type Matchup Chart/);
  assert.match(html, /Attack.*Defend/);
});

test("filters move priority through the built API", async () => {
  const response = await render("/api/v1/moves?priorityClass=negative", { headers: { accept: "application/json" } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.data.length >= 2);
  assert.ok(body.data.every((move) => move.priority < 0));
  assert.equal(body.meta.ruleset, "champions-m4-current");
});

test("serves the expanded current Champions form snapshot", async () => {
  const response = await render("/api/v1/pokemon", { headers: { accept: "application/json" } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.data.length >= 300);
  assert.ok(body.data.some((entry) => entry.id === "garchomp"));
  assert.ok(body.data.some((entry) => entry.id === "mega-charizard-x"));
});

test("rejects unauthenticated admin API calls before database access", async () => {
  const response = await render("/api/v1/admin/overrides", { headers: { accept: "application/json" } });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, "AUTH_REQUIRED");
});

test("calculates the golden Mega Charizard X build through the built API", async () => {
  const response = await render("/api/v1/stats/calculate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ pokemonId: "mega-charizard-x", ap: { hp: 2, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 }, nature: { name: "Adamant", up: "attack", down: "specialAttack" } }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data.finalStats, { hp: 155, attack: 200, defense: 131, specialAttack: 135, specialDefense: 105, speed: 152 });
});

const neutralNature = { name: "Serious", up: null, down: null };
const zeroAp = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
const speedEntries = [
  { pokemonId: "alakazam", ap: zeroAp, nature: neutralNature, stage: 0, multiplier: 1 },
  { pokemonId: "abomasnow", ap: zeroAp, nature: neutralNature, stage: 0, multiplier: 1 },
];

test("keeps the dormant speed comparison API contract stable in normal and Trick Room order", async () => {
  for (const trickRoom of [false, true]) {
    const response = await render("/api/v1/speed/compare", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ entries: speedEntries, trickRoom }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.meta.ruleset, "champions-m4-current");
    assert.equal(body.data.calculationVersion, "champions-v1");
    assert.equal(body.data.trickRoom, trickRoom);
    assert.deepEqual(body.data.rows.map((row) => row.pokemonId), trickRoom ? ["abomasnow", "alakazam"] : ["alakazam", "abomasnow"]);
    assert.deepEqual(body.data.rows.map((row) => row.finalSpeed), trickRoom ? [80, 140] : [140, 80]);
    assert.ok(body.data.rows.every((row) => row.modifiedSpeed === row.finalSpeed && row.stage === 0 && row.multiplier === 1));
  }
});

test("preserves identical-build speed ties with non-default stage and multiplier traces", async () => {
  const tiedEntries = [0, 1].map(() => ({ ...speedEntries[0], stage: 1, multiplier: 1.5 }));
  const response = await render("/api/v1/speed/compare", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ entries: tiedEntries, trickRoom: false }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.data.calculationVersion, "champions-v1");
  assert.deepEqual(body.data.rows.map((row) => row.inputIndex), [0, 1]);
  assert.deepEqual(body.data.rows.map((row) => row.pokemonId), ["alakazam", "alakazam"]);
  assert.ok(body.data.rows.every((row) => row.finalSpeed === 140 && row.modifiedSpeed === 315 && row.stage === 1 && row.multiplier === 1.5));
});

test("rejects invalid and unknown Pokémon speed comparison requests", async () => {
  const invalid = await render("/api/v1/speed/compare", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ entries: [{ ...speedEntries[0], stage: 7 }], trickRoom: false }) });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get("cache-control"), "no-store");
  assert.equal((await invalid.json()).error.code, "VALIDATION_ERROR");

  const unknown = await render("/api/v1/speed/compare", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ entries: [{ ...speedEntries[0], pokemonId: "missing-pokemon" }], trickRoom: false }) });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.headers.get("cache-control"), "no-store");
  assert.equal((await unknown.json()).error.code, "POKEMON_NOT_FOUND");
});

test("rejects duplicate species and held items through the built API", async () => {
  const shared = { moveIds: [], abilityId: null, ap: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }, nature: { name: "Serious", up: null, down: null } };
  const response = await render("/api/v1/team/validate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ members: [{ ...shared, id: "one", pokemonId: "charizard", itemId: "life-orb" }, { ...shared, id: "two", pokemonId: "charizard", itemId: "life-orb" }] }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.legal, false);
  assert.deepEqual(new Set(body.data.issues.map((issue) => issue.code)), new Set(["DUPLICATE_POKEMON", "DUPLICATE_ITEM"]));
});

test("rejects a base Pokemon and its Mega form in the same built-API team", async () => {
  const shared = { moveIds: [], abilityId: null, ap: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }, nature: { name: "Serious", up: null, down: null } };
  const response = await render("/api/v1/team/validate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ members: [
    { ...shared, id: "base", pokemonId: "alakazam", itemId: "sitrus-berry" },
    { ...shared, id: "mega", pokemonId: "mega-alakazam", itemId: "alakazite" },
  ] }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.legal, false);
  assert.ok(body.data.issues.some((issue) => issue.code === "DUPLICATE_POKEMON"));
});

test("rejects two Mega branches of the same Pokemon in the built API", async () => {
  const shared = { moveIds: [], abilityId: null, ap: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }, nature: { name: "Serious", up: null, down: null } };
  const response = await render("/api/v1/team/validate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ members: [
    { ...shared, id: "mega-x", pokemonId: "mega-raichu-x", itemId: "raichunite-x" },
    { ...shared, id: "mega-y", pokemonId: "mega-raichu-y", itemId: "raichunite-y" },
  ] }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.legal, false);
  assert.ok(body.data.issues.some((issue) => issue.code === "DUPLICATE_POKEMON"));
});

test("enforces the dedicated Mega Stone through the built API", async () => {
  const shared = { moveIds: [], abilityId: null, ap: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }, nature: { name: "Serious", up: null, down: null } };
  const wrong = await render("/api/v1/team/validate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ members: [{ ...shared, id: "mega", pokemonId: "mega-absol", itemId: "life-orb" }] }) });
  const wrongBody = await wrong.json();
  assert.equal(wrongBody.data.legal, false);
  assert.ok(wrongBody.data.issues.some((issue) => issue.code === "MEGA_STONE_REQUIRED"));
  const legal = await render("/api/v1/team/validate", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ members: [{ ...shared, id: "mega", pokemonId: "mega-absol", itemId: "absolite" }] }) });
  assert.equal((await legal.json()).data.legal, true);
});
