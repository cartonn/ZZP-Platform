/**
 * Pure geometrie voor de BI-primitives (gauge-ring + staafdiagram). Los van React getest,
 * net als `sparkline.ts` — de presentatie-componenten in `components/insight/bi.tsx` tekenen
 * alleen wat hier wordt berekend.
 */

export interface RingGeometry {
  /** Omtrek van de ring (2·π·r). */
  circumference: number;
  /** Lengte van de gevulde boog, voor `stroke-dasharray`. */
  dash: number;
  /** Resterende (lege) lengte, voor `stroke-dasharray`. */
  gap: number;
  /** Geclampte, afgeronde waarde in 0..100. */
  pct: number;
}

/**
 * Ring-geometrie voor een percentage-gauge. Clampt naar 0..100 en levert de
 * dash/gap voor een SVG-cirkel met de gegeven straal.
 */
export function ringGeometry(value: number, radius: number): RingGeometry {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * pct) / 100;
  return { circumference, dash, gap: circumference - dash, pct };
}

/**
 * Schaalt waarden naar staafhoogtes in px: de hoogste waarde wordt `maxHeight`, de rest
 * naar rato. Niet-nul waarden krijgen minstens `minHeight` zodat ze zichtbaar blijven; een
 * lege reeks of een reeks met alleen nullen levert nul-hoogtes (de staaf verdwijnt netjes).
 * Negatieve waarden worden als nul behandeld (omzet/aantallen zijn nooit negatief).
 */
export function barHeights(values: number[], maxHeight: number, minHeight = 3): number[] {
  const max = Math.max(0, ...values);
  if (max === 0) return values.map(() => 0);
  return values.map((v) => {
    if (v <= 0) return 0;
    return Math.max(minHeight, Math.round((v / max) * maxHeight));
  });
}

/**
 * Aandeel (0..100, afgerond) van `value` binnen `total`. Veilig bij total ≤ 0 (→ 0).
 */
export function sharePct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}
