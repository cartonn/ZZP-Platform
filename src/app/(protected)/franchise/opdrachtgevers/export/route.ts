// CSV-export van de opdrachtgever-uitsplitsing die de bemiddelaar op `/inzicht` ziet (betaalde omzet,
// aantal diensten, vulgraad per opdrachtgever). Hergebruikt exact dezelfde tenant-gescopet aggregator
// (`getTenantCompanyBreakdown`) en dezelfde "met activiteit"-filter als de widget, zodat de export
// nooit afwijkt van het scherm. Server-side waarheid (CLAUDE.md regel 1); read-only; alleen de eigen
// franchise (tenant-gescopet); geaudit (AVG art. 5(2), parity met de andere export-routes).

import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getTenantCompanyBreakdown } from "@/lib/tenant-stats";
import { companyBreakdownCsv } from "@/lib/franchise/company-breakdown-export";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  if (actor.role !== "FRANCHISER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `franchise-companies:${actor.id}`);
  if (limited) return limited;

  const breakdown = await getTenantCompanyBreakdown(actor);
  // Exact dezelfde filter als de "Per opdrachtgever"-widget: alleen opdrachtgevers met activiteit.
  const visible = breakdown.filter((r) => r.totalJobs > 0 || r.revenuePaidCents > 0);
  const csv = companyBreakdownCsv(visible);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "TENANT_COMPANY_BREAKDOWN_EXPORTED",
      entityType: "Tenant",
      entityId: actor.tenantId ?? "self",
      metadata: { count: visible.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="opdrachtgevers-${date}.csv"`,
    },
  });
}
