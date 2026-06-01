// Betaal-webhook: de provider (Mollie) pingt dit endpoint met de payment-id zodra de status
// wijzigt. We halen de status op via de provider en activeren het PENDING-abonnement bij 'paid'
// (of zetten het op PAST_DUE bij 'failed'). Geen geheimen in de respons; altijd 200 zodat de
// provider niet blijft herproberen op een verwerkte ping. Elke activatie wordt geaudit.

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getPaymentProvider } from "@/lib/billing/provider";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // Mollie stuurt application/x-www-form-urlencoded met veld "id".
  let paymentId = "";
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      paymentId = String(((await request.json()) as { id?: unknown }).id ?? "");
    } else {
      const form = await request.formData();
      paymentId = String(form.get("id") ?? "");
    }
  } catch {
    return new Response("ok", { status: 200 }); // niets te doen
  }
  if (!paymentId) return new Response("ok", { status: 200 });

  const sub = await prisma.subscription.findFirst({ where: { providerRef: paymentId } });
  if (!sub) return new Response("ok", { status: 200 });

  let status: "paid" | "open" | "failed";
  try {
    status = await getPaymentProvider().paymentStatus(paymentId);
  } catch {
    return new Response("ok", { status: 200 }); // provider tijdelijk onbereikbaar; geen retry-storm
  }

  if (status === "paid" && sub.status !== "ACTIVE") {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", currentPeriodEnd: periodEnd },
    });
    await audit({
      actorId: null,
      action: "SUBSCRIPTION_ACTIVATED",
      entityType: "Subscription",
      entityId: sub.userId,
      metadata: { paymentId },
    });
  } else if (status === "failed" && sub.status === "PENDING") {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE" } });
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
