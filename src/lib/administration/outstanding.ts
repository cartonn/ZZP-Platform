import { type Prisma } from "@prisma/client";

// Welke statussen "openstaand" (verzonden/ontvangen, nog niet betaald) betekenen. Cascade-facturen
// (de werkproces-flow) houden hun live `status` op 'DRAFT' tot betaling en bewegen alleen via
// `lifecycleStatus`; alleen op `status` filteren mist daarom ELKE cascade-factuur. Dit is de
// canonieke regel, gespiegeld uit /api/administratie/openstaand.
export const OUTSTANDING_LIFECYCLE = ["SUBMITTED", "APPROVED", "OVERDUE"] as const;
export const OUTSTANDING_LEGACY_STATUS = ["SENT", "OVERDUE"] as const;

/**
 * Een factuur staat open als ze cascade is (`lifecycleStatus` gezet) met lifecycleStatus
 * SUBMITTED/APPROVED/OVERDUE, óf legacy (geen lifecycleStatus) met status SENT/OVERDUE.
 * Pure functie → unit-testbaar zonder database.
 */
export function isInvoiceOutstanding(inv: {
  lifecycleStatus: string | null;
  status: string;
}): boolean {
  if (inv.lifecycleStatus != null) {
    return (OUTSTANDING_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return (OUTSTANDING_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

/** Prisma-where-fragment dat dezelfde regel uitdrukt, voor server-side aggregatie/telling. */
export const outstandingInvoiceWhere: Prisma.InvoiceWhereInput = {
  OR: [
    { lifecycleStatus: { in: [...OUTSTANDING_LIFECYCLE] } },
    { lifecycleStatus: null, status: { in: [...OUTSTANDING_LEGACY_STATUS] } },
  ],
};
