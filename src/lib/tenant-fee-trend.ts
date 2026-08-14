// Fee-per-maand trend voor de bemiddelaar (FRANCHISER). De "Jouw fee"-kaart op /inzicht toont alleen
// een all-time totaal; deze pure helper leidt uit de reeds geladen omzettrend (doorgezet volume per
// maand, `getTenantRevenueTrend`) de fee per maand af — zodat de bemiddelaar zijn kern-P&L over tijd
// ziet (spiegel van de ZZP'er "Winst per maand"). Geen extra query, geen schema-wijziging.
//
// Deterministisch en puur (geschikt voor unit-tests zonder DB). Geld in integer-centen. De fee per
// maand wordt per maand afgerond via dezelfde `computeTenantFee` als het totaal — het maand-totaal is
// dus de som van de per-maand-afgeronde fees (kan door afronding een cent afwijken van
// `computeTenantFee(totaalVolume)`; bewust, want elke getoonde balk is zelf afgerond).

import { computeTenantFee } from "./tenant-fee";
import { type RevenueTrend } from "./revenue-trend";

export interface TenantFeeMonth {
  /** Sleutel "YYYY-MM", overgenomen uit de omzettrend. */
  key: string;
  /** Kort NL-maandlabel, bv. "jan". */
  label: string;
  /** Fee in centen over het doorgezette volume van die maand (afgerond). */
  feeCents: number;
  /** Doorgezet volume in centen van die maand (bron voor de fee). */
  volumeCents: number;
}

export interface TenantFeeTrend {
  /** Fee per maand, in dezelfde volgorde/venster als de omzettrend. */
  series: TenantFeeMonth[];
  /** Som van de per-maand-afgeronde fees over het venster. */
  totalFeeCents: number;
  /** Som van het doorgezette volume over het venster. */
  totalVolumeCents: number;
  /** Aantal maanden in het venster. */
  months: number;
  /** Is er in het venster fee te tonen (feePercent > 0 én volume > 0)? */
  hasData: boolean;
  /**
   * Procentuele verandering van de fee van de laatste maand t.o.v. de voorlaatste.
   * `null` als er < 2 maanden zijn of de voorlaatste maand geen fee had.
   */
  deltaPct: number | null;
}

/**
 * Bouwt de fee-per-maand trend uit een omzettrend + het ingestelde fee-percentage.
 * Puur: geen I/O. Bij `feePercent <= 0` levert elke maand fee 0 en `hasData` false.
 */
export function buildTenantFeeTrend(trend: RevenueTrend, feePercent: number): TenantFeeTrend {
  const series: TenantFeeMonth[] = trend.series.map((m) => ({
    key: m.key,
    label: m.label,
    volumeCents: m.cents,
    feeCents: computeTenantFee(m.cents, feePercent),
  }));

  const totalFeeCents = series.reduce((sum, m) => sum + m.feeCents, 0);
  const totalVolumeCents = series.reduce((sum, m) => sum + m.volumeCents, 0);
  const hasData = series.some((m) => m.feeCents > 0);

  const last = series.at(-1);
  const prev = series.at(-2);
  const deltaPct =
    last && prev && prev.feeCents > 0
      ? Math.round(((last.feeCents - prev.feeCents) / prev.feeCents) * 100)
      : null;

  return {
    series,
    totalFeeCents,
    totalVolumeCents,
    months: series.length,
    hasData,
    deltaPct,
  };
}
