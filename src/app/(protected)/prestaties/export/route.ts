import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { getPrestatiesForClient, exportPrestatiesCsv } from "@/lib/prestaties";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "CLIENT") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `prestaties:${actor.id}`);
  if (limited) return limited;

  const prestaties = await getPrestatiesForClient(actor.id);
  const csv = exportPrestatiesCsv(prestaties);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestaties-${date}.csv"`,
    },
  });
}
