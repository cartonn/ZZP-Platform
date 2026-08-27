// Opslag-kant van de routing-provider-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst
// van de laatste échte reistijd-lookup via de externe routing-provider en levert het oordeel voor
// /admin/systeemstatus + /api/metrics. De pure beoordeling zit in routing-delivery-freshness.ts; hier
// alleen de DB-interactie + de write-coalescing.
//
// De registratie wordt aangeroepen vanuit de routing-grens (routing.ts) — het échte lookup-kanaal
// (ROUTING_PROVIDER=geoapify). De offline-default (geen provider) registreert bewust niet (geen
// productie-kanaal; matching gebruikt dan de deterministische offline schatting).
//
// WAAROM COALESCING: reistijd-lookups zitten op het match-/berekeningspad; bij een reeks lookups zou één
// DB-upsert per lookup extra DB-load geven. Daarom worden GESLAAGDE lookups gecoalesceerd: hooguit één
// success-schrijf per venster (ROUTING_HEARTBEAT_COALESCE_MS, default 15s) per proces. MISLUKKINGEN worden
// altijd direct geschreven (de teller moet scherp blijven), en een HERSTEL (eerste success ná een
// mislukking, of de allereerste operatie) schrijft ook altijd meteen zodat een opgeloste storing de alert
// direct wist.
//
// Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
// reistijd-lookup niet alsnog laten falen. Een schrijffout wordt rechtstreeks via de logger gelogd (die
// redacteert PII zelf) en geslikt. Bevat nooit de aanroep-URL, secrets of het adres.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import {
  evaluateRoutingDeliveryFreshness,
  type RoutingDeliveryFreshness,
} from "@/lib/observability/routing-delivery-freshness";

/** Canonieke naam van het routing-kanaal (singleton-rij). */
export const ROUTING_DELIVERY_CHANNEL = "routing";

/** Driver-modus die de echte provider aanduidt (de enige echte modus; offline = geen kanaal). */
export const ROUTING_DELIVERY_DRIVER = "geoapify";

// Per-proces coalescing-state. `null` = nog niets geregistreerd sinds boot (dwing dan een schrijf af).
let lastRecordedOk: boolean | null = null;
let lastSuccessWriteMs = 0;

const DEFAULT_COALESCE_MS = 15_000;
const MIN_COALESCE_MS = 0;
const MAX_COALESCE_MS = 300_000;

/** Leest + klemt het success-coalescing-venster (ms). `0` schakelt coalescing bewust uit (elke success schrijft). */
function resolveCoalesceMs(): number {
  const raw = process.env.ROUTING_HEARTBEAT_COALESCE_MS;
  if (raw === undefined || raw === "") return DEFAULT_COALESCE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_COALESCE_MS;
  return Math.min(MAX_COALESCE_MS, Math.max(MIN_COALESCE_MS, Math.floor(parsed)));
}

/** Reset de per-proces coalescing-state — uitsluitend voor tests (deterministische schrijf-beslissing). */
export function __resetRoutingHeartbeatCoalescingForTests(): void {
  lastRecordedOk = null;
  lastSuccessWriteMs = 0;
}

/**
 * Registreert dat een reistijd-lookup via de externe routing-provider zojuist SLAAGDE (de provider
 * antwoordde bruikbaar, ook als er geen geocode-match voor een adres was): markeert het kanaal als
 * operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0. Gecoalesceerd: hooguit één schrijf
 * per venster bij aanhoudend succes, maar altijd meteen bij een herstel (na een mislukking) of de eerste
 * operatie sinds boot.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag de
 * reistijd-lookup niet alsnog laten falen. Een schrijffout wordt rechtstreeks gelogd en geslikt.
 */
export async function recordRoutingDeliverySuccess(
  now: Date = new Date(),
  channel: string = ROUTING_DELIVERY_CHANNEL,
): Promise<void> {
  const nowMs = now.getTime();
  const coalesceMs = resolveCoalesceMs();
  // Coalesce alleen success-ná-success binnen het venster. Herstel (lastRecordedOk !== true) en de eerste
  // operatie (lastRecordedOk === null) schrijven altijd.
  if (lastRecordedOk === true && coalesceMs > 0 && nowMs - lastSuccessWriteMs < coalesceMs) {
    return;
  }
  try {
    await prisma.routingDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: ROUTING_DELIVERY_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: ROUTING_DELIVERY_DRIVER,
      },
    });
    // Alleen ná een geslaagde schrijf de coalescing-state bijwerken, zodat een mislukte schrijf niet stil
    // wordt weggecoalesceerd (de volgende success probeert dan opnieuw).
    lastRecordedOk = true;
    lastSuccessWriteMs = nowMs;
  } catch (error) {
    logger.error("routing-delivery-heartbeat", {
      op: "success",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Registreert dat een reistijd-lookup via de externe routing-provider zojuist MISLUKTE (de provider was
 * onbereikbaar/time-outte, óf antwoordde met een non-2xx/onleesbare respons — bv. verkeerde/verlopen
 * GEOAPIFY_API_KEY, HTTP 401/403/429/5xx): markeert het kanaal als afwijzend en telt de
 * opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE storing kan alarmeren
 * i.p.v. op één transiënte fout). Wordt altijd direct geschreven (nooit gecoalesceerd). Bewaart nooit de
 * aanroep-URL, de foutinhoud of het adres — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten: de routing-grens heeft de fout al afgehandeld (stille terugval op de offline
 * schatting); deze registratie is best-effort en logt een DB-schrijffout rechtstreeks.
 */
export async function recordRoutingDeliveryFailure(
  now: Date = new Date(),
  channel: string = ROUTING_DELIVERY_CHANNEL,
): Promise<void> {
  // Markeer de intentie meteen "failing" zodat de eerstvolgende success (herstel) sowieso schrijft — ook
  // als de onderstaande schrijf zelf faalt.
  lastRecordedOk = false;
  try {
    await prisma.routingDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
        driver: ROUTING_DELIVERY_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
        driver: ROUTING_DELIVERY_DRIVER,
      },
    });
  } catch (error) {
    logger.error("routing-delivery-heartbeat", {
      op: "failure",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste lookup, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getRoutingDeliveryFreshness(
  now: Date = new Date(),
  channel: string = ROUTING_DELIVERY_CHANNEL,
): Promise<RoutingDeliveryFreshness> {
  try {
    const row = await prisma.routingDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateRoutingDeliveryFreshness(
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
    logger.error("routing-delivery-heartbeat", {
      op: "read",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return evaluateRoutingDeliveryFreshness(null, now);
  }
}
