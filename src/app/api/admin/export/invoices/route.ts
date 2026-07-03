// Admin-only CSV-export van alle cascade-facturen (PLATFORM_OVERHAUL.md §5).
// Geeft het platform financieel toezicht zonder dat factuurgegevens via de UI
// gekopieerd hoeven te worden. Auditregel bij elke export.

import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { platformInvoicesCsv } from "@/lib/administration/csv";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  // Deze export dumpt ÁLLE platformfacturen met tegenpartij-PII per call — grootste amplificatie.
  const limited = await enforceRateLimit(exportRateLimiter, `admin-invoices:${actor.id}`);
  if (limited) return limited;

  const invoices = await prisma.invoice.findMany({
    where: { lifecycleStatus: { not: null } },
    include: {
      collaboration: {
        include: {
          job: { select: { title: true } },
          company: { select: { name: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ issuedAt: "asc" }, { createdAt: "asc" }],
  });

  const rows = invoices.map((inv) => ({
    date: inv.issuedAt ?? inv.createdAt,
    partyInvoiceNumber: inv.partyInvoiceNumber,
    freelancerName: inv.collaboration?.freelancer.user.name ?? "—",
    clientName: inv.collaboration?.company.name ?? "—",
    jobTitle: inv.collaboration?.job.title ?? "—",
    subtotalCents: inv.subtotalCents,
    vatCents: inv.vatCents,
    totalCents: inv.totalCents,
    lifecycleStatus: inv.lifecycleStatus,
    dueAt: inv.dueAt,
  }));

  const csv = platformInvoicesCsv(rows);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "PLATFORM_INVOICES_EXPORTED",
      entityType: "Invoice",
      entityId: "all",
      metadata: { count: rows.length },
    }),
  });

  const filename = `platform-facturen-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
