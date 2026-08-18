// Pure detectie-logica voor vastgelopen PENDING-abonnementen (geen I/O — deterministisch en getest).
//
// Achtergrond: een betaalde checkout upsert een `Subscription` naar status `PENDING` met een
// `providerRef` (zie src/app/(protected)/abonnement/actions.ts). De betaal-webhook haalt daarna de
// status gezaghebbend op en zet de rij op `ACTIVE` (paid) of `PAST_DUE` (failed). Elke andere
// abonnementsstatus heeft een levensloop-cron (ACTIVE → subscription-expiry, PAST_DUE →
// subscription-past-due) én een stille-faal-gauge; `PENDING` heeft géén cron die 'm verwerkt.
//
// Een rij blijft dus PENDING zolang de webhook niets bevestigt. Dat is normaal voor de paar minuten
// van een lopende checkout, maar wordt een stille faalmodus wanneer 'ie lang blijft staan: de checkout
// is verlaten, óf — kritischer — de webhook levert stil niet af (verkeerde callback-URL,
// handtekening-mismatch, geblokkeerde poort). In dat laatste geval blijft ÉLKE checkout op PENDING
// staan en wordt niemand geactiveerd — verloren omzet zonder dat iets dat toont. Deze helper levert de
// één-bron-van-waarheid where-vorm voor de `zzp_subscriptions_stale_pending`-gauge op /api/metrics.
//
// De mock-provider (pilot-default) activeert direct en maakt nooit een PENDING-rij aan, dus de gauge
// is dan per definitie 0 (geen misleidend signaal) — de detector wordt pas relevant met een echte
// betaalprovider.

import type { Prisma } from "@prisma/client";

/**
 * Snijpunt (`now - hours`) waarvoor een PENDING-abonnement als vastgelopen telt. Een rij wier
 * `updatedAt` (het moment waarop 'ie voor het laatst PENDING werd gezet) vóór dit punt ligt, staat
 * langer dan het venster te wachten op een webhook-bevestiging.
 */
export function pendingStaleCutoff(hours: number, now: Date): Date {
  return new Date(now.getTime() - hours * 3_600_000);
}

/**
 * Where-vorm voor abonnementen die te lang in `PENDING` hangen: status PENDING én `updatedAt` vóór de
 * cutoff. `updatedAt` (niet `createdAt`) is de juiste klok: een gebruiker die een nieuwe checkout start
 * op een bestaande PENDING-rij bumpt `updatedAt`, wat de wachtklok terecht reset — een verse
 * betaalpoging telt niet meteen als vastgelopen. Één bron van waarheid voor de metrics-gauge.
 */
export function stalePendingSubscriptionWhere(cutoff: Date): Prisma.SubscriptionWhereInput {
  return { status: "PENDING", updatedAt: { lt: cutoff } };
}
