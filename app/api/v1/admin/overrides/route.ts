import { desc } from "drizzle-orm";
import { z } from "zod";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { dataOverrides } from "../../../../../db/schema";
import { isAdminEmail } from "../../../../../lib/admin-auth";
import { apiError } from "../../../../../lib/api";

const bodySchema = z.object({ entityType: z.enum(["pokemon", "move", "ability", "item"]), entityId: z.string().min(1).max(100), fieldPath: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_.-]+$/), locale: z.enum(["en", "zh-Hant"]).nullable().default(null), newValue: z.unknown(), reason: z.string().min(8).max(1000) });

async function authorize() {
  const user = await getChatGPTUser();
  if (!user) return { error: apiError(401, "AUTH_REQUIRED", "Sign in with ChatGPT to access this endpoint.") };
  if (!isAdminEmail(user.email, process.env.ADMIN_EMAILS)) return { error: apiError(403, "ADMIN_REQUIRED", "This account is not authorized for administration.") };
  return { user };
}

export async function GET() {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  try { const db = await getDb(); return Response.json({ data: await db.select().from(dataOverrides).orderBy(desc(dataOverrides.createdAt)).limit(100) }, { headers: { "cache-control": "no-store" } }); }
  catch { return apiError(503, "DATABASE_UNAVAILABLE", "The admin database is not available in this environment."); }
}

export async function POST(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "INVALID_OVERRIDE", "The override payload is invalid.", parsed.error.flatten());
  const entry = { id: crypto.randomUUID(), ...parsed.data, oldValue: null, status: "draft" as const, createdBy: auth.user.email, reviewedBy: null, publishedAt: null };
  try { const db = await getDb(); await db.insert(dataOverrides).values(entry); return Response.json({ data: entry }, { status: 201, headers: { "cache-control": "no-store" } }); }
  catch { return apiError(503, "DATABASE_UNAVAILABLE", "The admin database is not available in this environment."); }
}
