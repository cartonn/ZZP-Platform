// Tijd-signaal voor een opdracht: hoe dichtbij is de startdatum? Een opdracht die binnenkort
// begint vraagt eerder aandacht (de North Star: toon wat actie vraagt). Puur en testbaar; geen I/O.
// Werkt op UTC-middernacht zodat "over N dagen" stabiel is, los van het lokale tijdstip.

/** Toont het signaal alleen binnen deze horizon (verder weg = geen ruis op de lijst). */
export const JOB_START_SOON_DAYS = 14;

export interface JobStartProximity {
  /** Hele dagen tot de start (UTC-dagen); negatief = al begonnen. */
  days: number;
  /** Korte NL-tekst voor een chip, bv. "begint vandaag" of "begint over 3 dagen". */
  label: string;
  /** True zolang de start nog niet geweest is (vandaag of in de toekomst). */
  upcoming: boolean;
}

function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Vertaalt een startdatum naar een proximity-signaal t.o.v. `now`. Geeft `null` wanneer er geen
 * startdatum is, de start al voorbij is, of de start verder weg ligt dan de soon-horizon — in al
 * die gevallen is er niets urgents te tonen.
 */
export function jobStartProximity(
  startDate: Date | null | undefined,
  now: Date,
  horizonDays: number = JOB_START_SOON_DAYS,
): JobStartProximity | null {
  if (!startDate) return null;
  const days = Math.round((utcMidnightMs(startDate) - utcMidnightMs(now)) / 86_400_000);
  if (days < 0 || days > horizonDays) return null;
  const label =
    days === 0 ? "begint vandaag" : days === 1 ? "begint morgen" : `begint over ${days} dagen`;
  return { days, label, upcoming: true };
}
