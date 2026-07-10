import { prisma } from "@/lib/db";
import { type ForecastItem, type ForecastStage } from "@/lib/income-forecast";
import { computePaymentBehavior, type PaymentBehavior } from "@/lib/payment-behavior";
import { forecastInvoicePayout } from "@/lib/invoice-payment-forecast";

/** UTC-middernacht van vandaag — anker voor "valt de vervaldag nog in de toekomst?". */
function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Laadt de open facturen van een ZZP'er en mapt ze naar ForecastItem's voor de
 * inkomstenprognose. Eén bron voor zowel het prognose-paneel als de CSV-export.
 *
 * Cap: een prognose over de eerstvolgende ~200 open facturen is ruim voldoende;
 * oudste vervaldag eerst zodat de dichtstbijzijnde verwachting nooit buiten de cap valt.
 *
 * Realistische betaaldatum: voor een nog niet-verlopen, goedgekeurde factuur (APPROVED) waarvan we
 * genoeg betaalhistorie van déze opdrachtgever hebben, projecteren we via `forecastInvoicePayout` de
 * verwachte betaaldatum op grond van het gemiddelde betaalgedrag. Dat anker (`realisticDate`) bepaalt
 * dan de maand-bucket in de tijdlijn, zodat geld van structureel-trage opdrachtgevers niet te vroeg
 * in "Deze maand" valt. Het betaalgedrag komt uit de eigen betaalde facturen (privacy — nooit data
 * van andere ZZP'ers).
 */
export async function getForecastItemsForFreelancer(
  userId: string,
  now: Date = new Date(),
): Promise<ForecastItem[]> {
  const [invoices, paidRows] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        collaboration: { freelancer: { userId } },
        lifecycleStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "OVERDUE"] },
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 200,
      include: {
        collaboration: {
          select: {
            job: { select: { title: true } },
            company: { select: { id: true, name: true } },
          },
        },
      },
    }),
    // Betaalde facturen van deze ZZP'er per opdrachtgever, om het betaalgedrag af te leiden.
    // paidAt = Invoice.updatedAt bij status PAID (zie payment-behavior.ts). Begrensd; het gemiddelde
    // is met de meest recente betalingen ruim representatief.
    prisma.invoice.findMany({
      where: {
        collaboration: { freelancer: { userId } },
        status: "PAID",
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
      select: {
        issuedAt: true,
        dueAt: true,
        updatedAt: true,
        collaboration: { select: { company: { select: { id: true } } } },
      },
    }),
  ]);

  // Betaalgedrag per opdrachtgever (Company) uit de betaalde facturen.
  const rowsByCompany = new Map<
    string,
    { issuedAt: Date | null; dueAt: Date | null; paidAt: Date }[]
  >();
  for (const row of paidRows) {
    const companyId = row.collaboration?.company.id;
    if (!companyId) continue;
    const rows = rowsByCompany.get(companyId) ?? [];
    rows.push({ issuedAt: row.issuedAt, dueAt: row.dueAt, paidAt: row.updatedAt });
    rowsByCompany.set(companyId, rows);
  }
  const behaviorByCompany = new Map<string, PaymentBehavior>();
  for (const [companyId, rows] of rowsByCompany) {
    behaviorByCompany.set(companyId, computePaymentBehavior(rows));
  }

  const startOfToday = startOfDayUTC(now);

  return invoices.map((inv) => {
    const companyId = inv.collaboration?.company.id;
    const behavior = companyId ? behaviorByCompany.get(companyId) : undefined;

    // Realistische betaaldatum alleen voor een goedgekeurde, nog niet-verlopen factuur: dat is het
    // geld dat nog "onderweg" is en dus zinvol te plannen valt. Een verlopen factuur staat al in
    // "Te laat"; concepten/ingediende facturen hebben geen vervaldag om op te projecteren.
    let realisticDate: Date | null = null;
    if (
      inv.lifecycleStatus === "APPROVED" &&
      inv.dueAt != null &&
      inv.dueAt >= startOfToday &&
      behavior
    ) {
      const forecast = forecastInvoicePayout({
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
        avgDaysToPay: behavior.avgDaysToPay,
        sampleSize: behavior.sampleSize,
      });
      if (forecast?.confident) {
        realisticDate = forecast.expectedAt;
      }
    }

    return {
      invoiceId: inv.id,
      stage: inv.lifecycleStatus as ForecastStage,
      netCents: inv.subtotalCents ?? 0,
      vatCents: inv.vatCents ?? 0,
      grossCents: inv.totalCents,
      expectedDate: inv.dueAt,
      realisticDate,
      counterpartyName: inv.collaboration?.company.name ?? "—",
      number: inv.partyInvoiceNumber ?? null,
      jobTitle: inv.collaboration?.job.title ?? null,
    };
  });
}
