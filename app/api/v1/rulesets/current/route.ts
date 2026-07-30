import { apiSuccess } from "../../../../../lib/api";

export async function GET() {
  return apiSuccess({ code: "champions-m4-current", name: "Regulation M-4", formatOptions: ["singles", "doubles"], ap: { total: 66, perStat: 32 }, calculationVersion: "champions-v1" });
}
