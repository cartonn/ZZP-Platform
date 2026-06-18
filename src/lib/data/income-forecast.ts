import { prisma } from "@/lib/db";
import { type ForecastItem, type ForecastStage } from "@/lib/income-forecast";

/**
 * Laadt de open facturen van een ZZP'er en mapt ze naar ForecastItem's voor de
 * inkomstenprognose. Eén bron voor zowel het prognose-paneel als de CSV-export.
 *
 * Cap: een prognose over de eerstvolgende ~200 open facturen is ruim voldoende;
 * oudste vervaldag eerst zodat de dichtstbijzijnde verwachting nooit buiten de cap valt.
 */
export async function getForecastItemsForFreelancer(userId: string): Promise<ForecastItem[]> {
  const invoices = await prisma.invoice.findMany({
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
          company: { select: { name: true } },
        },
      },
    },
  });

  return invoices.map((inv) => ({
    invoiceId: inv.id,
    stage: inv.lifecycleStatus as ForecastStage,
    netCents: inv.subtotalCents ?? 0,
    vatCents: inv.vatCents ?? 0,
    grossCents: inv.totalCents,
    expectedDate: inv.dueAt,
    counterpartyName: inv.collaboration?.company.name ?? "—",
    number: inv.partyInvoiceNumber ?? null,
    jobTitle: inv.collaboration?.job.title ?? null,
  }));
}
