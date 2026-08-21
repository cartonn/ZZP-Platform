// Sorteren van opdrachten op startdatum (ZZP'er): "wat kan ik het eerst oppakken?". Pure,
// deterministische functie — server-side de waarheid. Anders dan een platte `startDate asc` denkt
// deze sortering vanuit *nu*: opdrachten die binnenkort starten komen bovenaan (soonste eerst),
// daarna opdrachten waarvan de startdatum al voorbij is maar die nog openstaan (meest recent
// gestart eerst — het dichtst bij nu), en tot slot opdrachten zonder startdatum. Zo krijgt een
// ZZP'er die een gat in de agenda wil vullen bovenaan de eerstvolgende inzet.
//
// Benchmark: shift-/klusplatformen (Temper/Zorgwerk) laten kandidaten sorteren op "start binnenkort";
// dat vertalen we naar onze opdrachtenlijst zonder de matchsortering (de kern-differentiator) te raken.

export interface StartSortJob<T> {
  job: T;
  /** Startdatum van de opdracht; `null` = geen datum bekend (sorteert achteraan). */
  startDate: Date | null;
  /** Publicatiemoment; tie-break bij gelijke startdatum (nieuwer eerst). Null telt als "oudst". */
  publishedAt: Date | null;
  /** Stabiele identiteit; laatste tie-break zodat de volgorde volledig deterministisch is. */
  id: string;
}

/** UTC-middernacht in ms — startdatums vergelijken we op hele dagen (geen klok-/TZ-ruis). */
function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function publishedTime(d: Date | null): number {
  return d ? d.getTime() : 0;
}

// Categorie bepaalt de hoofdvolgorde: aankomend (0) vóór voorbij (1) vóór ongedateerd (2).
function category(startDate: Date | null, todayMs: number): 0 | 1 | 2 {
  if (!startDate) return 2;
  return utcMidnightMs(startDate) >= todayMs ? 0 : 1;
}

/**
 * Sorteert opdrachten op startdatum vanuit `now`. Muteert de invoer niet (werkt op een kopie).
 * Volgorde:
 *  1. Aankomende starts, oplopend (soonste eerst).
 *  2. Voorbije starts, aflopend (meest recent gestart eerst — dichtst bij nu).
 *  3. Opdrachten zonder startdatum.
 * Binnen dezelfde startdatum: nieuwst gepubliceerd eerst, dan op id (volledig deterministisch).
 */
export function sortJobsByStart<T>(jobs: StartSortJob<T>[], now: Date): T[] {
  const todayMs = utcMidnightMs(now);
  return [...jobs]
    .sort((a, b) => {
      const catA = category(a.startDate, todayMs);
      const catB = category(b.startDate, todayMs);
      if (catA !== catB) return catA - catB;

      if (catA === 0 || catA === 1) {
        const sa = utcMidnightMs(a.startDate!);
        const sb = utcMidnightMs(b.startDate!);
        // Aankomend: oplopend (soonste eerst). Voorbij: aflopend (recentst eerst).
        if (sa !== sb) return catA === 0 ? sa - sb : sb - sa;
      }

      const pub = publishedTime(b.publishedAt) - publishedTime(a.publishedAt);
      if (pub !== 0) return pub;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map((s) => s.job);
}
