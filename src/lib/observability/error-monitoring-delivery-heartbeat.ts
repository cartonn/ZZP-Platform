// Opslag-kant van de error-monitoring-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst
// van de laatste échte capture via de Sentry-reporter en levert het oordeel voor /admin/systeemstatus +
// /api/metrics. De pure beoordeling zit in error-monitoring-delivery-freshness.ts; hier alleen de
// DB-interactie + de write-coalescing.
//
// De registratie wordt aangeroepen vanuit SentryErrorReporter.capture() (report.ts) — het échte externe
// kanaal (SENTRY_DSN gezet). De console-default (geen DSN) registreert bewust niet (geen extern kanaal).
//
// WAAROM COALESCING: de reporter zit op het fout-pad; bij een fout-storm (of een luidruchtige
// achtergrond-taak) zou één DB-upsert per capture extra DB-load genereren juist wanneer het systeem al in
// nood is. Daarom worden GESLAAGDE captures gecoalesceerd: hooguit één success-schrijf per venster
// (ERROR_MONITORING_HEARTBEAT_COALESCE_MS, default 15s) per proces. MISLUKKINGEN worden altijd direct
// geschreven (de teller moet scherp blijven), en een HERSTEL (eerste success ná een mislukking, of de
// allereerste operatie) schrijft ook altijd meteen zodat een opgeloste storing de alert direct wist.
//
// KRITISCH — GEEN reportError() hier: anders dan de andere heartbeats mag de foutafhandeling van DEZE
// module NOOIT via reportError() lopen. reportError() routeert terug door de Sentry-reporter, die op zijn
// beurt deze heartbeat aanroept → oneindige recursie. We loggen een DB-schrijffout daarom rechtstreeks via
// de logger (die redacteert PII zelf) en slikken 'm.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import {
  evaluateErrorMonitoringDeliveryFreshness,
  type ErrorMonitoringDeliveryFreshness,
} from "@/lib/observability/error-monitoring-delivery-freshness";

/** Canonieke naam van het error-monitoring-kanaal (singleton-rij). */
export const ERROR_MONITORING_CHANNEL = "error-monitoring";

/** Driver-modus die de externe monitor aanduidt (de enige echte modus; console = geen kanaal). */
export const ERROR_MONITORING_DRIVER = "sentry";

// Per-proces coalescing-state. `null` = nog niets geregistreerd sinds boot (dwing dan een schrijf af).
let lastRecordedOk: boolean | null = null;
let lastSuccessWriteMs = 0;

const DEFAULT_COALESCE_MS = 15_000;
const MIN_COALESCE_MS = 0;
const MAX_COALESCE_MS = 300_000;

/** Leest + klemt het success-coalescing-venster (ms). `0` schakelt coalescing bewust uit (elke success schrijft). */
function resolveCoalesceMs(): number {
  const raw = process.env.ERROR_MONITORING_HEARTBEAT_COALESCE_MS;
  if (raw === undefined || raw === "") return DEFAULT_COALESCE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_COALESCE_MS;
  return Math.min(MAX_COALESCE_MS, Math.max(MIN_COALESCE_MS, Math.floor(parsed)));
}

/** Reset de per-proces coalescing-state — uitsluitend voor tests (deterministische schrijf-beslissing). */
export function __resetErrorMonitoringHeartbeatCoalescingForTests(): void {
  lastRecordedOk = null;
  lastSuccessWriteMs = 0;
}

/**
 * Registreert dat een capture via de externe error-monitoring (Sentry) zojuist SLAAGDE (het pakket is
 * aanwezig en het transport accepteerde de dispatch): markeert het kanaal als operationeel en zet de
 * opeenvolgende-mislukkingen-teller terug op 0. Gecoalesceerd: hooguit één schrijf per venster bij
 * aanhoudend succes, maar altijd meteen bij een herstel (na een mislukking) of de eerste operatie sinds boot.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag het
 * rapporteren van een fout niet alsnog laten falen. Een schrijffout wordt rechtstreeks (niet via
 * reportError — recursie) gelogd en geslikt.
 */
export async function recordErrorMonitoringDeliverySuccess(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<void> {
  const nowMs = now.getTime();
  const coalesceMs = resolveCoalesceMs();
  // Coalesce alleen success-ná-success binnen het venster. Herstel (lastRecordedOk !== true) en de eerste
  // operatie (lastRecordedOk === null) schrijven altijd.
  if (lastRecordedOk === true && coalesceMs > 0 && nowMs - lastSuccessWriteMs < coalesceMs) {
    return;
  }
  try {
    await prisma.errorMonitoringDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: ERROR_MONITORING_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: ERROR_MONITORING_DRIVER,
      },
    });
    // Alleen ná een geslaagde schrijf de coalescing-state bijwerken, zodat een mislukte schrijf niet stil
    // wordt weggecoalesceerd (de volgende success probeert dan opnieuw).
    lastRecordedOk = true;
    lastSuccessWriteMs = nowMs;
  } catch (error) {
    logger.error("error-monitoring-delivery-heartbeat", {
      op: "success",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Registreert dat een capture via de externe error-monitoring (Sentry) zojuist MISLUKTE (pakket
 * @sentry/nextjs niet geïnstalleerd, of captureException/init wierp): markeert het kanaal als afwijzend en
 * telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE storing kan
 * alarmeren i.p.v. op één transiënte fout). Wordt altijd direct geschreven (nooit gecoalesceerd). Bewaart
 * nooit de DSN, de foutinhoud of PII — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten: de reporter heeft de fout al fail-open afgehandeld (console-fallback); deze
 * registratie is best-effort en logt een DB-schrijffout rechtstreeks (niet via reportError — recursie).
 */
export async function recordErrorMonitoringDeliveryFailure(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<void> {
  // Markeer de intentie meteen "failing" zodat de eerstvolgende success (herstel) sowieso schrijft — ook als
  // de onderstaande schrijf zelf faalt.
  lastRecordedOk = false;
  try {
    await prisma.errorMonitoringDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
        driver: ERROR_MONITORING_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
        driver: ERROR_MONITORING_DRIVER,
      },
    });
  } catch (error) {
    logger.error("error-monitoring-delivery-heartbeat", {
      op: "failure",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste capture, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint. Logt rechtstreeks (niet via reportError —
 * recursie).
 */
export async function getErrorMonitoringDeliveryFreshness(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<ErrorMonitoringDeliveryFreshness> {
  try {
    const row = await prisma.errorMonitoringDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateErrorMonitoringDeliveryFreshness(
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
    logger.error("error-monitoring-delivery-heartbeat", {
      op: "read",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return evaluateErrorMonitoringDeliveryFreshness(null, now);
  }
}
