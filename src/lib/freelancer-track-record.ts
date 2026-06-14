// Track record (feitelijke staat van dienst) van een individuele ZZP'er.
//
// Drempelkeuze: een net-gestarte ZZP'er pronkt nooit met magere "0"-cijfers of een
// enkel uurtje werk. Onder de drempel draagt het vertrouwensniveau en de geverifieerde
// certificaten het vertrouwen. Drempels:
//   - Samenwerkingen: >= 1 (één afgeronde klus is al een concreet feit waard om te tonen).
//   - Uren: Math.round(approvedHours) >= 8 (minimaal ~één werkdag; minder zegt weinig).

import { pluralWord } from "@/lib/plural";

export interface FreelancerTrackRecord {
  /** Aantal COMPLETED samenwerkingen. */
  completedCollaborations: number;
  /** Som van goedgekeurde HOURS-uren (mag float zijn). */
  approvedHours: number;
}

export interface TrackRecordHighlight {
  /** Het te tonen gehele getal. */
  value: number;
  /** NL-label, meervoud al toegepast (bv. "afgeronde klussen", "uur gewerkt"). */
  label: string;
}

/**
 * Bepaalt welke track-record hoogtepunten getoond worden voor een ZZP'er.
 * Pure functie — geen I/O, unit-testbaar zonder database.
 *
 * Volgorde: afgeronde samenwerkingen eerst, daarna gewerkte uren.
 */
export function trackRecordHighlights(record: FreelancerTrackRecord): TrackRecordHighlight[] {
  const out: TrackRecordHighlight[] = [];

  if (record.completedCollaborations >= 1) {
    out.push({
      value: record.completedCollaborations,
      label: `afgeronde ${pluralWord(record.completedCollaborations, "klus", "klussen")}`,
    });
  }

  const roundedHours = Math.round(record.approvedHours);
  if (roundedHours >= 8) {
    out.push({
      value: roundedHours,
      label: "uur gewerkt",
    });
  }

  return out;
}
