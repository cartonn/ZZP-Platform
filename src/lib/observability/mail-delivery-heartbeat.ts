// Mail-kant van de aflever-heartbeat (dead-man's-switch). De DB-interactie zit sinds de consolidatie in
// delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met een `channel`-kolom); hier blijft alleen de
// kanaalbinding + de vertaling naar het mail-oordeel staan.
//
// De registratie wordt aangeroepen door de RecordingMailSender-decorator (mail-sender.ts) rond élke
// verzending via een echte driver (smtp/resend/postmark/ses). De noop-driver registreert bewust niet
// (er wordt niets afgeleverd). Mailvolume is bescheiden (notificaties/herstel/herinneringen, serieel
// verzonden achter een externe HTTP-round-trip) en de write is fail-open, dus één upsert per
// verzending is verwaarloosbaar. De pure beoordeling zit in mail-delivery-freshness.ts.

import {
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateMailDeliveryFreshness,
  type MailDeliveryFreshness,
} from "@/lib/observability/mail-delivery-freshness";

const SPEC = heartbeatChannelSpec("outbound");

/** Canonieke naam van het uitgaande e-mailkanaal (singleton-rij). */
export const OUTBOUND_MAIL_CHANNEL = SPEC.channel;

/**
 * Registreert dat een e-mailverzending via een echt kanaal zojuist SLAAGDE: markeert het kanaal als
 * afleverend en zet de opeenvolgende-mislukkingen-teller terug op 0. Faalt nooit naar buiten.
 */
export async function recordMailDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = OUTBOUND_MAIL_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, driver, now, channel);
}

/**
 * Registreert dat een e-mailverzending via een echt kanaal zojuist MISLUKTE: markeert het kanaal als
 * afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE
 * storing kan alarmeren i.p.v. op één transiënte bounce). Bewaart nooit het adres/onderwerp of de
 * foutinhoud — alleen tijdstip, de teller en de driver-modus. Faalt nooit naar buiten.
 */
export async function recordMailDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = OUTBOUND_MAIL_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, driver, now, channel);
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste verzending,
 * geen staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven
 * (neutraal) i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getMailDeliveryFreshness(
  now: Date = new Date(),
  channel: string = OUTBOUND_MAIL_CHANNEL,
): Promise<MailDeliveryFreshness> {
  return evaluateMailDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
