import { type Prisma } from "@prisma/client";

// Welke facturen "betaalde omzet" (geld dat daadwerkelijk binnen/voldaan is) vormen. Cascade-facturen
// (de werkproces-flow) houden hun live `status` op 'DRAFT' tot betaling en bewegen alleen via
// `lifecycleStatus` (PAID → PROCESSED); legacy-facturen (handmatig via /facturen, `lifecycleStatus`
// NULL) bewegen alleen via de live `status`. Alléén op de legacy `status: "PAID"` filteren mist dus
// ELKE cascade-PAID/PROCESSED-factuur — precies de dual-path-regel van `outstandingInvoiceWhere`
// (./outstanding). Dit is de canonieke "betaald"-regel.
//
// "Betaald" is enger dan "afgewikkeld" (`isInvoiceSettled`, cascade/completion): een teruggedraaide
// factuur telt hier NIET als omzet.
//   cascade  → PAID + PROCESSED tellen mee; CREDITED (gecrediteerd/teruggedraaid) NIET;
//   legacy   → PAID telt mee; CANCELLED (geannuleerd) NIET.
export const PAID_REVENUE_LIFECYCLE = ["PAID", "PROCESSED"] as const;
export const PAID_REVENUE_LEGACY_STATUS = ["PAID"] as const;

/**
 * Telt een factuur mee als betaalde omzet (geld binnen)? Cascade-facturen (`lifecycleStatus` gezet)
 * op de cascade-lifecycle, legacy-facturen (geen `lifecycleStatus`) op de live `status`.
 * Pure functie → unit-testbaar zonder database.
 */
export function isInvoicePaidRevenue(inv: {
  lifecycleStatus: string | null;
  status: string;
}): boolean {
  if (inv.lifecycleStatus != null) {
    return (PAID_REVENUE_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return (PAID_REVENUE_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

/**
 * Prisma-where-fragment dat dezelfde regel uitdrukt, voor server-side aggregatie/telling. Spiegelt
 * `outstandingInvoiceWhere`: een cascade-factuur matcht via `lifecycleStatus` (de eerste tak sluit
 * NULL-rijen uit → legacy valt in de tweede tak), een legacy-factuur via `lifecycleStatus: null` +
 * `status`.
 */
export const paidRevenueInvoiceWhere: Prisma.InvoiceWhereInput = {
  OR: [
    { lifecycleStatus: { in: [...PAID_REVENUE_LIFECYCLE] } },
    { lifecycleStatus: null, status: { in: [...PAID_REVENUE_LEGACY_STATUS] } },
  ],
};
