import { type Prisma } from "@prisma/client";

// Welke facturen "gerealiseerde omzet" vormen: daadwerkelijk verstuurd/ingediend (geen concept meer)
// en niet teruggedraaid. Cascade-facturen (de werkproces-flow) houden hun live `status` op 'DRAFT'
// tot betaling en bewegen alleen via `lifecycleStatus`; legacy-facturen (handmatig aangemaakt via
// /facturen, `lifecycleStatus` NULL) bewegen alleen via de live `status`. Alléén op één van beide
// filteren mist daarom de andere flow — precies de dual-path-regel van `outstandingInvoiceWhere`
// (./outstanding) en `revenueCountedInvoiceWhere` (./revenue-recognition).
//
// "Gerealiseerd" sluit expliciet de concept-/afgekeurd-/teruggedraaid-toestanden uit:
//   cascade  → DRAFT (concept) en REJECTED (afgekeurd) en CREDITED (teruggedraaid) tellen NIET mee;
//   legacy   → DRAFT (concept) en CANCELLED (geannuleerd) tellen NIET mee.
export const REALIZED_REVENUE_LIFECYCLE = [
  "SUBMITTED",
  "APPROVED",
  "OVERDUE",
  "PAID",
  "PROCESSED",
] as const;
export const REALIZED_REVENUE_LEGACY_STATUS = ["SENT", "OVERDUE", "PAID"] as const;

/**
 * Telt een factuur mee als gerealiseerde (verstuurde) omzet? Cascade-facturen (`lifecycleStatus`
 * gezet) op de cascade-lifecycle, legacy-facturen (geen `lifecycleStatus`) op de live `status`.
 * Pure functie → unit-testbaar zonder database.
 */
export function isInvoiceRealizedRevenue(inv: {
  lifecycleStatus: string | null;
  status: string;
}): boolean {
  if (inv.lifecycleStatus != null) {
    return (REALIZED_REVENUE_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return (REALIZED_REVENUE_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

/**
 * Prisma-where-fragment dat dezelfde regel uitdrukt, voor server-side aggregatie/telling. Spiegelt
 * `outstandingInvoiceWhere`: een cascade-factuur matcht via `lifecycleStatus` (de eerste tak sluit
 * NULL-rijen uit → legacy valt in de tweede tak), een legacy-factuur via `lifecycleStatus: null` +
 * `status`.
 */
export const realizedRevenueInvoiceWhere: Prisma.InvoiceWhereInput = {
  OR: [
    { lifecycleStatus: { in: [...REALIZED_REVENUE_LIFECYCLE] } },
    { lifecycleStatus: null, status: { in: [...REALIZED_REVENUE_LEGACY_STATUS] } },
  ],
};
