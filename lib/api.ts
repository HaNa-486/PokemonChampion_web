import { z } from "zod";
import { NEUTRAL_NATURE } from "./domain";

export const statName = z.enum(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]);
export const nonHpStat = z.enum(["attack", "defense", "specialAttack", "specialDefense", "speed"]);
export const statsSchema = z.object({ hp: z.number().int(), attack: z.number().int(), defense: z.number().int(), specialAttack: z.number().int(), specialDefense: z.number().int(), speed: z.number().int() });
export const apSchema = statsSchema.refine((value) => Object.values(value).every((amount) => amount >= 0 && amount <= 32), "Each AP must be between 0 and 32.").refine((value) => Object.values(value).reduce((sum, amount) => sum + amount, 0) <= 66, "Total AP cannot exceed 66.");
export const natureSchema = z.object({ name: z.string().min(1), up: nonHpStat.nullable(), down: nonHpStat.nullable() }).refine((value) => value.up === null && value.down === null || value.up !== value.down, "Nature up/down stats must differ.");
export const calculateStatsSchema = z.object({ pokemonId: z.string().min(1), ap: apSchema, nature: natureSchema.default(NEUTRAL_NATURE) });
export const teamMemberSchema = z.object({ id: z.string().min(1), pokemonId: z.string().min(1), moveIds: z.array(z.string()).max(4), abilityId: z.string().nullable(), itemId: z.string().nullable(), ap: apSchema, nature: natureSchema });
export const validateTeamSchema = z.object({ members: z.array(teamMemberSchema).max(7) });
export const speedCompareSchema = z.object({ entries: z.array(z.object({ pokemonId: z.string(), ap: apSchema, nature: natureSchema, stage: z.number().int().min(-6).max(6).default(0), multiplier: z.number().positive().max(4).default(1) })).max(12), trickRoom: z.boolean().default(false) });

export const API_META = { ruleset: "champions-m4-current", dataVersion: "20260729090313995", snapshotDate: "2026-07-29", stale: false, attribution: [{ label: "Pokémon Champions Battle Data", url: "https://championsbattledata.com/" }] };

export function apiSuccess(data: unknown, init?: ResponseInit) {
  return Response.json({ meta: API_META, data }, { ...init, headers: { "cache-control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400", ...init?.headers } });
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return Response.json({ error: { code, message, details } }, { status, headers: { "cache-control": "no-store" } });
}
