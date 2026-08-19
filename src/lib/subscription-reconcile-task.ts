// Geplande reconcile-runner: de webhook-backstop voor vastgelopen betaalde abonnementen.
//
// Achtergrond: een betaalde checkout upsert een `Subscription` naar `PENDING` met een `providerRef`.
// Normaal tilt de inkomende betaal-webhook 'm daarna gezaghebbend naar `ACTIVE`/`PAST_DUE`. Valt die
// webhook stil (verkeerde callback-URL, handtekening-mismatch, geblokkeerde poort, provider-retry
// uitgeput), dan blijft de rij voor altijd op `PENDING` — niemand geactiveerd, omzet lekt stil weg.
// PR #1135 voegde alleen *detectie* toe (`zzp_subscriptions_stale_pending`-gauge); deze taak voegt de
// *self-healing* toe die betaalproviders (Stripe/Mollie) expliciet aanbevelen: poll periodiek de
// provider voor PENDING-rijen die te lang wachten en pas de opgehaalde status alsnog toe.
//
// De statustoepassing loopt via exact dezelfde idempotente apply-helper als de webhook
// (`applyResolvedPaymentStatus`) — één bron van waarheid + gedeelde ledger-grendel, dus een reconcile
// en een (late) webhook die dezelfde betaling zien kunnen de periode niet twee keer verlengen.
//
// No-op met de mock-provider (pilot-default): die activeert direct en maakt nooit een PENDING-rij met
// externe `providerRef` aan, dus er is niets te reconciliëren.

import { prisma } from "@/lib/db";
import { getPaymentProvider, type PaymentProvider } from "@/lib/billing/provider";
import { applyResolvedPaymentStatus } from "@/lib/billing/apply-payment-status";
import { stalePendingSubscriptionWhere } from "@/lib/subscription-pending-stale";
import { subscriptionReconcileAfterMinutes, subscriptionReconcileMaxBatch } from "@/lib/config";

export interface SubscriptionReconcileResult {
  /** Aantal PENDING-rijen dat deze tick bij de provider is opgevraagd. */
  scanned: number;
  /** Aantal dat naar ACTIVE is getild (betaling alsnog bevestigd). */
  activated: number;
  /** Aantal dat naar PAST_DUE is gezet (betaling mislukt). */
  failed: number;
  /** Aantal dat legitiem PENDING blijft (provider gaf `open`) of al door een ander pad verwerkt was. */
  stillPending: number;
  /** Aantal waarvoor de provider-status niet opgehaald kon worden (transiënt; volgende tick opnieuw). */
  errored: number;
}

/** Snijpunt (`now - minutes`) waarvoor een PENDING-abonnement voor reconciliatie in aanmerking komt. */
export function reconcileCutoff(minutes: number, now: Date): Date {
  return new Date(now.getTime() - minutes * 60_000);
}

export async function runSubscriptionReconcileTask(opts: {
  actorId?: string | null;
  now?: Date;
  /** Injecteerbaar voor tests; default de env-geselecteerde provider. */
  provider?: PaymentProvider;
}): Promise<SubscriptionReconcileResult> {
  const now = opts.now ?? new Date();
  const provider = opts.provider ?? getPaymentProvider();

  const empty: SubscriptionReconcileResult = {
    scanned: 0,
    activated: 0,
    failed: 0,
    stillPending: 0,
    errored: 0,
  };

  // Snelle no-op bij de mock-provider: die maakt nooit een externe PENDING-referentie aan, dus er valt
  // niets te reconciliëren en we vermijden een overbodige DB-query + provider-round-trip.
  if (provider.name === "noop") return empty;

  const cutoff = reconcileCutoff(subscriptionReconcileAfterMinutes(), now);
  const rows = await prisma.subscription.findMany({
    // Alleen PENDING-rijen die (a) lang genoeg wachten (stale-where) én (b) een externe betaalreferentie
    // hebben — zonder providerRef is er niets bij de provider op te vragen.
    where: { ...stalePendingSubscriptionWhere(cutoff), providerRef: { not: null } },
    // Oudste eerst: die wachten het langst en zijn het meest verdacht van een gemiste webhook.
    orderBy: { updatedAt: "asc" },
    take: subscriptionReconcileMaxBatch(),
    select: { id: true, userId: true, status: true, providerRef: true },
  });

  const result: SubscriptionReconcileResult = { ...empty, scanned: rows.length };

  // Sequentieel (geen parallelle burst): mild voor de provider en houdt de idempotente transacties
  // ongecompliceerd. De batchgrootte begrenst de totale looptijd binnen de cron-deadline.
  for (const row of rows) {
    const providerRef = row.providerRef;
    if (!providerRef) continue; // defensief; de where sluit null al uit.

    let status;
    try {
      status = await provider.paymentStatus(providerRef);
    } catch {
      // Provider tijdelijk onbereikbaar/instabiel: sla deze rij over, de volgende tick probeert opnieuw.
      result.errored += 1;
      continue;
    }

    let outcome;
    try {
      outcome = await applyResolvedPaymentStatus({
        sub: { id: row.id, userId: row.userId, status: row.status },
        providerName: provider.name,
        paymentId: providerRef,
        status,
        now,
      });
    } catch {
      // Transiënte DB-fout tijdens de mutatie: tel als errored, volgende tick opnieuw (idempotent).
      result.errored += 1;
      continue;
    }

    if (outcome === "activated") result.activated += 1;
    else if (outcome === "failed") result.failed += 1;
    else result.stillPending += 1; // "unchanged" (open/al verwerkt) of "duplicate"
  }

  return result;
}
