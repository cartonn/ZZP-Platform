// Leesbaar overzicht van het ZZP-platformabonnement voor de ingelogde ZZP'er: de maandbijdrage, of
// die deze maand geldt, en het openstaande (nog niet gefactureerde) totaal. Read-only; geld in centen.

import { prisma } from "@/lib/db";
import { ZZP_MEMBERSHIP } from "@/lib/config";
import { monthKey, calculateMembershipCharge } from "@/lib/zzp-membership";

export interface FreelancerMembership {
  /** Of het abonnement actief is (config aan + bedrag > 0). */
  enabled: boolean;
  monthlyPriceCents: number; // excl. btw
  monthlyTotalCents: number; // incl. btw
  /** Of er voor de huidige maand al een bijdrage is geregistreerd (de ZZP'er had werk). */
  billedThisMonth: boolean;
  /** Openstaand (PENDING) totaal incl. btw over alle maanden. */
  openCents: number;
  openMonths: number;
}

export async function getFreelancerMembership(
  userId: string,
  now: Date = new Date(),
): Promise<FreelancerMembership> {
  const charge = calculateMembershipCharge();
  if (!charge.applicable) {
    return {
      enabled: false,
      monthlyPriceCents: 0,
      monthlyTotalCents: 0,
      billedThisMonth: false,
      openCents: 0,
      openMonths: 0,
    };
  }

  const period = monthKey(now);
  const [thisMonth, pending] = await Promise.all([
    prisma.zzpMembershipCharge.findUnique({
      where: { userId_period: { userId, period } },
      select: { id: true },
    }),
    prisma.zzpMembershipCharge.findMany({
      where: { userId, status: "PENDING" },
      select: { priceCents: true, vatCents: true },
    }),
  ]);

  return {
    enabled: true,
    monthlyPriceCents: ZZP_MEMBERSHIP.monthlyPriceCents,
    monthlyTotalCents: charge.totalCents,
    billedThisMonth: thisMonth != null,
    openCents: pending.reduce((s, c) => s + c.priceCents + c.vatCents, 0),
    openMonths: pending.length,
  };
}
