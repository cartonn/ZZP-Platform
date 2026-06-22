// Pure CSV-opbouw voor de admin-export van het audit-log (AVG-verantwoording / bedrijfsbezoek).
// Geen DB-/server-import: neemt al uitgelezen audit-rijen en levert deterministische CSV-tekst via
// de canonieke `toCsv`-kern. De route (server) leest de rijen en past dezelfde filters toe als het
// audit-paneel; deze module bepaalt enkel de kolommen en de tekstvorm.

import { toCsv } from "@/lib/csv";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";
import { formatAuditMetadata } from "@/lib/audit-metadata";

/** Eén audit-regel zoals nodig voor de export — losgekoppeld van het Prisma-model. */
export interface AuditExportEntry {
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  metadata: string | null;
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

/** Volledige CSV-tekst (kop + rijen) voor de audit-export. */
export function auditExportCsv(entries: readonly AuditExportEntry[]): string {
  return toCsv([AUDIT_EXPORT_HEADER, ...auditExportRows(entries)]);
}
