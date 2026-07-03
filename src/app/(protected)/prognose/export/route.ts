import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { getForecastItemsForFreelancer } from "@/lib/data/income-forecast";
import { exportForecastCsv } from "@/lib/income-forecast";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `prognose:${actor.id}`);
  if (limited) return limited;

  const items = await getForecastItemsForFreelancer(actor.id);
  const csv = exportForecastCsv(items, new Date());

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inkomstenprognose-${date}.csv"`,
    },
  });
}
