// Admin-only CSV-export van het audit-log (AVG-verantwoording / klaar voor het bedrijfsbezoek).
// Past dezelfde actie-/entiteit-filters toe als het audit-paneel (server-side waarheid) en logt de
// export zelf als auditregel. Spiegelt de bestaande export-routes (avg, platform-facturen).

import type { Prisma } from "@prisma/client";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ciContains } from "@/lib/db/text-search";
import { normalizeAuditFilters } from "@/lib/admin";
import {
  AUDIT_EXPORT_CAP,
  auditExportCsv,
  auditExportFilename,
  isAuditExportTruncated,
} from "@/lib/audit-export";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

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

  // Totaal (vóór de cap) naast de gecapte rijen: nodig om truncatie eerlijk te melden in de CSV,
  // de bestandsnaam én de export-auditregel (AVG art. 5(2) verantwoordingsplicht).
  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: AUDIT_EXPORT_CAP,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const summary = { exported: entries.length, total };

  const csv = auditExportCsv(
    entries.map((e) => ({
      createdAt: e.createdAt,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      actorName: e.actor?.name ?? null,
      metadata: e.metadata,
    })),
    summary,
  );

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "AUDIT_LOG_EXPORTED",
      entityType: "AuditLog",
      entityId: "all",
      metadata: {
        count: entries.length,
        total,
        truncated: isAuditExportTruncated(summary),
        action: filters.action,
        entityType: filters.entityType,
      },
    }),
  });

  const filename = auditExportFilename(new Date(), summary);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
