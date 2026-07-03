import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { getObligationItemsForClient } from "@/lib/data/payment-obligations";
import { exportObligationsCsv } from "@/lib/payment-obligations";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "CLIENT") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `verplichtingen:${actor.id}`);
  if (limited) return limited;

  const items = await getObligationItemsForClient(actor.id);
  const csv = exportObligationsCsv(items, new Date());

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="betaalverplichtingen-${date}.csv"`,
    },
  });
}
