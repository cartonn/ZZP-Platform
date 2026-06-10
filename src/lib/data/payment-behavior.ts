import "server-only";
import { prisma } from "@/lib/db";
import {
  computePaymentBehavior,
  type PaymentBehavior,
  type PaymentRow,
} from "@/lib/payment-behavior";

// Maximumaantal betaalde facturen dat we ophalen per opdrachtgever. Beperkt de query-omvang
// en is ruim genoeg voor een representatief signaal.
const MAX_PAID_INVOICES = 25;

/**
 * Laadt de betaalgeschiedenis van een opdrachtgever (Company) en berekent het betaalgedrag-
 * signaal. Geeft alleen geaggregeerde statistieken terug — geen individuele factuurdata
 * van anderen is zichtbaar voor de aanroeper (privacy by design).
 *
 * Bronkeuze `paidAt`: `Invoice.updatedAt` bij status = "PAID". Zie `payment-behavior.ts` voor
 * de volledige onderbouwing.
 */
export async function getPaymentBehaviorForCompany(companyId: string): Promise<PaymentBehavior> {
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { companyId },
      status: "PAID",
    },
    select: {
      issuedAt: true,
      dueAt: true,
      updatedAt: true, // proxy voor paidAt — zie bronkeuze in payment-behavior.ts
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_PAID_INVOICES,
  });

  const rows: PaymentRow[] = invoices.map((inv) => ({
    issuedAt: inv.issuedAt,
    dueAt: inv.dueAt,
    paidAt: inv.updatedAt, // updatedAt springt mee bij status-update naar PAID
  }));

  return computePaymentBehavior(rows);
}
