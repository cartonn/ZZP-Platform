// Cron-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de dagelijkse
// geplande-taken-cron (POST /api/tasks/run-all) recent genoeg heeft gedraaid. De cron voert de
// verloopdetectie, betaal-/DBA-/factuur-herinneringen, abonnement-verval en auditlog-retentie uit
// (zie src/app/api/tasks/run-all/route.ts). Stopt hij stil — workflow uit, secret geroteerd,
// RUN_ALL_TASK_URL fout, host-storing — dan draaien die runners niet meer terwijl niets dat toont.
// Deze module levert het staleness-oordeel; de opslag/DB-kant zit in cron-heartbeat.ts.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (lastRunAt, lastOk, now, maxAgeHours) → oordeel.

import type { StatusItem, StatusLevel } from "@/lib/system-status";

/**
 * - `never`   : nog nooit een heartbeat geregistreerd (cron heeft nog niet gedraaid, of is nooit
 *               geconfigureerd). Vóór livegang een aandachtspunt: geplande taken lopen nog niet.
 * - `fresh`   : laatste run binnen het venster én zonder taakfouten.
 * - `warning` : laatste run binnen het venster, maar ten minste één taak faalde tijdens die run.
 * - `stale`   : laatste (geslaagde of gefaalde) run ligt langer dan het venster terug — de cron
 *               lijkt gestopt; geplande taken draaien vermoedelijk niet meer.
 */
export type CronFreshnessStatus = "never" | "fresh" | "warning" | "stale";

export interface CronFreshness {
  status: CronFreshnessStatus;
  /** Tijdstip van de laatst geregistreerde run, of null als er nog nooit één was. */
  lastRunAt: Date | null;
  /** Draaide de laatste run zónder taakfouten? null als er nog nooit een run was. */
  lastOk: boolean | null;
  /** Leeftijd van de laatste run in hele uren (afgerond naar beneden), of null. */
  ageHours: number | null;
  /** Het geconfigureerde maximale venster in uren. */
  maxAgeHours: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Beoordeelt de cron-heartbeat. Robuust tegen een klok-scheefstand: een run "in de toekomst"
 * (negatieve leeftijd) wordt als leeftijd 0 behandeld, nooit als stale.
 */
export function evaluateCronFreshness(
  lastRunAt: Date | null,
  lastOk: boolean | null,
  now: Date,
  maxAgeHours: number,
): CronFreshness {
  if (!lastRunAt) {
    return { status: "never", lastRunAt: null, lastOk: null, ageHours: null, maxAgeHours };
  }

  const rawMs = now.getTime() - lastRunAt.getTime();
  const ageMs = rawMs > 0 ? rawMs : 0;
  const ageHours = Math.floor(ageMs / MS_PER_HOUR);

  let status: CronFreshnessStatus;
  if (ageMs > maxAgeHours * MS_PER_HOUR) {
    status = "stale";
  } else if (lastOk === false) {
    status = "warning";
  } else {
    status = "fresh";
  }

  return { status, lastRunAt, lastOk, ageHours, maxAgeHours };
}

/** Mensvriendelijke leeftijd ("3 uur", "1 uur", "< 1 uur") — puur voor de detailtekst. */
function humanAge(ageHours: number): string {
  if (ageHours < 1) return "< 1 uur";
  return `${ageHours} uur`;
}

const LEVEL_BY_STATUS: Record<CronFreshnessStatus, StatusLevel> = {
  fresh: "ok",
  warning: "attention",
  stale: "attention",
  never: "attention",
};

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items,
 * zodat de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen —
 * alleen tijdstippen en het oordeel.
 */
export function cronFreshnessStatusItem(freshness: CronFreshness): StatusItem {
  const { status, ageHours, maxAgeHours } = freshness;

  if (status === "never") {
    return {
      key: "cron-heartbeat",
      label: "Geplande-taken-cron (laatste run)",
      mode: "nooit gedraaid",
      level: "attention",
      detail:
        "De geplande-taken-cron (/api/tasks/run-all) heeft nog niet gedraaid. Verloopdetectie, " +
        "herinneringen, abonnement-verval en auditlog-retentie lopen pas na de eerste run. " +
        "Configureer de cron (MENSENWERK §10) en draai 'm éénmaal handmatig.",
    };
  }

  const age = ageHours === null ? "onbekend" : humanAge(ageHours);

  if (status === "stale") {
    return {
      key: "cron-heartbeat",
      label: "Geplande-taken-cron (laatste run)",
      mode: `${age} geleden`,
      level: "attention",
      detail:
        `De cron heeft al langer dan ${maxAgeHours} uur niet gedraaid — de geplande taken ` +
        "(verloopdetectie, herinneringen, abonnement-verval, auditlog-retentie) lopen vermoedelijk " +
        "niet meer. Controleer de cron-workflow en de secrets (RUN_ALL_TASK_URL/CRON_SECRET).",
    };
  }

  if (status === "warning") {
    return {
      key: "cron-heartbeat",
      label: "Geplande-taken-cron (laatste run)",
      mode: `${age} geleden`,
      level: "attention",
      detail:
        `De cron draaide ${age} geleden, maar ten minste één taak faalde tijdens die run. ` +
        "Controleer de server-logs (of Sentry, indien geconfigureerd) op de gefaalde runner.",
    };
  }

  return {
    key: "cron-heartbeat",
    label: "Geplande-taken-cron (laatste run)",
    mode: `${age} geleden`,
    level: LEVEL_BY_STATUS[status],
    detail:
      `De geplande-taken-cron draaide ${age} geleden zonder taakfouten (venster: ${maxAgeHours} uur). ` +
      "Verloopdetectie, herinneringen, abonnement-verval en auditlog-retentie zijn actueel.",
  };
}
