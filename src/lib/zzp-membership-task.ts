// Geplande runner voor het ZZP-platformabonnement: registreert per maand een bijdrage voor elke
// ZZP'er die in die maand werk had (≥1 goedgekeurde prestatie). Idempotent via de unieke index
// (userId, period): meermaals draaien voegt niets dubbel toe en wijzigt bestaande bijdragen niet.
// Geen geldstroom/incasso — alleen registratie als PENDING (betaalprovider = mensenwerk).

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ZZP_MEMBERSHIP } from "@/lib/config";
import {
  activeMembershipUserIds,
  monthKey,
  monthRange,
  planMembershipCharges,
} from "@/lib/zzp-membership";

export interface ZzpMembershipResult {
  period: string;
  /** Aantal ZZP'ers met een bijdrage voor deze maand (incl. al bestaande). */
  billed: number;
}

/**
 * Goedgekeurde prestaties die de maand `[start, end)` kunnen raken (periode, goedkeuring of aanmaak).
 * De uiteindelijke maand-toewijzing gebeurt in `activeMembershipUserIds` (periode-begin leidend); deze
 * where is bewust ruimer zodat geen kandidaat wordt gemist. Gedeeld door de taak én de stille-faal-gauge
 * (`/api/metrics`), zodat die twee dezelfde bron van waarheid gebruiken en niet kunnen driften.
 */
export function membershipPerformanceWhere(start: Date, end: Date): Prisma.PerformanceWhereInput {
  return {
    status: "APPROVED",
    OR: [
      { periodStart: { gte: start, lt: end } },
      { approvedAt: { gte: start, lt: end } },
      { createdAt: { gte: start, lt: end } },
    ],
  };
}

/** De minimale kolom-selectie voor de maand-toewijzing (gedeeld door de taak én de gauge). */
export const membershipPerformanceSelect = {
  periodStart: true,
  approvedAt: true,
  createdAt: true,
  collaboration: { select: { freelancer: { select: { userId: true } } } },
} satisfies Prisma.PerformanceSelect;

export async function runZzpMembershipTask(opts?: {
  now?: Date;
  /** Expliciete maand om te factureren (default: de maand van `now`). */
  month?: Date;
}): Promise<ZzpMembershipResult> {
  const target = opts?.month ?? opts?.now ?? new Date();
  const period = monthKey(target);
  if (!ZZP_MEMBERSHIP.enabled) return { period, billed: 0 };

  const { start, end } = monthRange(target);

  const performances = await prisma.performance.findMany({
    where: membershipPerformanceWhere(start, end),
    select: membershipPerformanceSelect,
  });

  const activeUserIds = activeMembershipUserIds(performances, period);

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
