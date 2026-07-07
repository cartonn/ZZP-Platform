// Betaal-webhook: de provider (Mollie/Stripe) pingt dit endpoint zodra de betaalstatus wijzigt.
// De actieve provider haalt de referentie uit de request (en verifieert bij Stripe de handtekening);
// we halen daarna de status gezaghebbend op en activeren het PENDING-abonnement bij 'paid' (of zetten
// het op PAST_DUE bij 'failed'). Geen geheimen in de respons; altijd 200 zodat de provider niet blijft
// herproberen op een verwerkte/onbekende ping. Elke activatie wordt geaudit.

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getPaymentProvider } from "@/lib/billing/provider";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const provider = getPaymentProvider();

  // De rauwe body één keer lezen (Stripe-handtekeningverificatie vereist de exacte, ongeparste body).
  let paymentId: string | null;
  try {
    const raw = await request.text();
    paymentId = await provider.resolveWebhookRef(raw, request.headers);
  } catch {
    return new Response("ok", { status: 200 }); // niets te doen / ongeldige of niet-geverifieerde ping
  }
  if (!paymentId) return new Response("ok", { status: 200 });

  const sub = await prisma.subscription.findFirst({ where: { providerRef: paymentId } });
  if (!sub) return new Response("ok", { status: 200 });

  let status: "paid" | "open" | "failed";
  try {
    status = await provider.paymentStatus(paymentId);
  } catch {
    return new Response("ok", { status: 200 }); // provider tijdelijk onbereikbaar; geen retry-storm
  }

  if (status === "paid" && sub.status !== "ACTIVE") {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", currentPeriodEnd: periodEnd, pastDueAt: null },
    });
    await audit({
      actorId: null,
      action: "SUBSCRIPTION_ACTIVATED",
      entityType: "Subscription",
      entityId: sub.userId,
      metadata: { paymentId },
    });
  } else if (status === "failed" && sub.status === "PENDING") {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "PAST_DUE", pastDueAt: new Date() },
    });
    await audit({
      actorId: null,
      action: "SUBSCRIPTION_PAYMENT_FAILED",
      entityType: "Subscription",
      entityId: sub.userId,
      metadata: { paymentId },
    });
  }

  return new Response("ok", { status: 200 });
}
