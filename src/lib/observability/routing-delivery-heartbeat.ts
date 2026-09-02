// Opslag-kant van de routing-provider-aflever-heartbeat (dead-man's-switch). De DB-interactie + de
// write-coalescing zitten sinds de consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met
// een `channel`-kolom); hier blijft alleen de kanaalbinding + de vertaling naar het routing-oordeel staan.
//
// De registratie wordt aangeroepen vanuit de routing-grens (routing.ts) — het échte lookup-kanaal
// (ROUTING_PROVIDER=geoapify). De offline-default (geen provider) registreert bewust niet (geen
// productie-kanaal; matching gebruikt dan de deterministische offline schatting).
//
// WAAROM COALESCING: reistijd-lookups zitten op het match-/berekeningspad; bij een reeks lookups zou één
// DB-upsert per lookup extra DB-load geven. Daarom worden GESLAAGDE lookups gecoalesceerd
// (ROUTING_HEARTBEAT_COALESCE_MS, default 15s per proces); mislukkingen en herstel schrijven altijd meteen.
//
// Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
// reistijd-lookup niet alsnog laten falen. Het kanaal staat met `errorSink: "log"` in de registratie: een
// schrijffout gaat rechtstreeks naar de logger (die redacteert PII zelf) en wordt geslikt. Bevat nooit de
// aanroep-URL, secrets of het adres. De pure beoordeling zit in routing-delivery-freshness.ts.

import {
  __resetHeartbeatCoalescing,
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateRoutingDeliveryFreshness,
  type RoutingDeliveryFreshness,
} from "@/lib/observability/routing-delivery-freshness";

const SPEC = heartbeatChannelSpec("routing");

/** Canonieke naam van het routing-kanaal (singleton-rij). */
export const ROUTING_DELIVERY_CHANNEL = SPEC.channel;

/** Driver-modus die de echte provider aanduidt (de enige echte modus; offline = geen kanaal). */
export const ROUTING_DELIVERY_DRIVER = "geoapify";

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetRoutingHeartbeatCoalescingForTests(): void {
  __resetHeartbeatCoalescing();
}

/**
 * Registreert dat een reistijd-lookup via de externe routing-provider zojuist SLAAGDE (de provider gaf een
 * geldig antwoord): markeert het kanaal als operationeel en zet de opeenvolgende-mislukkingen-teller terug
 * op 0. Gecoalesceerd bij aanhoudend succes, maar altijd meteen bij een herstel of de eerste operatie sinds
 * boot. Faalt nooit naar buiten.
 */
export async function recordRoutingDeliverySuccess(
  now: Date = new Date(),
  channel: string = ROUTING_DELIVERY_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, ROUTING_DELIVERY_DRIVER, now, channel);
}

/**
 * Registreert dat een reistijd-lookup via de externe routing-provider zojuist MISLUKTE (onbereikbaar,
 * time-out, non-2xx/onleesbaar antwoord): markeert het kanaal als afwijzend en telt de
 * opeenvolgende-mislukkingen-teller atomair op. Wordt altijd direct geschreven (nooit gecoalesceerd).
 * Bewaart nooit de aanroep-URL, de foutinhoud of het adres — alleen tijdstip, de teller en de driver-modus.
 * Faalt nooit naar buiten.
 */
export async function recordRoutingDeliveryFailure(
  now: Date = new Date(),
  channel: string = ROUTING_DELIVERY_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, ROUTING_DELIVERY_DRIVER, now, channel);
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
  return evaluateRoutingDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
