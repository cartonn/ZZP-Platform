import "server-only";

import { prisma } from "@/lib/db";
import {
  type ApplicationQuota,
  applicationPeriodStart,
  applicationQuota,
} from "@/lib/application-quota";

/**
 * De where-clausule die precies telt wat een reactie-slot verbruikt: reacties van deze ZZP'er die in
 * de lopende kalendermaand (Europe/Amsterdam) zijn aangemaakt en niet zijn ingetrokken. Gedeeld met
 * de atomische her-telling binnen de create-transactie, zodat pre-check en grendel niet driften.
 */
export function applicationQuotaWhere(freelancerProfileId: string, now: Date) {
  return {
    freelancerId: freelancerProfileId,
    createdAt: { gte: applicationPeriodStart(now) },
    status: { not: "WITHDRAWN" },
  };
}

/**
 * Het geldende maandquotum van een ZZP'er: plan (actief abonnement, anders FREE) + verbruik van deze
 * maand. Server-side waarheid (CLAUDE.md regel 1) — zowel de gating in `applications-create.ts` als
 * de teller op /reacties leest hier, zodat de UI nooit iets anders toont dan wat wordt afgedwongen.
 */
export async function loadApplicationQuota(
  userId: string,
  freelancerProfileId: string,
  now: Date = new Date(),
): Promise<ApplicationQuota> {
  const [used, subscription, freePlan] = await Promise.all([
    prisma.application.count({ where: applicationQuotaWhere(freelancerProfileId, now) }),
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    prisma.plan.findUnique({ where: { key: "FREE" } }),
  ]);
  // Alleen een ACTIEF abonnement telt; anders geldt het FREE-plan. `Plan.maxApplications` is de
  // (historische) kolomnaam voor het maximum per kalendermaand — zie src/lib/application-quota.ts.
  const activePlanMax =
    subscription?.status === "ACTIVE" ? subscription.plan.maxApplications : undefined;
  const maxApplicationsPerMonth = activePlanMax ?? freePlan?.maxApplications ?? 5;
  return applicationQuota({ plan: { maxApplicationsPerMonth }, usedThisMonth: used, now });
}
