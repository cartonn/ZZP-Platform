import { prisma } from "@/lib/db";
import { summarizeUnbilledInvoices, type UnbilledInvoiceSummary } from "@/lib/unbilled-invoices";

/**
 * Haalt de concept-facturen van een ZZP'er op en vat ze samen tot de "Nog te factureren"-blik.
 *
 * De WHERE beperkt zich hard tot concept-kandidaten (cascade-DRAFT én losse legacy-DRAFT); die set
 * is inherent klein (je dient ze in), owner-gescoopt en sluit bevroren (disputed) samenwerkingen uit
 * — daar kun je toch niet factureren. Het definitieve lidmaatschap bepaalt de pure, cascade-bewuste
 * `summarizeUnbilledInvoices` (dezelfde bron als de /facturen-"Concept"-pill).
 */
export async function getUnbilledInvoiceSummary(
  userId: string,
  now: number = Date.now(),
): Promise<UnbilledInvoiceSummary | null> {
  // unbounded-allow: concept-facturen zijn inherent begrensd (worden ingediend), owner-scoped.
  const rows = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId }, disputedAt: null },
      OR: [{ lifecycleStatus: "DRAFT" }, { lifecycleStatus: null, status: "DRAFT" }],
    },
    select: { lifecycleStatus: true, status: true, totalCents: true, createdAt: true },
  });

  return summarizeUnbilledInvoices(rows, now);
}
