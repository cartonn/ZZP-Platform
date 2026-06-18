// Data-laag voor de betaalverplichtingen van een opdrachtgever (CLIENT). Haalt de openstaande
// cascade-facturen op die op de opdrachtgever zijn gericht en mapt ze naar de pure `ObligationItem`
// shape die door `buildPaymentObligations`/`exportObligationsCsv` wordt verwerkt. Eén bron van
// waarheid zodat zowel het paneel als de CSV-export exact dezelfde set verplichtingen tonen.

import { prisma } from "@/lib/db";
import { type ObligationItem, type ObligationStage } from "@/lib/payment-obligations";

/**
 * Laadt de openstaande betaalverplichtingen voor een opdrachtgever (CLIENT) als `ObligationItem[]`.
 *
 * Scope direct op de tegenpartij (`counterpartyUserId` = de opdrachtgever op de cascade-factuur),
 * dezelfde gezaghebbende sleutel als signals/pending-tasks, met de dedicated index
 * [counterpartyUserId, lifecycleStatus] i.p.v. een join door collaboration → company → user.
 */
export async function getObligationItemsForClient(userId: string): Promise<ObligationItem[]> {
  const include = {
    collaboration: {
      select: {
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true } } } },
      },
    },
  } as const;

  // Cap: een prognose over de eerstvolgende ~200 openstaande facturen is ruim voldoende;
  // dichtstbijzijnde vervaldag eerst zodat de meest urgente verplichting nooit buiten de cap valt.
  // DRAFT valt weg: een concept is nog niet naar de opdrachtgever verstuurd en dus geen verplichting.
  const [scheduled, overdueNoDue] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        counterpartyUserId: userId,
        lifecycleStatus: { in: ["SUBMITTED", "APPROVED", "OVERDUE"] },
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 200,
      include,
    }),
    // Vangnet: een OVERDUE-factuur zónder vervaldag sorteert door `nulls: "last"` achteraan en kan
    // bij veel openstaande facturen buiten de cap vallen — terwijl een te-late verplichting juist
    // het meest urgent is. Haal die gericht (en begrensd) op zodat ze nooit onzichtbaar wordt.
    prisma.invoice.findMany({
      where: { counterpartyUserId: userId, lifecycleStatus: "OVERDUE", dueAt: null },
      orderBy: { id: "asc" },
      take: 200,
      include,
    }),
  ]);

  // Samenvoegen + dedupliceren op factuur-id (de OVERDUE-vangnet-query kan overlappen met de hoofdset).
  const invoices = [
    ...new Map([...scheduled, ...overdueNoDue].map((inv) => [inv.id, inv])).values(),
  ];

  return invoices.map((inv) => ({
    invoiceId: inv.id,
    stage: inv.lifecycleStatus as ObligationStage,
    netCents: inv.subtotalCents ?? 0,
    vatCents: inv.vatCents ?? 0,
    grossCents: inv.totalCents,
    dueDate: inv.dueAt,
    counterpartyName: inv.collaboration?.freelancer.user.name ?? "—",
    number: inv.partyInvoiceNumber ?? null,
    jobTitle: inv.collaboration?.job.title ?? null,
  }));
}
