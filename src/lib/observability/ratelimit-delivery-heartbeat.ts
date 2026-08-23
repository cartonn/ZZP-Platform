// Opslag-kant van de rate-limit-store-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst
// van de laatste échte operatie tegen de gedeelde rate-limit-store en levert het oordeel voor
// /admin/systeemstatus + /api/metrics. De pure beoordeling zit in ratelimit-delivery-freshness.ts; hier
// alleen de DB-interactie + de write-coalescing.
//
// De registratie wordt aangeroepen vanuit UpstashRateLimitStore.consume() (rate-limit.ts) — het échte,
// gedeelde kanaal. De in-memory default (MemoryRateLimitStore, pilot/dev-fallback) registreert bewust niet
// (die doet geen externe call en is geen productie-kanaal). De write is fail-open: één upsert mag een
// geslaagde/afgewezen rate-limit-check nooit alsnog laten falen.
//
// WAAROM COALESCING (uniek voor dit kanaal): anders dan storage/mail/push/billing/verification zit consume()
// op de AUTH-HOT-PATH — elk verzoek tegen een gelimiteerd eindpunt roept 'm aan. Eén DB-upsert per verzoek
// zou de rate-limiter (bedoeld om load te dempen) juist extra DB-load laten genereren. Daarom worden
// GESLAAGDE operaties gecoalesceerd: hooguit één success-schrijf per venster (RATELIMIT_HEARTBEAT_COALESCE_MS,
// default 15s) per proces. MISLUKKINGEN worden altijd direct geschreven (de teller moet scherp blijven), en
// een HERSTEL (eerste success ná een mislukking, of de allereerste operatie) schrijft ook altijd meteen zodat
// een opgeloste storing de alert direct wist. De DB-rij blijft de bron van waarheid voor de freshness-lezing;
// de in-memory vlaggen sturen alleen de schrijf-frequentie.

import { prisma } from "@/lib/db";
import { reportError } from "@/lib/observability/report";
import {
  evaluateRateLimitDeliveryFreshness,
  type RateLimitDeliveryFreshness,
} from "@/lib/observability/ratelimit-delivery-freshness";

/** Canonieke naam van het gedeelde rate-limit-store-kanaal (singleton-rij). */
export const RATE_LIMIT_STORE_CHANNEL = "rate-limit-store";

// Per-proces coalescing-state. `null` = nog niets geregistreerd sinds boot (dwing dan een schrijf af).
let lastRecordedOk: boolean | null = null;
let lastSuccessWriteMs = 0;

const DEFAULT_COALESCE_MS = 15_000;
const MIN_COALESCE_MS = 0;
const MAX_COALESCE_MS = 300_000;

/** Leest + klemt het success-coalescing-venster (ms). `0` schakelt coalescing bewust uit (elke success schrijft). */
function resolveCoalesceMs(): number {
  const raw = process.env.RATELIMIT_HEARTBEAT_COALESCE_MS;
  if (raw === undefined || raw === "") return DEFAULT_COALESCE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_COALESCE_MS;
  return Math.min(MAX_COALESCE_MS, Math.max(MIN_COALESCE_MS, Math.floor(parsed)));
}

/**
 * Registreert dat een operatie via de echte rate-limit-store zojuist SLAAGDE: markeert het kanaal als
 * operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0. Gecoalesceerd: hooguit één schrijf
 * per venster bij aanhoudend succes, maar altijd meteen bij een herstel (na een mislukking) of de eerste
 * operatie sinds boot.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde rate-limit-check niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd
 * en geslikt.
 */
export async function recordRateLimitDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = RATE_LIMIT_STORE_CHANNEL,
): Promise<void> {
  const nowMs = now.getTime();
  const coalesceMs = resolveCoalesceMs();
  // Coalesce alleen success-ná-success binnen het venster. Herstel (lastRecordedOk !== true) en de eerste
  // operatie (lastRecordedOk === null) schrijven altijd.
  if (lastRecordedOk === true && coalesceMs > 0 && nowMs - lastSuccessWriteMs < coalesceMs) {
    return;
  }
  try {
    await prisma.rateLimitDeliveryHeartbeat.upsert({
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
    // Alleen ná een geslaagde schrijf de coalescing-state bijwerken, zodat een mislukte schrijf niet stil
    // wordt weggecoalesceerd (de volgende success probeert dan opnieuw).
    lastRecordedOk = true;
    lastSuccessWriteMs = nowMs;
  } catch (error) {
    await reportError(error, {
      source: "ratelimit-delivery-heartbeat",
      requestPath: `/ratelimit/${channel}`,
    });
  }
}

/**
 * Registreert dat een operatie via de echte rate-limit-store zojuist MISLUKTE: markeert het kanaal als
 * afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE
 * storing kan alarmeren i.p.v. op één transiënte fout). Wordt altijd direct geschreven (nooit gecoalesceerd).
 * Bewaart nooit de rate-limit-key of de foutinhoud — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten: consume() heeft de fout al fail-open afgehandeld; deze registratie is best-effort.
 */
export async function recordRateLimitDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = RATE_LIMIT_STORE_CHANNEL,
): Promise<void> {
  // Markeer de intentie meteen "failing" zodat de eerstvolgende success (herstel) sowieso schrijft — ook als
  // de onderstaande schrijf zelf faalt.
  lastRecordedOk = false;
  try {
    await prisma.rateLimitDeliveryHeartbeat.upsert({
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
      source: "ratelimit-delivery-heartbeat",
      requestPath: `/ratelimit/${channel}`,
    });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste operatie, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getRateLimitDeliveryFreshness(
  now: Date = new Date(),
  channel: string = RATE_LIMIT_STORE_CHANNEL,
): Promise<RateLimitDeliveryFreshness> {
  try {
    const row = await prisma.rateLimitDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateRateLimitDeliveryFreshness(
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
      source: "ratelimit-delivery-heartbeat",
      requestPath: `/ratelimit/${channel}`,
    });
    return evaluateRateLimitDeliveryFreshness(null, now);
  }
}

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetRateLimitDeliveryHeartbeatState(): void {
  lastRecordedOk = null;
  lastSuccessWriteMs = 0;
}
