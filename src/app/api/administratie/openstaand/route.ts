// CSV-export van de openstaande posten (ouderdomsanalyse / aging).
// Exporteert alle openstaande facturen van de ingelogde gebruiker als CSV.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildAgingReport, agingCsv, type OpenInvoice } from "@/lib/administration/aging";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { buildPayoutForecastMap, effectivePayoutDate } from "@/lib/administration/payout-forecast";
import { type PayoutForecast } from "@/lib/invoice-payment-forecast";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

interface OpenInvoicesResult {
  open: OpenInvoice[];
  /** Verwachte-betaaldatum-forecast per factuur-id (alleen ZZP'er). Leeg voor de opdrachtgever. */
  forecasts: Map<string, PayoutForecast>;
}

async function fetchOpenInvoices(
  actorId: string,
  isFreelancer: boolean,
): Promise<OpenInvoicesResult> {
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actorId } } }
    : { collaboration: { company: { userId: actorId } } };

  // Voor de ZZP'er ook de eigen betaalde facturen laden: daaruit leiden we het betaalgedrag per
  // opdrachtgever af en projecteren we de realistische betaaldatum (privacy — enkel eigen historie).
  // Spiegelt de `/openstaand`-pagina (openstaand-panel.tsx), zodat de CSV niet uiteenloopt met het scherm.
  const [invoices, paidRows] = await Promise.all([
    // unbounded-allow: API-route; eigenaar-scoped aggregatie
    prisma.invoice.findMany({
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
    }),
    isFreelancer
      ? prisma.invoice.findMany({
          where: { collaboration: { freelancer: { userId: actorId } }, status: "PAID" },
          orderBy: { updatedAt: "desc" },
          take: 300,
          select: {
            issuedAt: true,
            dueAt: true,
            updatedAt: true,
            collaboration: { select: { company: { select: { id: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  // Canonieke openstaand-regel (één bron van waarheid, gedeeld met de 9 andere consumenten en
  // de /openstaand-pagina) — nooit de literal-arrays hier inline dupliceren: dat laat de CSV en
  // het dashboard-getal uiteenlopen zodra de regel in outstanding.ts verandert.
  const outstanding = invoices.filter(isInvoiceOutstanding);

  const open = outstanding.map((inv) => {
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

  const forecasts = isFreelancer
    ? buildPayoutForecastMap(
        outstanding.map((inv) => ({
          id: inv.id,
          companyId: inv.collaboration?.company.id ?? null,
          issuedAt: inv.issuedAt,
          dueAt: inv.dueAt,
        })),
        paidRows.map((row) => ({
          companyId: row.collaboration?.company.id ?? null,
          issuedAt: row.issuedAt,
          dueAt: row.dueAt,
          paidAt: row.updatedAt,
        })),
      )
    : new Map<string, PayoutForecast>();

  return { open, forecasts };
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
  const { open: openInvoices, forecasts } =
    actor.role === "ADMIN"
      ? { open: [], forecasts: new Map<string, PayoutForecast>() }
      : await fetchOpenInvoices(actor.id, isFreelancer);

  const report = buildAgingReport(openInvoices, new Date());
  // Alleen de ZZP'er (debiteurenlijst) krijgt de verwachte-betaaldatum-kolom: de effectieve
  // verwachte-binnendatum per post (betaalgedrag-forecast indien betrouwbaar, anders de vervaldatum),
  // exact zoals de `/openstaand`-pagina die toont. De opdrachtgever/ADMIN houdt de kale kolommen.
  const expectedPaymentDates = isFreelancer
    ? new Map(report.rows.map((r) => [r.id, effectivePayoutDate(r.id, r.dueAt, forecasts)]))
    : undefined;
  const csv = agingCsv(report, expectedPaymentDates);

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
