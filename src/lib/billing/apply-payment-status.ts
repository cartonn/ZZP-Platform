// Gedeelde toepassing van een gezaghebbend opgehaalde betaalstatus op een abonnement.
//
// Zowel de inkomende betaal-webhook (src/app/api/billing/webhook/route.ts) als de reconcile-cron
// (src/lib/subscription-reconcile-task.ts) moeten exact dezelfde statusovergang schrijven wanneer de
// provider een betaling als `paid`/`failed` rapporteert. Die logica leeft hier op één plek zodat de
// twee paden niet kunnen driften: een `paid` tilt een niet-actief abonnement naar ACTIVE (+ periode,
// + audit), een `failed` zet een PENDING-abonnement op PAST_DUE (+ audit); `open` doet niets.
//
// Idempotentie via de gedeelde ledger `ProcessedWebhookEvent` op `(provider, eventKey)`: elk
// (paymentRef, status)-paar wordt exact één keer verwerkt. Een tweede aanroep — of dat nu een
// herspeelde webhook is óf de reconcile-poll die dezelfde betaling opnieuw ziet — schendt de unieke
// constraint (P2002), de transactie rolt terug en we melden `duplicate` (inert, geen dubbele mutatie).
// Zo kan een webhook + reconcile die dezelfde `paid` zien de periode niet twee keer verlengen.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import type { PaymentStatus } from "@/lib/billing/provider";
import { canSubscriptionTransition } from "@/lib/billing/subscription-transitions";
import { webhookEventKey, isUniqueConstraintError } from "@/lib/billing/webhook-idempotency";

/** Uitkomst van het toepassen van een opgehaalde betaalstatus op een abonnement. */
export type PaymentApplyOutcome =
  | "activated" // PENDING/… → ACTIVE (betaling geslaagd)
  | "failed" // PENDING → PAST_DUE (betaling mislukt)
  | "unchanged" // status vereiste geen (geldige) overgang (bv. `open`, of al ACTIVE)
  | "duplicate"; // dit (paymentRef, status)-event was al verwerkt (idempotentie-grendel)

/** Minimale abonnementsvelden die de apply-logica nodig heeft (reeds opgehaald door de aanroeper). */
export interface PaymentApplySubscription {
  id: string;
  userId: string;
  status: string;
}

export interface PaymentApplyContext {
  sub: PaymentApplySubscription;
  /** Providernaam voor de ledger-rij (bv. "mollie"/"stripe"). */
  providerName: string;
  /** Provider-referentie van de betaling (payment-/session-id). */
  paymentId: string;
  /** Gezaghebbend opgehaalde betaalstatus. */
  status: PaymentStatus;
  /** Klok (injecteerbaar voor tests). */
  now?: Date;
}

/**
 * Past een gezaghebbend opgehaalde betaalstatus toe op een abonnement, idempotent en geaudit.
 *
 * Gooit **alleen** door bij een echte (transiënte) DB-fout — de aanroeper mag dan opnieuw proberen
 * (webhook: 500 → provider-retry; reconcile: volgende cron-tick). Een reeds-verwerkt event (P2002)
 * wordt gevangen en als `duplicate` teruggegeven, nooit als fout.
 */
export async function applyResolvedPaymentStatus(
  ctx: PaymentApplyContext,
): Promise<PaymentApplyOutcome> {
  const { sub, providerName, paymentId, status } = ctx;
  const now = ctx.now ?? new Date();
  const eventKey = webhookEventKey(paymentId, status);

  try {
    return await prisma.$transaction(async (tx) => {
      // De ledger-rij wordt atomair mét de statusmutatie + audit geschreven. Schendt het event de
      // unieke constraint, dan rolt alles terug — de `catch` hieronder meldt `duplicate`.
      await tx.processedWebhookEvent.create({ data: { provider: providerName, eventKey } });

      if (
        status === "paid" &&
        sub.status !== "ACTIVE" &&
        canSubscriptionTransition(sub.status, "ACTIVE")
      ) {
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "ACTIVE", currentPeriodEnd: periodEnd, pastDueAt: null },
        });
        await tx.auditLog.create({
          data: auditData({
            actorId: null,
            action: "SUBSCRIPTION_ACTIVATED",
            entityType: "Subscription",
            entityId: sub.userId,
            metadata: { paymentId },
          }),
        });
        return "activated";
      }

      if (
        status === "failed" &&
        sub.status === "PENDING" &&
        canSubscriptionTransition(sub.status, "PAST_DUE")
      ) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE", pastDueAt: now },
        });
        await tx.auditLog.create({
          data: auditData({
            actorId: null,
            action: "SUBSCRIPTION_PAYMENT_FAILED",
            entityType: "Subscription",
            entityId: sub.userId,
            metadata: { paymentId },
          }),
        });
        return "failed";
      }

      // Geen (geldige) overgang nodig (bv. `open`, of al ACTIVE): de ledger-rij is geschreven zodat
      // een herhaling van ditzelfde event later inert `duplicate` wordt.
      return "unchanged";
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) return "duplicate";
    throw err;
  }
}
