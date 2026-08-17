// Opslag-kant van de push-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van de
// laatste échte web-push-afleverronde en levert het oordeel voor /admin/systeemstatus + /api/metrics.
// De pure beoordeling zit in push-delivery-freshness.ts; hier alleen de DB-interactie.
//
// De registratie wordt aangeroepen door de push-delivery-taak (push-delivery-task.ts) ná elke
// afleverronde die daadwerkelijk aan echte (niet-verlopen) endpoints probeerde af te leveren. Een ronde
// zonder VAPID-config, zonder kandidaten of met uitsluitend verlopen abonnementen (churn) registreert
// bewust NIETS — er werd niets afgeleverd, dus er is niets te oordelen. Push-volume is bescheiden
// (notificaties, serieel achter een externe round-trip) en de write is fail-open, dus één upsert per
// ronde is verwaarloosbaar.

import { prisma } from "@/lib/db";
import { reportError } from "@/lib/observability/report";
import {
  evaluatePushDeliveryFreshness,
  type PushDeliveryFreshness,
} from "@/lib/observability/push-delivery-freshness";

/** Canonieke naam van het uitgaande web-push-kanaal (singleton-rij). */
export const OUTBOUND_PUSH_CHANNEL = "web-push";

/**
 * Registreert dat een web-push-afleverronde zojuist SLAAGDE (≥1 actief endpoint ontving de melding):
 * markeert het kanaal als afleverend en zet de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde afleverronde niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd
 * en geslikt.
 */
export async function recordPushDeliverySuccess(
  now: Date = new Date(),
  channel: string = OUTBOUND_PUSH_CHANNEL,
): Promise<void> {
  try {
    await prisma.pushDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
      },
    });
  } catch (error) {
    await reportError(error, {
      source: "push-delivery-heartbeat",
      requestPath: `/push/${channel}`,
    });
  }
}

/**
 * Registreert dat een web-push-afleverronde zojuist MISLUKTE (echte, niet-verlopen endpoints, maar
 * niets kwam aan): markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller
 * atomair op (zodat een monitor op een AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte
 * fout). Bewaart nooit endpoints, payloads of foutinhoud — alleen tijdstip en de teller.
 *
 * Faalt NOOIT naar buiten (zelfde reden als hierboven): de registratie is best-effort.
 */
export async function recordPushDeliveryFailure(
  now: Date = new Date(),
  channel: string = OUTBOUND_PUSH_CHANNEL,
): Promise<void> {
  try {
    await prisma.pushDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
      },
    });
  } catch (error) {
    await reportError(error, {
      source: "push-delivery-heartbeat",
      requestPath: `/push/${channel}`,
    });
  }
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
  try {
    const row = await prisma.pushDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluatePushDeliveryFreshness(
      row
        ? {
            lastAttemptAt: row.lastAttemptAt,
            lastOk: row.lastOk,
            lastSuccessAt: row.lastSuccessAt,
            lastFailureAt: row.lastFailureAt,
            consecutiveFailures: row.consecutiveFailures,
          }
        : null,
      now,
    );
  } catch (error) {
    await reportError(error, {
      source: "push-delivery-heartbeat",
      requestPath: `/push/${channel}`,
    });
    return evaluatePushDeliveryFreshness(null, now);
  }
}
