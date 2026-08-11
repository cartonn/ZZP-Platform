// Opslag-kant van de mail-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van de
// laatste échte e-mailverzending en levert het oordeel voor /admin/systeemstatus + /api/metrics. De
// pure beoordeling zit in mail-delivery-freshness.ts; hier alleen de DB-interactie.
//
// De registratie wordt aangeroepen door de RecordingMailSender-decorator (mail-sender.ts) rond élke
// verzending via een echte driver (smtp/resend/postmark/ses). De noop-driver registreert bewust niet
// (er wordt niets afgeleverd). Mailvolume is bescheiden (notificaties/herstel/herinneringen, serieel
// verzonden achter een externe HTTP-round-trip) en de write is fail-open, dus één upsert per
// verzending is verwaarloosbaar.

import { prisma } from "@/lib/db";
import { reportError } from "@/lib/observability/report";
import {
  evaluateMailDeliveryFreshness,
  type MailDeliveryFreshness,
} from "@/lib/observability/mail-delivery-freshness";

/** Canonieke naam van het uitgaande e-mailkanaal (singleton-rij). */
export const OUTBOUND_MAIL_CHANNEL = "outbound";

/**
 * Registreert dat een e-mailverzending via een echt kanaal zojuist SLAAGDE: markeert het kanaal als
 * afleverend en zet de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde mailverzending niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd
 * en geslikt.
 */
export async function recordMailDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = OUTBOUND_MAIL_CHANNEL,
): Promise<void> {
  try {
    await prisma.mailDeliveryHeartbeat.upsert({
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
      source: "mail-delivery-heartbeat",
      requestPath: `/mail/${channel}`,
    });
  }
}

/**
 * Registreert dat een e-mailverzending via een echt kanaal zojuist MISLUKTE: markeert het kanaal als
 * afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een
 * AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte bounce). Bewaart nooit het adres/onderwerp
 * of de foutinhoud — alleen tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten (zelfde reden als hierboven): de oproeper heeft de echte verzendfout al in
 * handen en logt die PII-veilig; deze registratie is best-effort.
 */
export async function recordMailDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = OUTBOUND_MAIL_CHANNEL,
): Promise<void> {
  try {
    await prisma.mailDeliveryHeartbeat.upsert({
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
      source: "mail-delivery-heartbeat",
      requestPath: `/mail/${channel}`,
    });
  }
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
  try {
    const row = await prisma.mailDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateMailDeliveryFreshness(
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
      source: "mail-delivery-heartbeat",
      requestPath: `/mail/${channel}`,
    });
    return evaluateMailDeliveryFreshness(null, now);
  }
}
