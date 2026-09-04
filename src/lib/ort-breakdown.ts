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

/**
 * De bevroren factuur wint van de live-herberekening — **geen ORT-drift** (CLAUDE.md regel 1,
 * server-side waarheid). Het subtotaal van een prestatie wordt uit de ACTUELE ORT-toeslagen van de
 * samenwerking afgeleid op het moment van goedkeuren en dan bevroren in de factuur
 * (`Invoice.subtotalCents`, `performanceId @unique`). Die toeslagen mogen ná goedkeuring nog
 * wijzigen (`setOrtProfileAction` blokkeert alleen zolang een SUBMITTED-urenstaat wacht), terwijl de
 * factuur onveranderlijk is. Zodra een factuur is afgeleid is HAAR subtotaal de getoonde waarheid;
 * de ORT-toeslag reconciliëert daartegen (de basis is snapshot-stabiel — uren × het gesnapshotte
 * uurtarief —, dus `toeslag = factuursubtotaal − basis`). Zonder factuur blijven de live waarden de
 * bron. Puur; gedeeld door de opdrachtgever- (`/prestaties`) én ZZP'er-view (`/diensten`) zodat de
 * twee overzichten niet uiteen kunnen lopen op één en dezelfde prestatie.
 */
export function reconcileSubtotalWithInvoice(opts: {
  subtotalCents: number | null;
  ortBreakdown: OrtBreakdown;
  hasOrt: boolean;
  invoicedSubtotalCents: number | null | undefined;
}): { subtotalCents: number | null; ortBreakdown: OrtBreakdown } {
  const { subtotalCents, ortBreakdown, hasOrt, invoicedSubtotalCents } = opts;
  if (invoicedSubtotalCents == null) {
    return { subtotalCents, ortBreakdown };
  }
  return {
    subtotalCents: invoicedSubtotalCents,
    ortBreakdown: hasOrt
      ? { ...ortBreakdown, surchargeCents: invoicedSubtotalCents - ortBreakdown.baseCents }
      : ortBreakdown,
  };
}
