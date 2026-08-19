// CSV-export van de relatie-uitsplitsing op /inzicht: de ZZP'er exporteert zijn betaalde omzet per
// opdrachtgever (debiteuren per relatie), de opdrachtgever zijn betaalde uitgaven per ZZP'er
// (crediteuren per relatie) — het relatie-overzicht dat een boekhouder naast het per-factuur-register
// (@/lib/invoice-register-csv) vraagt. Eén rij per relatie: naam, bedrag, aandeel, aantal samenwerkingen.
//
// Pure functie: bouwt de CSV-tekst; de route levert hem als download. Bedragen in hele euro's met
// punt-decimaal, scheidingsteken ';' (gangbaar voor NL-Excel), via de gedeelde CSV-primitieven —
// inclusief de formule-injectie-beveiliging (CWE-1236) op vrije tekst (bedrijfs-/ZZP'er-namen van
// derden). De rijen komen al gesorteerd (bedrag aflopend) uit de breakdown → geen scherm↔export-drift.

import { centsToEuroPlain, toCsv } from "@/lib/administration/csv";

/** Eén relatie-rij: exact de velden die zowel de ZZP'er- als de opdrachtgever-uitsplitsing dragen. */
export interface RelationBreakdownCsvRow {
  /** Naam van de tegenpartij: opdrachtgever (ZZP'er-export) of ZZP'er (opdrachtgever-export). */
  name: string;
  /** Betaald bedrag over deze relatie (omzet resp. uitgaven), in integer-centen. */
  paidCents: number;
  /** Aandeel (0–100) van het totaal. */
  sharePct: number;
  /** Aantal samenwerkingen waarlangs betaald is. */
  placements: number;
}

/** Rol-afhankelijke kolomkoppen — de enige tekst die tussen de twee exports verschilt. */
export interface RelationBreakdownCsvLabels {
  /** Kop voor de relatiekolom: "Opdrachtgever" (ZZP'er) of "ZZP'er" (opdrachtgever). */
  relation: string;
  /** Kop voor de bedragkolom: "Omzet (EUR)" (ZZP'er) of "Uitgaven (EUR)" (opdrachtgever). */
  amount: string;
}

/**
 * Relatie-rijen → CSV met een vaste kop. Behoudt de aangeleverde volgorde (bedrag aflopend, zoals op
 * het scherm) zodat de export de kaart spiegelt. Muteert de invoer niet.
 */
export function relationBreakdownCsv(
  rows: readonly RelationBreakdownCsvRow[],
  labels: RelationBreakdownCsvLabels,
): string {
  const header = [labels.relation, labels.amount, "Aandeel (%)", "Samenwerkingen"];
  const body = rows.map((r) => [
    r.name,
    centsToEuroPlain(r.paidCents),
    String(r.sharePct),
    String(r.placements),
  ]);
  return toCsv([header, ...body]);
}
