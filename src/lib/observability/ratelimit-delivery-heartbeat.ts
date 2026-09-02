// Opslag-kant van de rate-limit-store-aflever-heartbeat (dead-man's-switch). De DB-interactie + de
// write-coalescing zitten sinds de consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met
// een `channel`-kolom); hier blijft alleen de kanaalbinding + de vertaling naar het rate-limit-oordeel staan.
//
// De registratie wordt aangeroepen vanuit UpstashRateLimitStore.consume() (rate-limit.ts) — het échte,
// gedeelde kanaal. De in-memory default (MemoryRateLimitStore, pilot/dev-fallback) registreert bewust niet
// (die doet geen externe call en is geen productie-kanaal). De write is fail-open: één upsert mag een
// geslaagde/afgewezen rate-limit-check nooit alsnog laten falen.
//
// WAAROM COALESCING: consume() zit op de AUTH-HOT-PATH — elk verzoek tegen een gelimiteerd eindpunt roept
// 'm aan. Eén DB-upsert per verzoek zou de rate-limiter (bedoeld om load te dempen) juist extra DB-load
// laten genereren. Daarom worden GESLAAGDE operaties gecoalesceerd (RATELIMIT_HEARTBEAT_COALESCE_MS,
// default 15s per proces); mislukkingen en herstel schrijven altijd meteen. De pure beoordeling zit in
// ratelimit-delivery-freshness.ts.

import {
  __resetHeartbeatCoalescing,
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateRateLimitDeliveryFreshness,
  type RateLimitDeliveryFreshness,
} from "@/lib/observability/ratelimit-delivery-freshness";

const SPEC = heartbeatChannelSpec("rate-limit-store");

/** Canonieke naam van het gedeelde rate-limit-store-kanaal (singleton-rij). */
export const RATE_LIMIT_STORE_CHANNEL = SPEC.channel;

/**
 * Registreert dat een operatie via de echte rate-limit-store zojuist SLAAGDE: markeert het kanaal als
 * operationeel en zet de opeenvolgende-mislukkingen-teller terug op 0. Gecoalesceerd: hooguit één schrijf
 * per venster bij aanhoudend succes, maar altijd meteen bij een herstel (na een mislukking) of de eerste
 * operatie sinds boot. Faalt nooit naar buiten.
 */
export async function recordRateLimitDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = RATE_LIMIT_STORE_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, driver, now, channel);
}

/**
 * Registreert dat een operatie via de echte rate-limit-store zojuist MISLUKTE: markeert het kanaal als
 * afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op. Wordt altijd direct geschreven (nooit
 * gecoalesceerd). Bewaart nooit de rate-limit-key of de foutinhoud — alleen tijdstip, de teller en de
 * driver-modus. Faalt nooit naar buiten.
 */
export async function recordRateLimitDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = RATE_LIMIT_STORE_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, driver, now, channel);
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
  return evaluateRateLimitDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetRateLimitDeliveryHeartbeatState(): void {
  __resetHeartbeatCoalescing();
}
