import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getDienstenForFreelancer, exportDienstenCsv } from "@/lib/diensten";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `diensten:${actor.id}`);
  if (limited) return limited;

  const diensten = await getDienstenForFreelancer(actor.id);
  const csv = exportDienstenCsv(diensten);

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van financiële PII vast — parity met de
  // administratie-/audit-exportroutes die dit al doen. Zo is "wie exporteerde wat wanneer" traceerbaar.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "DIENSTEN_EXPORTED",
      entityType: "Job",
      entityId: "self",
      metadata: { count: diensten.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diensten-${date}.csv"`,
    },
  });
}
