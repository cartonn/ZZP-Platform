// ORT-uitsplitsing voor exports/overzichten: splitst een urenstaat naar reguliere vs
// ORT-uren en basis vs toeslag, zodat een CSV afstembaar is tegen een CAO-loonstrook.
// Puur — bouwt uitsluitend op de canonieke `computeOrt`-motor (geen eigen rekenregels),
// dus kan het niet driften van het factuursubtotaal.

import { computeOrt, type OrtSegment } from "@/lib/ort";
import { type OrtCategory } from "@/lib/config";

export interface OrtBreakdown {
  /** Uren tegen het basistarief (NORMAL-segmenten, of alle uren als er geen ORT-segmenten zijn). */
  normalHours: number;
  /** Uren met een onregelmatigheidstoeslag (alle niet-NORMAL segmenten). */
  ortHours: number;
  /** Basisbedrag in centen (uren × basistarief, zonder toeslag). */
  baseCents: number;
  /** Totale onregelmatigheidstoeslag in centen. */
  surchargeCents: number;
}

export const EMPTY_ORT_BREAKDOWN: OrtBreakdown = {
  normalHours: 0,
  ortHours: 0,
  baseCents: 0,
  surchargeCents: 0,
};

/**
 * Splitst een urenstaat uit naar reguliere/ORT-uren en basis/toeslag.
 *
 * - Met ORT-segmenten: NORMAL-uren tellen als regulier, alle overige categorieën als ORT;
 *   bedragen komen uit `computeOrt` (identiek aan het factuursubtotaal → geen drift).
 * - Zonder segmenten maar met platte uren × tarief: alles regulier, geen toeslag.
 * - Zonder bruikbaar uurtarief (bv. een milestone): leeg (`EMPTY_ORT_BREAKDOWN`).
 */
export function summarizeOrtBreakdown(opts: {
  segments: readonly OrtSegment[] | null | undefined;
  hours: number | null | undefined;
  rateCents: number | null | undefined;
  rates?: Record<OrtCategory, number>;
}): OrtBreakdown {
  const { segments, hours, rateCents, rates } = opts;
  if (rateCents == null) return EMPTY_ORT_BREAKDOWN;

  if (segments && segments.length > 0) {
    const result = computeOrt(segments, rateCents, rates);
    let normalHours = 0;
    let ortHours = 0;
    for (const line of result.lines) {
      if (line.category === "NORMAL") normalHours += line.hours;
      else ortHours += line.hours;
    }
    return {
      normalHours,
      ortHours,
      baseCents: result.baseCents,
      surchargeCents: result.surchargeCents,
    };
  }

  if (hours != null) {
    return {
      normalHours: hours,
      ortHours: 0,
      baseCents: Math.round(hours * rateCents),
      surchargeCents: 0,
    };
  }

  return EMPTY_ORT_BREAKDOWN;
}
