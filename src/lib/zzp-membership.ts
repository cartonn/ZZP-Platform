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

/** Minimale prestatie-vorm die nodig is om de actieve ZZP'ers voor een maand te bepalen. */
export interface MembershipPerformance {
  periodStart: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  collaboration: { freelancer: { userId: string } | null } | null;
}

/**
 * De set unieke ZZP'er-`userId`'s die in `period` werk hadden: alle gegeven (goedgekeurde) prestaties
 * wier `performanceMonthKey` exact op die maand valt. Pure filter — dezelfde bron van waarheid als de
 * taak (`zzp-membership-task`) én de stille-faal-gauge (`/api/metrics`), zodat die twee niet kunnen
 * driften. De aanroeper levert de prestaties (de DB-query met `membershipPerformanceWhere` zit in de taak).
 */
export function activeMembershipUserIds(
  performances: readonly MembershipPerformance[],
  period: string,
): Set<string> {
  const ids = new Set<string>();
  for (const p of performances) {
    if (performanceMonthKey(p) !== period) continue; // alleen werk dat écht in deze maand telt
    const uid = p.collaboration?.freelancer?.userId;
    if (uid) ids.add(uid);
  }
  return ids;
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
