// Opslag-kant van de betaalprovider-aflever-heartbeat (dead-man's-switch). De DB-interactie zit sinds de
// consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom); hier blijft
// alleen de kanaalbinding + de vertaling naar het billing-oordeel staan.
//
// De registratie wordt aangeroepen door de RecordingPaymentProvider-decorator (recording-payment-provider.ts)
// rond de uitgaande operaties (startCheckout/paymentStatus/checkConnectivity) van de echte Stripe-/Mollie-
// provider. De no-op-provider (mock/gratis default) registreert bewust niets (die doet geen externe call en
// is geen productie-kanaal). De write is fail-open, dus één upsert per operatie mag een geslaagde
// checkout/statuscontrole nooit alsnog laten falen. De pure beoordeling zit in billing-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateBillingDeliveryFreshness,
  type BillingDeliveryFreshness,
} from "@/lib/observability/billing-delivery-freshness";

const SPEC = heartbeatChannelSpec("payment-provider");

/** Canonieke naam van het betaalprovider-kanaal (singleton-rij). */
export const PAYMENT_PROVIDER_CHANNEL = SPEC.channel;

/**
 * Registreert dat een betaalprovider-operatie via de echte provider zojuist SLAAGDE: markeert het kanaal
 * als operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0. Faalt nooit naar buiten.
 */
export async function recordBillingDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = PAYMENT_PROVIDER_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, driver, now, channel);
}

/**
 * Registreert dat een betaalprovider-operatie via de echte provider zojuist MISLUKTE: markeert het kanaal
 * als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een
 * AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit sleutels/endpoints of
 * foutinhoud — alleen tijdstip, de teller en de driver-modus. Faalt nooit naar buiten.
 */
export async function recordBillingDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = PAYMENT_PROVIDER_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, driver, now, channel);
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
  return evaluateBillingDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
