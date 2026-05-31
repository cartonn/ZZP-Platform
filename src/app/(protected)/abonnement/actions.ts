"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { planKeySchema } from "@/lib/enums";

/**
 * (Mock) plan wijzigen. Géén echte betaling — dat is infra/mensenwerk; hier zetten we het
 * abonnement op ACTIVE met het gekozen plan. De feature-gating (reactielimiet) leest dit.
 */
export async function changeSubscription(planKey: string): Promise<void> {
  const actor = await requireActor();
  const key = planKeySchema.parse(planKey);
  const plan = await prisma.plan.findUnique({ where: { key }, select: { id: true } });
  if (!plan) throw new Error("Plan niet gevonden.");

  await prisma.subscription.upsert({
    where: { userId: actor.id },
    update: { planId: plan.id, status: "ACTIVE" },
    create: { userId: actor.id, planId: plan.id, status: "ACTIVE" },
  });
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "SUBSCRIPTION_CHANGED",
      entityType: "Subscription",
      entityId: actor.id,
      metadata: { plan: key },
    }),
  });
  revalidatePath("/abonnement");
}
