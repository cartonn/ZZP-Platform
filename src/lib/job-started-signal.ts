// Tijd-signaal voor een opdracht waarvan de startdatum al verstreken is terwijl de opdracht nog
// gepubliceerd staat. Waar `jobStartProximity` alleen de aankomende start toont (en `null` teruggeeft
// zodra de start voorbij is), markeert dit signaal juist het verleden: een nog-open opdracht die al had
// moeten beginnen betekent voor de ZZP'er een sterke "direct te starten / hoge inhuurkans"-kans (de
// opdrachtgever zoekt met spoed iemand die nú kan). Puur en testbaar; geen I/O. Werkt op UTC-middernacht
// zodat "N dagen geleden" stabiel is, los van het lokale tijdstip.

/**
 * Voorbij deze horizon zwijgt het signaal: een opdracht die weken geleden had moeten starten en nog
 * altijd open staat is vermoedelijk een vergeten/verouderde plaatsing — die als "direct te starten"
 * markeren zou misleiden en de lijst vervuilen.
 */
export const JOB_STARTED_RECENT_DAYS = 30;

export interface JobStartedSignal {
  /** Hele UTC-dagen sinds de startdatum (altijd ≥ 1). */
  days: number;
  /** Compacte chip-tekst, identiek op lijst én detail (geen drift). */
  label: string;
  /** Volledige zin voor de nudge op het opdracht-detail. */
  detail: string;
}

function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Vertaalt een verstreken startdatum naar een "direct te starten"-signaal t.o.v. `now`. Geeft `null`
 * wanneer er geen startdatum is, de start vandaag of in de toekomst ligt (dat is het domein van
 * `jobStartProximity`), of de start verder in het verleden ligt dan de horizon — in al die gevallen is
 * er niets zinvols te markeren.
 */
export function jobStartedSignal(
  startDate: Date | null | undefined,
  now: Date,
  horizonDays: number = JOB_STARTED_RECENT_DAYS,
): JobStartedSignal | null {
  if (!startDate) return null;
  const days = Math.round((utcMidnightMs(now) - utcMidnightMs(startDate)) / 86_400_000);
  if (days < 1 || days > horizonDays) return null;
  return {
    days,
    label: "Direct te starten",
    detail:
      days === 1
        ? "De startdatum was gisteren — je kunt direct beginnen."
        : `De startdatum was ${days} dagen geleden — je kunt direct beginnen.`,
  };
}
