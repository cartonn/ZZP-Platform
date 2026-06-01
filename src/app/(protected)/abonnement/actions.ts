"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { planKeySchema } from "@/lib/enums";
import { getPaymentProvider } from "@/lib/billing/provider";

/**
 * Plan wijzigen via de betaal-seam. Gratis plannen worden direct geactiveerd. Voor betaalde
 * plannen start de provider een checkout: met de mock-provider (default) is dat instant
 * (geen externe stap); met een echte provider (Mollie) gaat de gebruiker naar de betaalpagina
 * en wordt het abonnement pas ACTIVE na de webhook-bevestiging. Geen geld uit het werkproces
 * via het platform (Besluit 1) — dit is de abonnementsfee.
 */
export async function changeSubscription(planKey: string): Promise<void> {
  const actor = await requireActor();
  const key = planKeySchema.parse(planKey);
  const plan = await prisma.plan.findUnique({
    where: { key },
    select: { id: true, name: true, priceCents: true },
  });
  if (!plan) throw new Error("Plan niet gevonden.");

  let redirectUrl: string | null = null;

  if (plan.priceCents === 0) {
    await activate(actor.id, plan.id, key);
  } else {
    const hdr = await headers();
    const origin = hdr.get("origin") ?? `https://${hdr.get("host") ?? "localhost:3000"}`;
    const checkout = await getPaymentProvider().startCheckout({
      userId: actor.id,
      planKey: key,
      amountCents: plan.priceCents,
      description: `ZZP Platform abonnement: ${plan.name}`,
      returnUrl: `${origin}/abonnement`,
      webhookUrl: `${origin}/api/billing/webhook`,
    });

    if (checkout.redirectUrl === null) {
      // Mock-provider: direct geactiveerd.
      await activate(actor.id, plan.id, key);
    } else {
      // Echte provider: PENDING tot de webhook 'paid' bevestigt.
      await prisma.subscription.upsert({
        where: { userId: actor.id },
        update: { planId: plan.id, status: "PENDING", providerRef: checkout.providerRef },
        create: {
          userId: actor.id,
          planId: plan.id,
          status: "PENDING",
          providerRef: checkout.providerRef,
        },
      });
      await audit(actor.id, "SUBSCRIPTION_CHECKOUT_STARTED", { plan: key });
      redirectUrl = checkout.redirectUrl;
    }
  }

  revalidatePath("/abonnement");
  if (redirectUrl) redirect(redirectUrl); // naar de externe betaalpagina
}

async function activate(userId: string, planId: string, key: string): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    update: { planId, status: "ACTIVE" },
    create: { userId, planId, status: "ACTIVE" },
  });
  await audit(userId, "SUBSCRIPTION_CHANGED", { plan: key });
}

async function audit(actorId: string, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: auditData({ actorId, action, entityType: "Subscription", entityId: actorId, metadata }),
  });
}
