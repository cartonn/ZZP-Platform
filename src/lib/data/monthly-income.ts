import { prisma } from "@/lib/db";
import { realizedRevenueInvoiceWhere } from "@/lib/administration/realized-revenue";

/**
 * Data-laag voor het maanddoel van de ZZP'er. Levert het reeds gefactureerde bedrag van de lopende
 * kalendermaand (Europe/Amsterdam). Omzet volgt de factuurdatum (`issuedAt`), consistent met de rest
 * van de administratie (zie `src/lib/revenue.ts`) — niet de betaaldatum.
 */

const MONTH_KEY_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
});

/** "YYYY-MM" in Europe/Amsterdam — stabiel vergelijkbaar. */
function amsterdamMonthKey(d: Date): string {
  return MONTH_KEY_FORMAT.format(d);
}

/**
 * Som (in centen) van de facturen die de ZZP'er in de lopende maand heeft uitgestuurd.
 *
 * Robuust tegen de tijdzonegrens: we halen een ruime venster-ondergrens op (begin vorige maand, UTC)
 * en filteren daarna exact op de Amsterdam-maandsleutel in JS — zo valt geen enkele factuur op de
 * zomertijd-/maandrand verkeerd. Begrensd met `take` (een ZZP'er stuurt geen honderden facturen/maand).
 */
export async function getRealizedRevenueThisMonthCents(userId: string, now: Date): Promise<number> {
  // Ondergrens: de eerste van de vorige maand (UTC) — ruim vóór elke maandgrens in Amsterdam.
  const lowerBound = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentKey = amsterdamMonthKey(now);

  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId } },
      // Gerealiseerde (verstuurde) omzet dekt zowel cascade-facturen (op `lifecycleStatus`) als
      // handmatig aangemaakte legacy-facturen (`lifecycleStatus` NULL, op de live `status`). Alleen
      // op `lifecycleStatus` filteren miste élke legacy-factuur → een handmatig verstuurde factuur
      // telde niet mee in de maanddoel-voortgang. `realizedRevenueInvoiceWhere` dekt beide paden.
      ...realizedRevenueInvoiceWhere,
      issuedAt: { gte: lowerBound, lte: now },
    },
    orderBy: { issuedAt: "desc" },
    take: 300,
    select: { issuedAt: true, totalCents: true },
  });

  let total = 0;
  for (const inv of invoices) {
    if (inv.issuedAt && amsterdamMonthKey(inv.issuedAt) === currentKey) {
      total += inv.totalCents;
    }
  }
  return total;
}
