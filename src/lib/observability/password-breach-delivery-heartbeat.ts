// Opslag-kant van de gelekt-wachtwoord-controle-aflever-heartbeat (dead-man's-switch). Schrijft/leest
// de uitkomst van de laatste échte HIBP-controle en levert het oordeel voor /admin/systeemstatus +
// /api/metrics. De pure beoordeling zit in password-breach-delivery-freshness.ts; hier alleen de
// DB-interactie.
//
// De registratie wordt aangeroepen door de HibpPasswordBreachChecker (password-breach.ts) rond élke
// controle via de echte HIBP-adapter. De noop-default registreert bewust niet (er wordt niets getoetst —
// geen productie-kanaal). Breach-controles gebeuren alleen bij het KIEZEN van een wachtwoord (registratie,
// wachtwoordherstel, wachtwoord wijzigen) — geen hot-path, dus één upsert per controle is verwaarloosbaar
// en er is (anders dan bij de rate-limit-store) geen coalescing nodig. De write is fail-open: een
// DB-storing hier mag een controle nooit alsnog laten falen.

import { prisma } from "@/lib/db";
import { reportError } from "@/lib/observability/report";
import {
  evaluatePasswordBreachDeliveryFreshness,
  type PasswordBreachDeliveryFreshness,
} from "@/lib/observability/password-breach-delivery-freshness";

/** Canonieke naam van het gelekt-wachtwoord-controle-kanaal (singleton-rij). */
export const PASSWORD_BREACH_CHANNEL = "password-breach";

/**
 * Registreert dat een gelekt-wachtwoord-controle via de echte HIBP-adapter zojuist SLAAGDE (HIBP gaf een
 * geldig antwoord, ongeacht of het wachtwoord gelekt bleek): markeert het kanaal als operationeel en zet
 * de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
 * geslaagde controle niet alsnog laten falen. Een schrijffout wordt gestructureerd gerapporteerd en
 * geslikt.
 */
export async function recordPasswordBreachDeliverySuccess(
  driver: string,
  now: Date = new Date(),
  channel: string = PASSWORD_BREACH_CHANNEL,
): Promise<void> {
  try {
    await prisma.passwordBreachDeliveryHeartbeat.upsert({
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
      source: "password-breach-delivery-heartbeat",
      requestPath: `/password-breach/${channel}`,
    });
  }
}

/**
 * Registreert dat een gelekt-wachtwoord-controle via de echte HIBP-adapter zojuist MISLUKTE (netwerkfout,
 * time-out, niet-ok respons, parsefout): markeert het kanaal als afwijzend en telt de
 * opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE storing kan alarmeren
 * i.p.v. op één transiënte blip). Bewaart nooit het wachtwoord/de hash of de foutinhoud — alleen tijdstip,
 * de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten: de controle heeft de fout al fail-open afgehandeld; deze registratie is
 * best-effort.
 */
export async function recordPasswordBreachDeliveryFailure(
  driver: string,
  now: Date = new Date(),
  channel: string = PASSWORD_BREACH_CHANNEL,
): Promise<void> {
  try {
    await prisma.passwordBreachDeliveryHeartbeat.upsert({
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
      source: "password-breach-delivery-heartbeat",
      requestPath: `/password-breach/${channel}`,
    });
  }
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
  try {
    const row = await prisma.passwordBreachDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluatePasswordBreachDeliveryFreshness(
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
      source: "password-breach-delivery-heartbeat",
      requestPath: `/password-breach/${channel}`,
    });
    return evaluatePasswordBreachDeliveryFreshness(null, now);
  }
}
