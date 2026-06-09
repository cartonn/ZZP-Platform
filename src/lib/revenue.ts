/**
 * Maandelijkse omzetreeks voor de dashboard-sparkline. Puur en deterministisch:
 * groepeert factuurbedragen per kalendermaand (Europe/Amsterdam) over de laatste
 * `months` maanden t/m de maand van `now`. Omzet volgt de factuurdatum
 * (issuedAt), zoals in de administratie — niet de betaaldatum.
 */
export interface RevenueSource {
  occurredAt: Date;
  totalCents: number;
}

export interface RevenueMonth {
  /** Sleutel "YYYY-MM" in Europe/Amsterdam. */
  key: string;
  /** Korte NL-maandlabel, bv. "jan". */
  label: string;
  cents: number;
}

const KEY_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
});
const LABEL_FORMAT = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  month: "short",
});

function monthKey(d: Date): string {
  // sv-SE geeft "YYYY-MM" — stabiel sorteerbaar.
  return KEY_FORMAT.format(d);
}

export function monthlyRevenue(rows: RevenueSource[], now: Date, months = 6): RevenueMonth[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.occurredAt);
    totals.set(key, (totals.get(key) ?? 0) + row.totalCents);
  }
  const result: RevenueMonth[] = [];
  // Loop van oud naar nieuw; de 15e als anker vermijdt maandgrens-/zomertijdrandjes.
  const anchor = new Date(`${monthKey(now)}-15T12:00:00Z`);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = monthKey(d);
    result.push({
      key,
      label: LABEL_FORMAT.format(d).replace(".", ""),
      cents: totals.get(key) ?? 0,
    });
  }
  return result;
}

/** Procentuele verandering t.o.v. de vorige maand; null zonder vergelijkbare basis. */
export function monthDeltaPct(series: RevenueMonth[]): number | null {
  const prev = series.at(-2);
  const cur = series.at(-1);
  if (!prev || !cur || prev.cents <= 0) return null;
  return Math.round(((cur.cents - prev.cents) / prev.cents) * 100);
}
