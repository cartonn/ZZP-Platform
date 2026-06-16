/**
 * Pure geometrie voor een segment-donut (meerdere statussen in één ring). Los van React getest,
 * net als `sparkline.ts` en `bi-geometry.ts`. Elk segment is een SVG-cirkel met een `dasharray`
 * (zichtbare boog + rest) en een rotatie zodat het op de juiste plek in de ring begint.
 */

export interface DonutSegment {
  /** Geclampte (≥0) waarde van het segment. */
  value: number;
  /** Aandeel in procenten (0..100, afgerond). */
  pct: number;
  /** Lengte van de zichtbare boog, voor `stroke-dasharray`. */
  dash: number;
  /** Resterende (lege) lengte, voor `stroke-dasharray`. */
  gap: number;
  /** Rotatie in graden t.o.v. 12-uur (start van dit segment in de ring). */
  rotation: number;
}

export interface DonutLayout {
  /** Som van de (geclampte) waarden. */
  total: number;
  segments: DonutSegment[];
}

/**
 * Verdeelt `values` over een ring met omtrek `circumference`. De segmenten sluiten op elkaar aan
 * (cumulatieve rotatie) en starten op 12-uur. Bij total = 0 krijgen alle segmenten een nul-boog.
 * Negatieve waarden tellen als nul (aantallen zijn nooit negatief).
 */
export function donutSegments(values: number[], circumference: number): DonutLayout {
  const safe = values.map((v) => Math.max(0, v));
  const total = safe.reduce((sum, v) => sum + v, 0);
  let accFrac = 0;
  const segments = safe.map((value) => {
    const frac = total > 0 ? value / total : 0;
    const dash = circumference * frac;
    const rotation = -90 + 360 * accFrac;
    accFrac += frac;
    return { value, pct: Math.round(frac * 100), dash, gap: circumference - dash, rotation };
  });
  return { total, segments };
}
