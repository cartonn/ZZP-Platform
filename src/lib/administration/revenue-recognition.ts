import { type Prisma } from "@prisma/client";

// Welke facturen NIET als (gefactureerde) omzet meetellen: teruggedraaide/geannuleerde facturen.
// De cascade-lifecycle (de werkproces-flow) kent GEEN 'CANCELLED'-status — haar reversal-eindtoestand
// is 'CREDITED' (de legacy→cascade-migratie mapt `CANCELLED → CREDITED`, zie
// scripts/migrate-legacy-invoices.mjs). Een gecrediteerde cascade-factuur houdt haar legacy `status`
// bewust op 'DRAFT' de hele lifecycle door, dus alléén op `status: { not: "CANCELLED" }` filteren telt
// die teruggedraaide factuur tóch als omzet mee. Dit is de canonieke reporting-regel, gespiegeld op de
// vorm van `outstandingInvoiceWhere` (./outstanding) en `isInvoiceSettled` (../cascade/completion).
export const EXCLUDED_REVENUE_LIFECYCLE = ["CREDITED"] as const;
export const EXCLUDED_REVENUE_LEGACY_STATUS = ["CANCELLED"] as const;

/**
 * Telt een factuur mee als gefactureerde omzet? Cascade-facturen (`lifecycleStatus` gezet) tellen mee
 * tenzij CREDITED; legacy-facturen (geen `lifecycleStatus`) tellen mee tenzij CANCELLED. Pure functie
 * → unit-testbaar zonder database.
 */
export function isInvoiceRevenueCounted(inv: {
  lifecycleStatus: string | null;
  status: string;
}): boolean {
  if (inv.lifecycleStatus != null) {
    return !(EXCLUDED_REVENUE_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return !(EXCLUDED_REVENUE_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

/**
 * Prisma-where-fragment dat dezelfde regel uitdrukt, voor server-side aggregatie/telling. Spiegelt
 * `outstandingInvoiceWhere`: een cascade-factuur matcht via `lifecycleStatus` (notIn sluit NULL-rijen
 * uit → legacy valt in de tweede tak), een legacy-factuur via `lifecycleStatus: null` + `status`.
 */
export const revenueCountedInvoiceWhere: Prisma.InvoiceWhereInput = {
  OR: [
    { lifecycleStatus: { notIn: [...EXCLUDED_REVENUE_LIFECYCLE] } },
    { lifecycleStatus: null, status: { notIn: [...EXCLUDED_REVENUE_LEGACY_STATUS] } },
  ],
};
