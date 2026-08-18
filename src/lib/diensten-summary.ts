// Diensten-samenvatting: pure aggregatie voor de ZZP'er-urenstatenlijst (`/diensten`).
//
// Spiegelbeeld van de opdrachtgever-kant (`summarizePendingApprovalValue` in `prestaties.ts`): waar de
// payer ziet hoeveel er op ZIJN goedkeuring wacht, ziet de ZZP'er hier hoeveel gewerkte waarde op de
// goedkeuring van de OPDRACHTGEVER wacht (geld dat vaststaat maar nog niet mag factureren), hoeveel al
// is goedgekeurd, en hoeveel concept-urenstaten nog moeten worden ingediend of hersteld.
//
// Puur — geen DB-aanroepen, geen extra query. Werkt op de reeds geladen `DienstSummary[]` uit
// `getDienstenForFreelancer`, zodat de strip niet kan driften van de lijst eronder.

import { type DienstSummary } from "@/lib/diensten";

export interface DienstenSummary {
  /** Somtotaal (netto, excl. BTW) van de urenstaten die op goedkeuring wachten (`SUBMITTED`). */
  awaitingApprovalCents: number;
  /** Aantal urenstaten dat op goedkeuring wacht (`SUBMITTED`). */
  awaitingApprovalCount: number;
  /** Hoeveel wachtende urenstaten (nog) geen berekenbaar subtotaal hebben (bv. ontbrekend uurtarief). */
  awaitingWithoutAmount: number;
  /** Somtotaal (netto, excl. BTW) van de reeds goedgekeurde urenstaten (`APPROVED`). */
  approvedCents: number;
  /** Aantal goedgekeurde urenstaten (`APPROVED`). */
  approvedCount: number;
  /** Aantal concept-urenstaten (`DRAFT`) — nog in te dienen. */
  draftCount: number;
  /** Aantal afgekeurde urenstaten (`REJECTED`) — te herstellen en opnieuw indienen. */
  rejectedCount: number;
}

/**
 * Vat de urenstaten van de ZZP'er samen naar de vier statussen die er in geld/actie toe doen.
 *
 * Een urenstaat zonder berekenbaar subtotaal (bv. ontbrekend uurtarief) telt niet mee in het
 * `awaitingApprovalCents`-bedrag maar wél in `awaitingWithoutAmount`, zodat het getoonde bedrag nooit
 * stilzwijgend een deel van de wachtrij onderschat — exact dezelfde afspraak als de opdrachtgever-kant.
 */
export function summarizeDiensten(rows: DienstSummary[]): DienstenSummary {
  const summary: DienstenSummary = {
    awaitingApprovalCents: 0,
    awaitingApprovalCount: 0,
    awaitingWithoutAmount: 0,
    approvedCents: 0,
    approvedCount: 0,
    draftCount: 0,
    rejectedCount: 0,
  };

  for (const d of rows) {
    switch (d.status) {
      case "SUBMITTED":
        summary.awaitingApprovalCount += 1;
        if (d.subtotalCents != null) {
          summary.awaitingApprovalCents += d.subtotalCents;
        } else {
          summary.awaitingWithoutAmount += 1;
        }
        break;
      case "APPROVED":
        summary.approvedCount += 1;
        if (d.subtotalCents != null) {
          summary.approvedCents += d.subtotalCents;
        }
        break;
      case "DRAFT":
        summary.draftCount += 1;
        break;
      case "REJECTED":
        summary.rejectedCount += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

/** Heeft de samenvatting iets te tonen? (Anders geen strip renderen — rustige lege staat.) */
export function hasDienstenSummary(summary: DienstenSummary): boolean {
  return (
    summary.awaitingApprovalCount > 0 ||
    summary.approvedCount > 0 ||
    summary.draftCount > 0 ||
    summary.rejectedCount > 0
  );
}
