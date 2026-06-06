// Server-side entitlement-bepaling: koppelt een user aan zijn actieve plan en feature-toegang.
// Server-side waarheid (CLAUDE.md regel 1): alleen een ACTIVE-abonnement telt; PENDING/PAST_DUE/
// CANCELLED of geen abonnement = FREE. Consolideert het eerder verspreide
// `sub?.status === "ACTIVE" ? sub.plan.key : "FREE"`-patroon op één plek.

import { prisma } from "@/lib/db";
import { hasEntitlement, type Entitlement } from "@/lib/entitlements";
import { type PlanKey } from "@/lib/enums";

/** Het actieve plan van een user (FREE als er geen actief abonnement is). */
export async function getActivePlanKey(userId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, plan: { select: { key: true } } },
  });
  return sub?.status === "ACTIVE" ? (sub.plan.key as PlanKey) : "FREE";
}

/** Heeft deze user (via zijn actieve plan) deze feature? */
export async function userHasEntitlement(
  userId: string,
  entitlement: Entitlement,
): Promise<boolean> {
  return hasEntitlement(await getActivePlanKey(userId), entitlement);
}

/**
 * Subset van de gegeven users die deze feature heeft — één query voor batch-taken (reminders).
 * Users zonder ACTIVE-abonnement vallen automatisch buiten de set (FREE heeft geen entitlements).
 */
export async function usersWithEntitlement(
  userIds: readonly string[],
  entitlement: Entitlement,
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const subs = await prisma.subscription.findMany({
    where: { userId: { in: [...userIds] }, status: "ACTIVE" },
    select: { userId: true, plan: { select: { key: true } } },
  });
  const set = new Set<string>();
  for (const s of subs) {
    if (hasEntitlement(s.plan.key as PlanKey, entitlement)) set.add(s.userId);
  }
  return set;
}
