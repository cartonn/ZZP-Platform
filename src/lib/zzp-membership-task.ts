// Geplande runner voor het ZZP-platformabonnement: registreert per maand een bijdrage voor elke
// ZZP'er die in die maand werk had (≥1 goedgekeurde prestatie). Idempotent via de unieke index
// (userId, period): meermaals draaien voegt niets dubbel toe en wijzigt bestaande bijdragen niet.
// Geen geldstroom/incasso — alleen registratie als PENDING (betaalprovider = mensenwerk).

import { prisma } from "@/lib/db";
import { ZZP_MEMBERSHIP } from "@/lib/config";
import {
  monthKey,
  monthRange,
  performanceMonthKey,
  planMembershipCharges,
} from "@/lib/zzp-membership";

export interface ZzpMembershipResult {
  period: string;
  /** Aantal ZZP'ers met een bijdrage voor deze maand (incl. al bestaande). */
  billed: number;
}

export async function runZzpMembershipTask(opts?: {
  now?: Date;
  /** Expliciete maand om te factureren (default: de maand van `now`). */
  month?: Date;
}): Promise<ZzpMembershipResult> {
  const target = opts?.month ?? opts?.now ?? new Date();
  const period = monthKey(target);
  if (!ZZP_MEMBERSHIP.enabled) return { period, billed: 0 };

  const { start, end } = monthRange(target);

  // Goedgekeurde prestaties die deze maand kunnen raken (periode, goedkeuring of aanmaak).
  const performances = await prisma.performance.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { periodStart: { gte: start, lt: end } },
        { approvedAt: { gte: start, lt: end } },
        { createdAt: { gte: start, lt: end } },
      ],
    },
    select: {
      periodStart: true,
      approvedAt: true,
      createdAt: true,
      collaboration: { select: { freelancer: { select: { userId: true } } } },
    },
  });

  const activeUserIds = new Set<string>();
  for (const p of performances) {
    if (performanceMonthKey(p) !== period) continue; // alleen werk dat écht in deze maand telt
    const uid = p.collaboration?.freelancer?.userId;
    if (uid) activeUserIds.add(uid);
  }

  const charges = planMembershipCharges([...activeUserIds], period);
  for (const c of charges) {
    await prisma.zzpMembershipCharge.upsert({
      where: { userId_period: { userId: c.userId, period: c.period } },
      create: {
        userId: c.userId,
        period: c.period,
        priceCents: c.priceCents,
        vatCents: c.vatCents,
        status: "PENDING",
      },
      update: {}, // idempotent: een bestaande bijdrage niet herberekenen of overschrijven
    });
  }

  return { period, billed: charges.length };
}
