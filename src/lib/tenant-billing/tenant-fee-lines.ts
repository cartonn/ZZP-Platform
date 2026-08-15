// Per-samenwerking fee-regels voor het bemiddeling-facturatie-overzicht (ADR-0006 E). Puur: geen I/O,
// geen DB. De data-laag (`getTenantFeeLines`) levert de al tenant-gescopete regels; hier worden ze
// gesorteerd en naar CSV geserialiseerd. Zo ziet de bemiddelaar niet alleen de totalen maar ook
// wélke samenwerking / opdrachtgever / ZZP'er elke transactie-fee genereerde, en kan hij het
// fee-grootboek exporteren voor de eigen boekhouding.

import { type CollaborationFeeStatus } from "@/lib/enums";
import { toCsv } from "@/lib/csv";

/** Eén geregistreerde transactie-fee, verrijkt met de partijen achter de samenwerking. */
export interface TenantFeeLine {
  collaborationId: string;
  /** Opdrachttitel (samenwerking → job). */
  jobTitle: string;
  /** Naam van de opdrachtgever (bedrijf). */
  clientName: string;
  /** Naam van de ZZP'er, of null als het profiel geen naam heeft. */
  freelancerName: string | null;
  feeCents: number;
  vatCents: number;
  status: CollaborationFeeStatus;
  recordedAt: Date;
}

const STATUS_CSV_LABEL: Record<CollaborationFeeStatus, string> = {
  PENDING: "Openstaand",
  INVOICED: "Gefactureerd",
};

/** UI-label voor een fee-status (gedeeld met het paneel). */
export function tenantFeeStatusLabel(status: CollaborationFeeStatus): string {
  return STATUS_CSV_LABEL[status];
}

/**
 * Sorteert fee-regels nieuwste-eerst (op `recordedAt`), met een stabiele tie-break op
 * `collaborationId` zodat de volgorde deterministisch is bij gelijke tijdstempels — geen
 * flappende rijen tussen requests. Muteert de invoer niet.
 */
export function sortTenantFeeLines(lines: readonly TenantFeeLine[]): TenantFeeLine[] {
  return [...lines].sort((a, b) => {
    const delta = b.recordedAt.getTime() - a.recordedAt.getTime();
    if (delta !== 0) return delta;
    return a.collaborationId < b.collaborationId
      ? -1
      : a.collaborationId > b.collaborationId
        ? 1
        : 0;
  });
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Serialiseert de fee-regels naar CSV via de gedeelde CSV-kern (`toCsv`/`escapeCsvField`), inclusief
 * de formule-injectie-beveiliging (CWE-1236): vrije tekst (opdrachttitel, bedrijfs-/ZZP'er-naam) van
 * derden belandt in de spreadsheet van de bemiddelaar; een cel die met = + - @ begint zou anders als
 * formule kunnen worden uitgevoerd. Regels worden nieuwste-eerst geordend, identiek aan het scherm.
 */
export function exportTenantFeesCsv(lines: readonly TenantFeeLine[]): string {
  const header = [
    "Opdracht",
    "Opdrachtgever",
    "ZZP'er",
    "Status",
    "Fee (EUR)",
    "Btw (EUR)",
    "Vastgelegd op",
  ];
  const rows = sortTenantFeeLines(lines).map((l) => [
    l.jobTitle,
    l.clientName,
    l.freelancerName ?? "",
    STATUS_CSV_LABEL[l.status],
    fmtEur(l.feeCents),
    fmtEur(l.vatCents),
    fmtDate(l.recordedAt),
  ]);
  return toCsv([header, ...rows]);
}
