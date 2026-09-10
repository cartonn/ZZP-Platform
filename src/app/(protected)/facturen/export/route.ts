// CSV-export van het eigen factuurregister (verkoopboek voor de ZZP'er, inkoopboek voor de
// opdrachtgever): één rij per factuur, voor de boekhouder. Rol-bewust en alleen de eigen facturen —
// exact dezelfde `where` als het facturen-paneel (@/components/administratie/facturen-panel), zodat
// de export de lijst op het scherm spiegelt. Geen gegevens van derden. Auditregel bij export.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { invoiceRegisterCsv, type InvoiceRegisterRow } from "@/lib/invoice-register-csv";
import { displayInvoiceNumber } from "@/lib/invoice-number";
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

  // Alleen ZZP'er/opdrachtgever hebben een eigen factuurregister. ADMIN gebruikt het platform-brede
  // overzicht (/admin/facturatie) met zijn eigen export.
  if (actor.role !== "FREELANCER" && actor.role !== "CLIENT") {
    return new Response("Niet beschikbaar voor deze rol.", { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `facturen:${actor.id}`);
  if (limited) return limited;

  const isFreelancer = actor.role === "FREELANCER";
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actor.id } } }
    : { collaboration: { company: { userId: actor.id } } };

  // unbounded-allow: export-route; volledigheid vereist
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      number: true,
      partyInvoiceNumber: true,
      status: true,
      lifecycleStatus: true,
      issuedAt: true,
      dueAt: true,
      updatedAt: true,
      totalCents: true,
      subtotalCents: true,
      vatCents: true,
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { name: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const rows: InvoiceRegisterRow[] = invoices.map((inv) => ({
    number: displayInvoiceNumber(inv),
    issuedAt: inv.issuedAt,
    dueAt: inv.dueAt,
    counterpartyName: isFreelancer
      ? (inv.collaboration?.company.name ?? null)
      : (inv.collaboration?.freelancer.user.name ?? null),
    description: inv.collaboration?.job.title ?? null,
    totalCents: inv.totalCents,
    subtotalCents: inv.subtotalCents,
    vatCents: inv.vatCents,
    status: inv.status,
    lifecycleStatus: inv.lifecycleStatus,
    // paidAt = Invoice.updatedAt bij status PAID (zelfde afspraak als payment-behavior.ts).
    paidAt: inv.status === "PAID" ? inv.updatedAt : null,
  }));

  const csv = invoiceRegisterCsv(rows);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "INVOICE_REGISTER_EXPORTED",
      entityType: "Invoice",
      entityId: "self",
      metadata: { count: rows.length, role: actor.role },
    }),
  });

  const filename = `factuurregister-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
