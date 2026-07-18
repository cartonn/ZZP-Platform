"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { publicOrigin } from "@/lib/public-url";
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
  // safeParse (geen throwing .parse): een geknutselde POST met een `planKey` buiten de enum mag
  // geen onafgevangen ZodError/500 geven, maar een nette domeinfout — spiegelt franchise/diensten.
  const parsedKey = planKeySchema.safeParse(planKey);
  if (!parsedKey.success) throw new Error("Ongeldig abonnement.");
  const key = parsedKey.data;
  const plan = await prisma.plan.findUnique({
    where: { key },
    select: { id: true, name: true, priceCents: true },
  });
  if (!plan) throw new Error("Plan niet gevonden.");

  let redirectUrl: string | null = null;

  if (plan.priceCents === 0) {
    await activate(actor.id, plan.id, key);
  } else {
    // Vertrouwde publieke origin (AUTH_URL), nooit uit de request-headers — anders kan een
    // vervalste Host/Origin de gebruiker na de betaling naar een aanvallerdomein redirecten
    // (open redirect, OWASP A01) of de webhook-callback omleiden. Zie src/lib/public-url.ts.
    const origin = await publicOrigin();
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
