// ZZP-platformabonnement (PIDZ-model): een maandbijdrage per ZZP'er, alleen in maanden met werk.
// Pure berekening + planning (geen I/O); de geplande taak (zzp-membership-task) doet de DB-toegang.
// Geld in integer-centen; bijdrage excl. btw, 21% komt erbovenop. Spiegelt de fee-logica.

import { ZZP_MEMBERSHIP, type ZzpMembershipConfig } from "@/lib/config";
import { computeVat } from "@/lib/administration/vat";

export interface MembershipChargeResult {
  /** False als het abonnement uit staat of het bedrag 0 is. */
  applicable: boolean;
  subtotalCents: number; // bijdrage excl. btw
  vatCents: number;
  totalCents: number; //    bijdrage incl. btw
}

/** "YYYY-MM" (UTC) van een datum. */
export function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** UTC [start, end) van de maand waarin `date` valt. */
export function monthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

/** De maand waarover een prestatie telt: periode-begin, anders goedkeuring, anders aanmaak. */
export function performanceMonthKey(p: {
  periodStart: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
}): string {
  return monthKey(p.periodStart ?? p.approvedAt ?? p.createdAt);
}

/** Berekent de maandbijdrage (incl. btw) voor het gegeven abonnement, of niet-van-toepassing. */
export function calculateMembershipCharge(
  config: ZzpMembershipConfig = ZZP_MEMBERSHIP,
): MembershipChargeResult {
  if (!config.enabled || config.monthlyPriceCents <= 0) {
    return { applicable: false, subtotalCents: 0, vatCents: 0, totalCents: 0 };
  }
  const vat = computeVat(config.monthlyPriceCents, config.vatRegime);
  return {
    applicable: true,
    subtotalCents: vat.subtotalCents,
    vatCents: vat.vatCents,
    totalCents: vat.totalCents,
  };
}

export interface PlannedMembershipCharge {
  userId: string;
  period: string;
  priceCents: number;
  vatCents: number;
}

/**
 * De te registreren bijdragen voor de actieve ZZP'ers in een maand. Leeg als het abonnement niet van
 * toepassing is. Dedupliceert de gebruikers-id's (één bijdrage per gebruiker per maand).
 */
export function planMembershipCharges(
  activeUserIds: readonly string[],
  period: string,
  config: ZzpMembershipConfig = ZZP_MEMBERSHIP,
): PlannedMembershipCharge[] {
  const charge = calculateMembershipCharge(config);
  if (!charge.applicable) return [];
  return [...new Set(activeUserIds)].map((userId) => ({
    userId,
    period,
    priceCents: charge.subtotalCents,
    vatCents: charge.vatCents,
  }));
}
