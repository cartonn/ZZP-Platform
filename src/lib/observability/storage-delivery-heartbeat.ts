// Opslag-kant van de object-opslag-aflever-heartbeat (dead-man's-switch). De DB-interactie zit sinds de
// consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom); hier blijft
// alleen de kanaalbinding + de vertaling naar het opslag-oordeel staan.
//
// De registratie wordt aangeroepen door de RecordingStorageDriver-decorator (storage.ts) rond élke
// operatie (put/get/delete/exists) via de echte S3-driver. De lokale disk-driver (dev-fallback)
// registreert bewust niet (die faalt niet op dezelfde manier en is geen productie-kanaal). De write is
// fail-open, dus één upsert per operatie mag een geslaagde upload/download nooit alsnog laten falen.
// De pure beoordeling zit in storage-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateStorageDeliveryFreshness,
  type StorageDeliveryFreshness,
} from "@/lib/observability/storage-delivery-freshness";

const SPEC = heartbeatChannelSpec("object-storage");

/** Canonieke naam van het object-opslagkanaal (singleton-rij). */
export const OBJECT_STORAGE_CHANNEL = SPEC.channel;

/**
 * Registreert dat een object-opslag-operatie via de echte driver zojuist SLAAGDE: markeert het kanaal
 * als operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0. Faalt nooit naar buiten.
 */
export async function recordStorageDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = OBJECT_STORAGE_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, driver, now, channel);
}

/**
 * Registreert dat een object-opslag-operatie via de echte driver zojuist MISLUKTE: markeert het kanaal als
 * afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE
 * storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit keys/paden of foutinhoud — alleen
 * tijdstip, de teller en de driver-modus. Faalt nooit naar buiten.
 */
export async function recordStorageDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = OBJECT_STORAGE_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, driver, now, channel);
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste operatie, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getStorageDeliveryFreshness(
  now: Date = new Date(),
  channel: string = OBJECT_STORAGE_CHANNEL,
): Promise<StorageDeliveryFreshness> {
  return evaluateStorageDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
