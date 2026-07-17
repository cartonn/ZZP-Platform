import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
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

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van financiële PII vast — parity met de
  // administratie-/audit-exportroutes die dit al doen. Zo is "wie exporteerde wat wanneer" traceerbaar.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "PRESTATIES_EXPORTED",
      entityType: "Performance",
      entityId: "self",
      metadata: { count: prestaties.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestaties-${date}.csv"`,
    },
  });
}
