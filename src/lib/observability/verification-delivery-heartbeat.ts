// Opslag-kant van de verificatie-aflever-heartbeat (dead-man's-switch). De DB-interactie zit sinds de
// consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom); hier blijft
// alleen de kanaalbinding + de vertaling naar het register-oordeel staan.
//
// De registratie wordt aangeroepen door de Recording*Verifier-decorators (recording-verifier.ts) rond
// de uitgaande `verify()`-operatie van de echte DUO-/BIG-/iDIN-verifier. De mock-verifiers (dev/demo
// default) registreren bewust niets (die doen geen externe call en zijn geen productie-kanaal). De
// write is fail-open, dus één upsert per operatie mag een geslaagde verificatie nooit alsnog laten
// falen — noch een echte fout maskeren.
//
// Elk register krijgt zijn eigen rij (channel-id), zodat een aanhoudende storing van één register niet
// wordt gemaskeerd door een ander dat wél antwoordt. De pure beoordeling zit in
// verification-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeats,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  aggregateVerificationDelivery,
  evaluateVerificationDeliveryFreshness,
  type VerificationAdapterFreshness,
  type VerificationDeliveryAggregate,
} from "@/lib/observability/verification-delivery-freshness";

/** Canonieke kanaal-ids (rij per register) + hun Nederlandse label. */
export const VERIFICATION_CHANNELS = [
  { key: "diploma", channel: "verification-diploma", label: "DUO — diploma's" },
  { key: "big", channel: "verification-big", label: "BIG-register" },
  { key: "identity", channel: "verification-identity", label: "iDIN — identiteit" },
] as const;

type VerificationChannel = (typeof VERIFICATION_CHANNELS)[number]["channel"];

/**
 * Registreert dat een verificatie-operatie via het echte register zojuist SLAAGDE (het register
 * antwoordde met een geldig contract): markeert het kanaal als operationeel en zet de opeenvolgende-
 * mislukkingen-teller terug op 0. Faalt nooit naar buiten.
 */
export async function recordVerificationDeliverySuccess(
  channel: VerificationChannel,
  driver: string,
  now: Date = new Date(),
): Promise<void> {
  await recordHeartbeatSuccess(heartbeatChannelSpec(channel), driver, now, channel);
}

/**
 * Registreert dat een verificatie-operatie via het echte register zojuist MISLUKTE (de call wierp):
 * markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een
 * monitor op een AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit de
 * sleutel/het endpoint of de foutinhoud — alleen tijdstip, de teller en de driver-modus. Faalt nooit naar
 * buiten.
 */
export async function recordVerificationDeliveryFailure(
  channel: VerificationChannel,
  driver: string,
  now: Date = new Date(),
): Promise<void> {
  await recordHeartbeatFailure(heartbeatChannelSpec(channel), driver, now, channel);
}

/**
 * Leest alle register-heartbeats en beoordeelt elk register + het geaggregeerde oordeel (event-gedreven:
 * uitkomst van de laatste operatie, geen staleness-op-leeftijd). Faalt nooit naar buiten: bij een
 * leesfout worden alle registers als "never" beoordeeld (neutraal) i.p.v. een 500 op het admin-scherm of
 * het metrics-endpoint.
 */
export async function getVerificationDeliveryOverview(now: Date = new Date()): Promise<{
  adapters: VerificationAdapterFreshness[];
  aggregate: VerificationDeliveryAggregate;
}> {
  const byChannel = await readHeartbeats(
    heartbeatChannelSpec("verification-diploma"),
    VERIFICATION_CHANNELS.map((spec) => spec.channel),
  );

  const adapters: VerificationAdapterFreshness[] = VERIFICATION_CHANNELS.map((spec) => ({
    key: spec.key,
    label: spec.label,
    freshness: evaluateVerificationDeliveryFreshness(byChannel.get(spec.channel) ?? null, now),
  }));

  return { adapters, aggregate: aggregateVerificationDelivery(adapters) };
}
