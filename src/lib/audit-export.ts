// Pure CSV-opbouw voor de admin-export van het audit-log (AVG-verantwoording / bedrijfsbezoek).
// Geen DB-/server-import: neemt al uitgelezen audit-rijen en levert deterministische CSV-tekst via
// de canonieke `toCsv`-kern. De route (server) leest de rijen en past dezelfde filters toe als het
// audit-paneel; deze module bepaalt enkel de kolommen en de tekstvorm.

import { toCsv } from "@/lib/csv";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";
import { formatAuditMetadata } from "@/lib/audit-metadata";

// Defensieve bovengrens: het audit-log groeit onbegrensd; we exporteren de meest recente rijen.
// Eén bron van waarheid, gedeeld door de export-route (het cappen zelf) én het audit-paneel (de
// vooraf-waarschuwing bij de knop) zodat de belofte en de werkelijkheid nooit uiteenlopen.
export const AUDIT_EXPORT_CAP = 10000;

/** Eén audit-regel zoals nodig voor de export — losgekoppeld van het Prisma-model. */
export interface AuditExportEntry {
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  metadata: string | null;
}

/**
 * Telling van de export: hoeveel regels zijn er geschreven (`exported`, na de cap) versus hoeveel
 * voldeden er aan het filter (`total`, vóór de cap). Voedt zowel de truncatie-melding als de
 * bestandsnaam, zodat een admin de CSV nooit onbedoeld als volledig audit-bewijs presenteert.
 */
export interface AuditExportSummary {
  exported: number;
  total: number;
}

/** True zodra de export minder regels bevat dan er in totaal aan het filter voldeden. */
export function isAuditExportTruncated(summary: AuditExportSummary): boolean {
  return summary.total > summary.exported;
}

/**
 * Sluit-rij die expliciet meldt dat de export getrunceerd is — of `null` bij een volledig register.
 * De melding staat volledig in de eerste kolom (de overige cellen blijven leeg) zodat de rij
 * onmiskenbaar géén echte audit-gebeurtenis is en bij openen direct in het oog springt.
 */
export function auditExportTruncationRow(summary: AuditExportSummary): string[] | null {
  if (!isAuditExportTruncated(summary)) return null;
  const remaining = summary.total - summary.exported;
  const notice =
    `LET OP — export getrunceerd: alleen de ${summary.exported} meest recente van ` +
    `${summary.total} gebeurtenissen zijn opgenomen. Verfijn het filter op actie of entiteit om ` +
    `de resterende ${remaining} te zien.`;
  // Even lang als de kop zodat het een geldige CSV-rij blijft (parseerbaar, niet corrupt).
  return [notice, ...AUDIT_EXPORT_HEADER.slice(1).map(() => "")];
}

/** Kolomkop van de audit-export (NL); bevat zowel de ruwe code als de leesbare omschrijving. */
export const AUDIT_EXPORT_HEADER = [
  "Tijdstip",
  "Actie",
  "Actie-omschrijving",
  "Entiteit",
  "Entiteit-omschrijving",
  "Entiteit-ID",
  "Actor",
  "Details",
] as const;

/** Zet audit-regels om naar CSV-rijen (zonder kop), in dezelfde volgorde als ze binnenkomen. */
export function auditExportRows(entries: readonly AuditExportEntry[]): string[][] {
  return entries.map((e) => [
    e.createdAt.toISOString(),
    e.action,
    auditActionLabel(e.action),
    e.entityType,
    auditEntityLabel(e.entityType),
    e.entityId,
    e.actorName ?? "systeem",
    formatAuditMetadata(e.metadata),
  ]);
}

/**
 * Volledige CSV-tekst (kop + rijen) voor de audit-export. Met een `summary` die truncatie aangeeft
 * wordt een expliciete sluit-rij toegevoegd; zonder (of bij een volledig register) blijft de
 * uitvoer byte-identiek aan een export zónder melding.
 */
export function auditExportCsv(
  entries: readonly AuditExportEntry[],
  summary?: AuditExportSummary,
): string {
  const truncationRow = summary ? auditExportTruncationRow(summary) : null;
  return toCsv([
    AUDIT_EXPORT_HEADER,
    ...auditExportRows(entries),
    ...(truncationRow ? [truncationRow] : []),
  ]);
}

/**
 * Bestandsnaam voor de audit-export: `audit-log-<datum>.csv`, met het achtervoegsel
 * `-getrunceerd` zodra de export niet volledig is — zodat de onvolledigheid al aan de bestandsnaam
 * zichtbaar is (los van of iemand de CSV opent).
 */
export function auditExportFilename(now: Date, summary?: AuditExportSummary): string {
  const date = now.toISOString().slice(0, 10);
  const truncated = summary ? isAuditExportTruncated(summary) : false;
  return `audit-log-${date}${truncated ? "-getrunceerd" : ""}.csv`;
}
