// Admin-only CSV-export van het audit-log (AVG-verantwoording / klaar voor het bedrijfsbezoek).
// Past dezelfde actie-/entiteit-filters toe als het audit-paneel (server-side waarheid) en logt de
// export zelf als auditregel. Spiegelt de bestaande export-routes (avg, platform-facturen).

import type { Prisma } from "@prisma/client";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ciContains } from "@/lib/db/text-search";
import { normalizeAuditFilters } from "@/lib/admin";
import { auditExportCsv } from "@/lib/audit-export";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

// Defensieve bovengrens: een audit-log groeit onbegrensd; we exporteren de meest recente rijen.
const AUDIT_EXPORT_CAP = 10000;

export async function GET(request: Request): Promise<Response> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const limited = await enforceRateLimit(exportRateLimiter, `admin-audit:${actor.id}`);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const filters = normalizeAuditFilters(Object.fromEntries(searchParams.entries()));

  // Identiek aan AuditPanel: contains-filter op actie/entiteit (page wordt voor de export genegeerd).
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.action) where.action = ciContains(filters.action);
  if (filters.entityType) where.entityType = ciContains(filters.entityType);

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: AUDIT_EXPORT_CAP,
    include: { actor: { select: { name: true } } },
  });

  const csv = auditExportCsv(
    entries.map((e) => ({
      createdAt: e.createdAt,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      actorName: e.actor?.name ?? null,
      metadata: e.metadata,
    })),
  );

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "AUDIT_LOG_EXPORTED",
      entityType: "AuditLog",
      entityId: "all",
      metadata: {
        count: entries.length,
        action: filters.action,
        entityType: filters.entityType,
      },
    }),
  });

  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
