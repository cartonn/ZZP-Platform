// Opslag-kant van de gelekt-wachtwoord-controle-aflever-heartbeat (dead-man's-switch). De DB-interactie zit
// sinds de consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom);
// hier blijft alleen de kanaalbinding + de vertaling naar het HIBP-oordeel staan.
//
// De registratie wordt aangeroepen door de HibpPasswordBreachChecker (password-breach.ts) rond élke
// controle via de echte HIBP-adapter. De noop-default registreert bewust niet (er wordt niets getoetst —
// geen productie-kanaal). Breach-controles gebeuren alleen bij het KIEZEN van een wachtwoord (registratie,
// wachtwoordherstel, wachtwoord wijzigen) — geen hot-path, dus één upsert per controle is verwaarloosbaar
// en er is (anders dan bij de rate-limit-store) geen coalescing nodig. De write is fail-open: een
// DB-storing hier mag een controle nooit alsnog laten falen. De pure beoordeling zit in
// password-breach-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluatePasswordBreachDeliveryFreshness,
  type PasswordBreachDeliveryFreshness,
} from "@/lib/observability/password-breach-delivery-freshness";

const SPEC = heartbeatChannelSpec("password-breach");

/** Canonieke naam van het gelekt-wachtwoord-controle-kanaal (singleton-rij). */
export const PASSWORD_BREACH_CHANNEL = SPEC.channel;

/**
 * Registreert dat een gelekt-wachtwoord-controle via de echte HIBP-adapter zojuist SLAAGDE (HIBP gaf een
 * geldig antwoord, ongeacht of het wachtwoord gelekt bleek): markeert het kanaal als operationeel en zet
 * de opeenvolgende-mislukkingen-teller terug op 0. Faalt nooit naar buiten.
 */
export async function recordPasswordBreachDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = PASSWORD_BREACH_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, driver, now, channel);
}

/**
 * Registreert dat een gelekt-wachtwoord-controle zojuist MISLUKTE (netwerk/time-out/niet-ok/parsefout):
 * markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op. Bewaart nooit
 * het wachtwoord, de hash-prefix of de foutinhoud — alleen tijdstip, de teller en de driver-modus. Faalt
 * nooit naar buiten.
 */
export async function recordPasswordBreachDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = PASSWORD_BREACH_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, driver, now, channel);
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste controle, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getPasswordBreachDeliveryFreshness(
  now: Date = new Date(),
  channel: string = PASSWORD_BREACH_CHANNEL,
): Promise<PasswordBreachDeliveryFreshness> {
  return evaluatePasswordBreachDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
