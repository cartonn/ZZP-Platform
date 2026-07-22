// CSV-export van de openstaande posten (ouderdomsanalyse / aging).
// Exporteert alle openstaande facturen van de ingelogde gebruiker als CSV.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildAgingReport, agingCsv, type OpenInvoice } from "@/lib/administration/aging";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

async function fetchOpenInvoices(actorId: string, isFreelancer: boolean): Promise<OpenInvoice[]> {
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actorId } } }
    : { collaboration: { company: { userId: actorId } } };

  // unbounded-allow: API-route; eigenaar-scoped aggregatie
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { id: true, name: true } },
          freelancer: { select: { id: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  return invoices
    .filter((inv) => {
      const isCascade = inv.lifecycleStatus != null;
      if (isCascade) {
        return ["SUBMITTED", "APPROVED", "OVERDUE"].includes(inv.lifecycleStatus as string);
      }
      return ["SENT", "OVERDUE"].includes(inv.status as string);
    })
    .map((inv) => {
      const isCascade = inv.lifecycleStatus != null;
      const number = isCascade ? (inv.partyInvoiceNumber ?? inv.number) : inv.number;
      const counterpartyName = isFreelancer
        ? (inv.collaboration?.company.name ?? "—")
        : (inv.collaboration?.freelancer.user.name ?? "—");
      const counterpartyId = isFreelancer
        ? (inv.collaboration?.company.id ?? null)
        : (inv.collaboration?.freelancer.id ?? null);
      return {
        id: inv.id,
        number,
        counterpartyName,
        counterpartyId,
        jobTitle: inv.collaboration?.job.title ?? null,
        dueAt: inv.dueAt,
        amountCents: inv.totalCents,
        collaborationId: inv.collaborationId,
        isCascade,
      };
    });
}

export async function GET(): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const limited = await enforceRateLimit(exportRateLimiter, `administratie-open:${actor.id}`);
  if (limited) return limited;

  const isFreelancer = actor.role === "FREELANCER";
  const openInvoices =
    actor.role === "ADMIN" ? [] : await fetchOpenInvoices(actor.id, isFreelancer);

  const report = buildAgingReport(openInvoices, new Date());
  const csv = agingCsv(report);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "OPEN_ITEMS_EXPORTED",
      entityType: "Invoice",
      entityId: "self",
      metadata: { count: report.rows.length },
    }),
  });

  const filename = `openstaande-posten-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
