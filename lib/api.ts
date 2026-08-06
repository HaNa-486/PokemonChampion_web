import { z } from "zod";
import { NEUTRAL_NATURE } from "./domain";
import snapshot from "../data/generated/champions-snapshot.json";

export const statName = z.enum(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]);
export const nonHpStat = z.enum(["attack", "defense", "specialAttack", "specialDefense", "speed"]);
export const statsSchema = z.object({ hp: z.number().int(), attack: z.number().int(), defense: z.number().int(), specialAttack: z.number().int(), specialDefense: z.number().int(), speed: z.number().int() });
export const apSchema = statsSchema.refine((value) => Object.values(value).every((amount) => amount >= 0 && amount <= 32), "Each AP must be between 0 and 32.").refine((value) => Object.values(value).reduce((sum, amount) => sum + amount, 0) <= 66, "Total AP cannot exceed 66.");
export const natureSchema = z.object({ name: z.string().min(1), up: nonHpStat.nullable(), down: nonHpStat.nullable() }).refine((value) => value.up === null && value.down === null || value.up !== value.down, "Nature up/down stats must differ.");
export const calculateStatsSchema = z.object({ pokemonId: z.string().min(1), ap: apSchema, nature: natureSchema.default(NEUTRAL_NATURE) });
export const teamMemberSchema = z.object({ id: z.string().min(1), pokemonId: z.string().min(1), moveIds: z.array(z.string()).max(4), abilityId: z.string().nullable(), itemId: z.string().nullable(), ap: apSchema, nature: natureSchema });
export const validateTeamSchema = z.object({ members: z.array(teamMemberSchema).max(7) });
export const speedCompareSchema = z.object({ entries: z.array(z.object({ pokemonId: z.string(), ap: apSchema, nature: natureSchema, stage: z.number().int().min(-6).max(6).default(0), multiplier: z.number().positive().max(4).default(1) })).max(12), trickRoom: z.boolean().default(false) });

const championsSource = snapshot.sources.champions;
export const API_META = {
  ruleset: "champions-m4-current",
  dataVersion: championsSource.dataVersion,
  snapshotDate: championsSource.generatedAt.slice(0, 10),
  stale: false,
  attribution: [{ label: "Pokémon Champions Battle Data", url: "https://championsbattledata.com/" }],
};

export function apiSuccess(data: unknown, init?: ResponseInit) {
  return Response.json({ meta: API_META, data }, { ...init, headers: { "cache-control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400", ...init?.headers } });
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return Response.json({ error: { code, message, details } }, { status, headers: { "cache-control": "no-store" } });
}

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

export async function readJsonBody(
  request: Request,
  maxBytes = 32 * 1024,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/(?:[\w!#$&^_.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    return {
      ok: false,
      response: apiError(415, "JSON_REQUIRED", "Content-Type must be application/json."),
    };
  }

  const advertisedLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertisedLength) && advertisedLength > maxBytes) {
    return {
      ok: false,
      response: apiError(413, "PAYLOAD_TOO_LARGE", `Request body must not exceed ${maxBytes} bytes.`),
    };
  }

  try {
    const text = await readBoundedText(request.body, maxBytes);
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return {
        ok: false,
        response: apiError(413, "PAYLOAD_TOO_LARGE", `Request body must not exceed ${maxBytes} bytes.`),
      };
    }
    return {
      ok: false,
      response: apiError(400, "INVALID_JSON", "Request body must be valid JSON."),
    };
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readBoundedJsonResponse(
  response: Response,
  maxBytes = 1024 * 1024,
): Promise<unknown> {
  const advertisedLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(advertisedLength) && advertisedLength > maxBytes) {
    throw new PayloadTooLargeError();
  }
  return JSON.parse(await readBoundedText(response.body, maxBytes));
}

class PayloadTooLargeError extends Error {}

async function readBoundedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<string> {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new PayloadTooLargeError();
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
