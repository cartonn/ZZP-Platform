// Triage-splitsing van de acute (nu aandacht vragende) open diensten van de bemiddelaar op
// /franchise/diensten. De "Wat dreigt onbezet"-kaart vertelt de bemiddelaar al WELKE diensten
// urgent zijn (deze week, verstreken start, of geen startdatum), maar niet OF hij ze uit zijn
// eigen roster kan oplossen of extern moet werven — precies de eerstvolgende beslissing. Dit
// combineert twee bestaande, geteste engines: de acuutheid uit de dekkingsprognose en het
// vulbaar-signaal per dienst (`readyMatches` uit `dienst-fill-signal.ts`). Een dienst is "direct
// vulbaar" zodra er ≥1 geschikte, vrij-inzetbare roster-vakmens klaarstaat om voor te dragen.
//
// Pure functie — geen DB/IO, deterministisch, los unit-getest. De aanroeper levert per acute
// dienst het al-berekende vulbaar-signaal; hier bucketen we alleen. Geen nieuwe rekenlogica, geen
// nieuwe drempel (leunt op READY_MATCH_MIN_SCORE uit het fill-signal). Read-only.

import { plural } from "@/lib/plural";

/** Eén acute open dienst met zijn al-berekende vulbaar-signaal (readyMatches ≥ 0). */
export interface AcuteFillabilityItem {
  /** Aantal geschikte, vrij-inzetbare roster-matches (readyMatches uit het dienst-fill-signal). */
  readyMatches: number;
}

export interface AcuteFillabilitySummary {
  /** Totaal aantal acute open diensten. */
  total: number;
  /** Acute diensten met ≥1 direct voordraagbare match uit het eigen roster. */
  fillableNow: number;
  /** Acute diensten zonder geschikte vrije match → externe werving nodig. */
  needsRecruiting: number;
}

/**
 * Splitst de acute open diensten in "direct vulbaar uit je roster" (≥1 geschikte vrije match) en
 * "werving nodig" (geen enkele geschikte vrije match). Lege input → alle tellers 0. Negatieve of
 * ontbrekende `readyMatches` worden defensief als 0 (= niet vulbaar) behandeld.
 */
export function summarizeAcuteFillability(
  items: readonly AcuteFillabilityItem[],
): AcuteFillabilitySummary {
  let fillableNow = 0;
  for (const it of items) {
    if ((it.readyMatches ?? 0) > 0) fillableNow += 1;
  }
  const total = items.length;
  return { total, fillableNow, needsRecruiting: total - fillableNow };
}

/**
 * Eén samenvattende regel onder de acute-lijst die de bemiddelaar direct de volgende stap geeft.
 * `null` als er geen acute diensten zijn (dan toont de kaart al "alles gedekt"). Drie eerlijke
 * uitkomsten: alles vulbaar (dragen kan nu), niets vulbaar (werven), of gemengd (het aantal per kant).
 */
export function acuteFillabilityHeadline(summary: AcuteFillabilitySummary): string | null {
  const { total, fillableNow, needsRecruiting } = summary;
  if (total === 0) return null;
  if (fillableNow === total) {
    return total === 1
      ? "Direct vulbaar uit je roster — voordragen kan nu."
      : `Alle ${total} direct vulbaar uit je roster — voordragen kan nu.`;
  }
  if (fillableNow === 0) {
    return total === 1
      ? "Niet uit je eigen roster te vullen — werving nodig."
      : `Geen van deze ${total} is uit je eigen roster te vullen — werving nodig.`;
  }
  return `${fillableNow} direct vulbaar uit je roster · ${plural(
    needsRecruiting,
    "dienst vraagt",
    "diensten vragen",
  )} werving.`;
}
