// Back-up-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de database-back-up
// recent genoeg geslaagd is. Een stil gestopt back-up-schema (job uit, credential verlopen,
// host-storing) is de gevaarlijkste prod-verrassing: niemand merkt het tot een herstel nodig is en de
// laatste bruikbare dump dagen oud blijkt. Deze module levert het staleness-oordeel als StatusItem;
// de opslag/DB-kant zit in backup-heartbeat.ts.
//
// De onderliggende staleness-rekenkern wordt gedeeld met de cron-heartbeat (identieke wiskunde:
// (lastRunAt, lastOk, now, maxAgeHours) → oordeel). Alleen de gebruikerstekst is back-up-specifiek.

import type { StatusItem, StatusLevel } from "@/lib/system-status";
import { evaluateCronFreshness, type CronFreshness } from "@/lib/observability/cron-freshness";

/** Beoordeelt de back-up-heartbeat. Zie evaluateCronFreshness voor de (gedeelde) staleness-regels. */
export function evaluateBackupFreshness(
  lastRunAt: Date | null,
  lastOk: boolean | null,
  now: Date,
  maxAgeHours: number,
): CronFreshness {
  return evaluateCronFreshness(lastRunAt, lastOk, now, maxAgeHours);
}

/** Mensvriendelijke leeftijd ("3 uur", "1 uur", "< 1 uur") — puur voor de detailtekst. */
function humanAge(ageHours: number): string {
  if (ageHours < 1) return "< 1 uur";
  return `${ageHours} uur`;
}

const LABEL = "Database-back-up (laatste geslaagde run)";

const LEVEL_BY_STATUS: Record<CronFreshness["status"], StatusLevel> = {
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
export function backupFreshnessStatusItem(freshness: CronFreshness): StatusItem {
  const { status, ageHours, maxAgeHours } = freshness;

  if (status === "never") {
    return {
      key: "backup-heartbeat",
      label: LABEL,
      mode: "nog nooit gemeld",
      level: "attention",
      detail:
        "Er is nog geen geslaagde database-back-up gemeld. Configureer een automatisch back-up-schema " +
        "(MENSENWERK §11) en laat je back-up-job na een geslaagde dump POST /api/backups/heartbeat " +
        "pingen (Bearer CRON_SECRET), zodat een stil gestopt schema hier zichtbaar wordt.",
    };
  }

  const age = ageHours === null ? "onbekend" : humanAge(ageHours);

  if (status === "stale") {
    return {
      key: "backup-heartbeat",
      label: LABEL,
      mode: `${age} geleden`,
      level: "attention",
      detail:
        `De laatste back-up-melding is al langer dan ${maxAgeHours} uur geleden — het back-up-schema ` +
        "lijkt gestopt. Zonder verse back-up is herstel na dataverlies onmogelijk. Controleer de " +
        "back-up-job en de databasedienst (EU-regio, RUNBOOK §5).",
    };
  }

  if (status === "warning") {
    return {
      key: "backup-heartbeat",
      label: LABEL,
      mode: `${age} geleden`,
      level: "attention",
      detail:
        `De laatste back-up-melding kwam ${age} geleden binnen, maar meldde een fout. Controleer de ` +
        "back-up-job (logs / databasedienst) — er is mogelijk geen bruikbare dump gemaakt.",
    };
  }

  return {
    key: "backup-heartbeat",
    label: LABEL,
    mode: `${age} geleden`,
    level: LEVEL_BY_STATUS[status],
    detail:
      `De laatste database-back-up slaagde ${age} geleden (venster: ${maxAgeHours} uur). Herstel na ` +
      "dataverlies is mogelijk vanaf een verse dump.",
  };
}
