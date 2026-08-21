// Opslag-kant van de opslag-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van de
// laatste échte object-opslag-operatie en levert het oordeel voor /admin/systeemstatus + /api/metrics.
// De pure beoordeling zit in storage-delivery-freshness.ts; hier alleen de DB-interactie.
//
// De registratie wordt aangeroepen door de RecordingStorageDriver-decorator (storage.ts) rond élke
// operatie (put/get/delete/exists) via de echte S3-driver. De lokale disk-driver (dev-fallback)
// registreert bewust niet (die faalt niet op dezelfde manier en is geen productie-kanaal). De write is
// fail-open, dus één upsert per operatie mag een geslaagde upload/download nooit alsnog laten falen.

import { prisma } from "@/lib/db";
import { reportError } from "@/lib/observability/report";
import {
  evaluateStorageDeliveryFreshness,
  type StorageDeliveryFreshness,
} from "@/lib/observability/storage-delivery-freshness";

/** Canonieke naam van het object-opslagkanaal (singleton-rij). */
export const OBJECT_STORAGE_CHANNEL = "object-storage";

/**
 * Registreert dat een object-opslag-operatie via de echte driver zojuist SLAAGDE: markeert het kanaal
 * als operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde opslag-operatie niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd
 * en geslikt.
 */
export async function recordStorageDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = OBJECT_STORAGE_CHANNEL,
): Promise<void> {
  try {
    await prisma.storageDeliveryHeartbeat.upsert({
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
      source: "storage-delivery-heartbeat",
      requestPath: `/storage/${channel}`,
    });
  }
}

/**
 * Registreert dat een object-opslag-operatie via de echte driver zojuist MISLUKTE: markeert het kanaal
 * als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een
 * AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit de key/het pad of de
 * foutinhoud — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten (zelfde reden als hierboven): de oproeper heeft de echte operatie-fout al in
 * handen en logt/gooit die; deze registratie is best-effort.
 */
export async function recordStorageDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = OBJECT_STORAGE_CHANNEL,
): Promise<void> {
  try {
    await prisma.storageDeliveryHeartbeat.upsert({
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
      source: "storage-delivery-heartbeat",
      requestPath: `/storage/${channel}`,
    });
  }
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
  try {
    const row = await prisma.storageDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateStorageDeliveryFreshness(
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
      source: "storage-delivery-heartbeat",
      requestPath: `/storage/${channel}`,
    });
    return evaluateStorageDeliveryFreshness(null, now);
  }
}
