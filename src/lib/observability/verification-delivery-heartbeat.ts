// Opslag-kant van de verificatie-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van
// de laatste échte verificatie-operatie per register en levert het oordeel voor /admin/systeemstatus +
// /api/metrics. De pure beoordeling zit in verification-delivery-freshness.ts; hier alleen de
// DB-interactie.
//
// De registratie wordt aangeroepen door de Recording*Verifier-decorators (recording-verifier.ts) rond
// de uitgaande `verify()`-operatie van de echte DUO-/BIG-/iDIN-verifier. De mock-verifiers (dev/demo
// default) registreren bewust niets (die doen geen externe call en zijn geen productie-kanaal). De
// write is fail-open, dus één upsert per operatie mag een geslaagde verificatie nooit alsnog laten
// falen — noch een echte fout maskeren.
//
// Elk register krijgt zijn eigen singleton-rij (channel-id), zodat een aanhoudende storing van één
// register niet wordt gemaskeerd door een ander dat wél antwoordt.

import { prisma } from "@/lib/db";
import {
  aggregateVerificationDelivery,
  evaluateVerificationDeliveryFreshness,
  type VerificationAdapterFreshness,
  type VerificationDeliveryAggregate,
} from "@/lib/observability/verification-delivery-freshness";
import { reportError } from "@/lib/observability/report";

/** Canonieke kanaal-ids (singleton-rij per register) + hun Nederlandse label. */
export const VERIFICATION_CHANNELS = [
  { key: "diploma", channel: "verification-diploma", label: "DUO — diploma's" },
  { key: "big", channel: "verification-big", label: "BIG-register" },
  { key: "identity", channel: "verification-identity", label: "iDIN — identiteit" },
] as const;

type VerificationChannel = (typeof VERIFICATION_CHANNELS)[number]["channel"];

/**
 * Registreert dat een verificatie-operatie via het echte register zojuist SLAAGDE (het register
 * antwoordde met een geldig contract): markeert het kanaal als operationeel en zet de opeenvolgende-
 * mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde verificatie niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd en
 * geslikt.
 */
export async function recordVerificationDeliverySuccess(
  channel: VerificationChannel,
  driver: string,
  now: Date = new Date(),
): Promise<void> {
  try {
    await prisma.verificationDeliveryHeartbeat.upsert({
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
      source: "verification-delivery-heartbeat",
      requestPath: `/verification/${channel}`,
    });
  }
}

/**
 * Registreert dat een verificatie-operatie via het echte register zojuist MISLUKTE (de call wierp):
 * markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een
 * monitor op een AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Bewaart nooit de
 * sleutel/het endpoint of de foutinhoud — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten (zelfde reden als hierboven): de oproeper heeft de echte operatie-fout al in
 * handen en logt/gooit die; deze registratie is best-effort.
 */
export async function recordVerificationDeliveryFailure(
  channel: VerificationChannel,
  driver: string,
  now: Date = new Date(),
): Promise<void> {
  try {
    await prisma.verificationDeliveryHeartbeat.upsert({
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
      source: "verification-delivery-heartbeat",
      requestPath: `/verification/${channel}`,
    });
  }
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
  let rows: Awaited<ReturnType<typeof prisma.verificationDeliveryHeartbeat.findMany>> = [];
  try {
    rows = await prisma.verificationDeliveryHeartbeat.findMany({
      where: { channel: { in: VERIFICATION_CHANNELS.map((c) => c.channel) } },
    });
  } catch (error) {
    await reportError(error, {
      source: "verification-delivery-heartbeat",
      requestPath: "/verification/overview",
    });
    rows = [];
  }

  const byChannel = new Map(rows.map((row) => [row.channel, row]));
  const adapters: VerificationAdapterFreshness[] = VERIFICATION_CHANNELS.map((spec) => {
    const row = byChannel.get(spec.channel);
    return {
      key: spec.key,
      label: spec.label,
      freshness: evaluateVerificationDeliveryFreshness(
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
      ),
    };
  });

  return { adapters, aggregate: aggregateVerificationDelivery(adapters) };
}
