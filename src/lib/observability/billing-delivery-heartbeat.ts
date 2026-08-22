// Opslag-kant van de billing-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van de
// laatste échte betaalprovider-operatie en levert het oordeel voor /admin/systeemstatus + /api/metrics.
// De pure beoordeling zit in billing-delivery-freshness.ts; hier alleen de DB-interactie.
//
// De registratie wordt aangeroepen door de RecordingPaymentProvider-decorator (recording-payment-provider.ts)
// rond de uitgaande operaties (startCheckout/paymentStatus/checkConnectivity) van de echte Stripe-/Mollie-
// provider. De no-op-provider (mock/gratis default) registreert bewust niets (die doet geen externe call en
// is geen productie-kanaal). De write is fail-open, dus één upsert per operatie mag een geslaagde
// checkout/statuscontrole nooit alsnog laten falen.

import { prisma } from "@/lib/db";
import {
  evaluateBillingDeliveryFreshness,
  type BillingDeliveryFreshness,
} from "@/lib/observability/billing-delivery-freshness";
import { reportError } from "@/lib/observability/report";

/** Canonieke naam van het betaalprovider-kanaal (singleton-rij). */
export const PAYMENT_PROVIDER_CHANNEL = "payment-provider";

/**
 * Registreert dat een betaalprovider-operatie via de echte provider zojuist SLAAGDE: markeert het kanaal
 * als operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde checkout/statuscontrole niet alsnog laten falen. Een schrijffout wordt gestructureerd
 * gerapporteerd en geslikt.
 */
export async function recordBillingDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = PAYMENT_PROVIDER_CHANNEL,
): Promise<void> {
  try {
    await prisma.billingDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver,
      },
    });
  } catch (error) {
    await reportError(error, {
      source: "billing-delivery-heartbeat",
      requestPath: `/billing/${channel}`,
    });
  }
}

/**
 * Registreert dat een betaalprovider-operatie via de echte provider zojuist MISLUKTE: markeert het kanaal
 * als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een
 * AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit de sleutel/het endpoint of
 * de foutinhoud — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten (zelfde reden als hierboven): de oproeper heeft de echte operatie-fout al in
 * handen en logt/gooit die; deze registratie is best-effort.
 */
export async function recordBillingDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = PAYMENT_PROVIDER_CHANNEL,
): Promise<void> {
  try {
    await prisma.billingDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
        driver,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
        driver,
      },
    });
  } catch (error) {
    await reportError(error, {
      source: "billing-delivery-heartbeat",
      requestPath: `/billing/${channel}`,
    });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste operatie, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getBillingDeliveryFreshness(
  now: Date = new Date(),
  channel: string = PAYMENT_PROVIDER_CHANNEL,
): Promise<BillingDeliveryFreshness> {
  try {
    const row = await prisma.billingDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateBillingDeliveryFreshness(
      row
        ? {
            lastAttemptAt: row.lastAttemptAt,
            lastOk: row.lastOk,
            lastSuccessAt: row.lastSuccessAt,
            lastFailureAt: row.lastFailureAt,
            consecutiveFailures: row.consecutiveFailures,
            driver: row.driver,
          }
        : null,
      now,
    );
  } catch (error) {
    await reportError(error, {
      source: "billing-delivery-heartbeat",
      requestPath: `/billing/${channel}`,
    });
    return evaluateBillingDeliveryFreshness(null, now);
  }
}
