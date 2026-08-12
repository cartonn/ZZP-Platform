import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getObligationItemsForClient } from "@/lib/data/payment-obligations";
import { exportObligationsCsv } from "@/lib/payment-obligations";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    // Een mid-sessie geschorst/geanonimiseerd account houdt een geldige JWT (middleware laat door op
    // de stale claim), maar requireActor() leest vers uit de DB en werpt 401/403. Vang dat af tot een
    // nette response i.p.v. een rauwe 500 — parity met /api/agenda en de andere export/PDF-routes.
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  if (actor.role !== "CLIENT") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `verplichtingen:${actor.id}`);
  if (limited) return limited;

  const items = await getObligationItemsForClient(actor.id);
  const csv = exportObligationsCsv(items, new Date());

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van financiële PII vast — parity met de
  // administratie-/audit-exportroutes die dit al doen. Zo is "wie exporteerde wat wanneer" traceerbaar.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "OBLIGATIONS_EXPORTED",
      entityType: "Invoice",
      entityId: "self",
      metadata: { count: items.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="betaalverplichtingen-${date}.csv"`,
    },
  });
}
