// Push-kant van de aflever-heartbeat (dead-man's-switch). De DB-interactie zit sinds de consolidatie in
// delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom); hier blijft alleen de
// kanaalbinding + de vertaling naar het push-oordeel staan.
//
// De registratie wordt aangeroepen door de push-delivery-taak (push-delivery-task.ts) ná elke
// afleverronde die daadwerkelijk aan echte (niet-verlopen) endpoints probeerde af te leveren. Een ronde
// zonder VAPID-config, zonder kandidaten of met uitsluitend verlopen abonnementen (churn) registreert
// bewust NIETS — er werd niets afgeleverd, dus er is niets te oordelen. Dit kanaal kent geen
// driver-begrip: de `driver`-kolom blijft leeg. De pure beoordeling zit in push-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluatePushDeliveryFreshness,
  type PushDeliveryFreshness,
} from "@/lib/observability/push-delivery-freshness";

const SPEC = heartbeatChannelSpec("web-push");

/** Canonieke naam van het uitgaande web-push-kanaal (singleton-rij). */
export const OUTBOUND_PUSH_CHANNEL = SPEC.channel;

/**
 * Registreert dat een web-push-afleverronde zojuist SLAAGDE (≥1 actief endpoint ontving de melding):
 * markeert het kanaal als afleverend en zet de opeenvolgende-mislukkingen-teller terug op 0. Faalt nooit
 * naar buiten.
 */
export async function recordPushDeliverySuccess(
  now: Date = new Date(),
  channel: string = OUTBOUND_PUSH_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, null, now, channel);
}

/**
 * Registreert dat een web-push-afleverronde zojuist MISLUKTE (echte, niet-verlopen endpoints, maar
 * niets kwam aan): markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller
 * atomair op. Bewaart nooit endpoints, payloads of foutinhoud — alleen tijdstip en de teller. Faalt nooit
 * naar buiten.
 */
export async function recordPushDeliveryFailure(
  now: Date = new Date(),
  channel: string = OUTBOUND_PUSH_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, null, now, channel);
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste afleverronde,
 * geen staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven
 * (neutraal) i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getPushDeliveryFreshness(
  now: Date = new Date(),
  channel: string = OUTBOUND_PUSH_CHANNEL,
): Promise<PushDeliveryFreshness> {
  return evaluatePushDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
