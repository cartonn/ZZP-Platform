// Single source of truth voor "welke beveiligingsincidenten tellen als OPEN (onopgelost) per
// severity". De bewakingsmotor (src/lib/monitoring/detectors.ts + runMonitorTask) detecteert
// anomalieën (inlog-burst, wachtwoordreset-flood, rolwijziging-burst, dependency-CVE) en persisteert
// ze als HealthIncident met status OPEN. De ack-/resolve-flow (/admin/bewaking) haalt ze daar weer uit.
//
// De /api/metrics-scrape telt hiermee de OPEN incidenten per alarmeerbare severity, zodat een externe
// monitor (Prometheus/Alertmanager) kan pagen zodra het platform ZÉLF een beveiligingsincident
// detecteert — i.p.v. dat het onzichtbaar in de DB blijft tot een admin op /admin/bewaking inlogt.
// Dat is de dead-man's-switch-tegenhanger voor de eigen detector.
//
// Deze module is PUUR (geen Prisma/HTTP/klok): ze levert alleen de where-vorm. De metrics-route
// hergebruikt exact deze builder voor de `count`, zodat de gauge de echte OPEN-set telt en niet kan
// driften t.o.v. wat de UI en de retentie-cron als incident beschouwen.

import type { IncidentSeverity } from "@/lib/enums";

/**
 * De severities waarop we via /api/metrics pagen. INFO-incidenten dragen context maar zijn geen
 * page-conditie — die exposen we bewust NIET als eigen gauge (geen ruis). WARN en CRITICAL wél:
 * CRITICAL paget snel (brute-force / kritieke CVE), WARN vraagt triage.
 */
export const ALERTABLE_INCIDENT_SEVERITIES = [
  "CRITICAL",
  "WARN",
] as const satisfies readonly IncidentSeverity[];

export type AlertableIncidentSeverity = (typeof ALERTABLE_INCIDENT_SEVERITIES)[number];

/**
 * De Prisma-where voor OPEN (nog niet getriageerde) incidenten van één severity. Bewust alleen status
 * `OPEN`: zodra een admin het incident ACKNOWLEDGED (een mens is ermee bezig) of RESOLVED, stopt de
 * page — de gauge telt precies wat nog niemand heeft opgepakt.
 */
export function openHealthIncidentWhere(severity: AlertableIncidentSeverity) {
  return { status: "OPEN", severity } as const;
}
