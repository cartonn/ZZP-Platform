// Voorstel-conflictsignaal: waarschuw de opdrachtgever wanneer de voorgestelde
// samenwerkingsperiode overlapt met een periode die de ZZP'er zélf op "niet beschikbaar" heeft
// gezet (`AvailabilityWindow` met type UNAVAILABLE). Zonder dit signaal doet de opdrachtgever een
// voorstel dat de ZZP'er alsnog moet afwijzen — een verspilde ronde voor beide partijen.
//
// Zuiver en deterministisch: geen I/O, geen tijd (buiten de expliciete `now`-parameter), muteert
// niets. Server-side blijft de waarheid — beschikbaarheid is een advies-signaal, geen harde poort:
// de ZZP'er beslist zelf bij het accepteren. Deze helper toont alleen, beslist nooit over toegang.

/**
 * Eén door de ZZP'er als onbeschikbaar gemarkeerde periode, klaar om naar de client te sturen. De
 * ISO-datums (yyyy-mm-dd) maken een tijdzone-veilige, lexicografische vergelijking mogelijk; de
 * labels zijn server-side voorberekend zodat de client geen datum hoeft te formatteren.
 */
export interface UnavailableWindow {
  /** Startdatum yyyy-mm-dd (inclusief). */
  startISO: string;
  /** Einddatum yyyy-mm-dd (inclusief). */
  endISO: string;
  /** Weergavelabel voor de start (bv. "15 aug"). */
  startLabel: string;
  /** Weergavelabel voor het einde (bv. "20 aug"). */
  endLabel: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True als `value` een geldig ogend ISO-datumformaat yyyy-mm-dd is. */
export function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === "string" && ISO_DATE.test(value);
}

/**
 * Bepaalt welke onbeschikbaarheidsvensters overlappen met de voorgestelde periode
 * [startISO, endISO]. Omdat yyyy-mm-dd lexicografisch én chronologisch gelijk sorteert, volstaat
 * stringvergelijking — geen `Date`-constructie, geen tijdzonevalkuil.
 *
 * - Een leeg/ongeldig `startISO` → geen conflict (er is nog niets ingevuld om tegen te toetsen).
 * - Een leeg/ongeldig `endISO` → de periode is één dag op de startdatum (conservatief: we
 *   waarschuwen niet voor een onbekende, mogelijk open looptijd). Een `endISO` vóór `startISO`
 *   (ongeldige range die de server-Zod alsnog afkeurt) valt terug op de startdatum.
 * - Inclusieve overlap: [a1,a2] en [b1,b2] overlappen als a1 ≤ b2 && b1 ≤ a2.
 *
 * Retourneert de overlappende vensters, gesorteerd op startISO (bij gelijkheid endISO) voor
 * determinisme. Muteert de invoer niet.
 */
export function proposalDateConflicts(
  startISO: string,
  endISO: string,
  windows: readonly UnavailableWindow[],
): UnavailableWindow[] {
  if (!isIsoDate(startISO)) return [];
  const effectiveEnd = isIsoDate(endISO) && endISO >= startISO ? endISO : startISO;

  return windows
    .filter((w) => isIsoDate(w.startISO) && isIsoDate(w.endISO))
    .filter((w) => startISO <= w.endISO && w.startISO <= effectiveEnd)
    .sort((a, b) =>
      a.startISO === b.startISO
        ? a.endISO.localeCompare(b.endISO)
        : a.startISO.localeCompare(b.startISO),
    );
}
