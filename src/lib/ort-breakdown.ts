// ORT-uitsplitsing voor exports/overzichten: splitst een urenstaat naar reguliere vs
// ORT-uren en basis vs toeslag, zodat een CSV afstembaar is tegen een CAO-loonstrook.
// Puur — bouwt uitsluitend op de canonieke `computeOrt`-motor (geen eigen rekenregels),
// dus kan het niet driften van het factuursubtotaal.

import {
  computeOrt,
  ortSubtotalCents,
  parseOrtSegments,
  resolveOrtRates,
  type OrtSegment,
} from "@/lib/ort";
import { type OrtCategory } from "@/lib/config";
import { hoursTimesRateCents } from "@/lib/administration/hourly-cents";

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
      baseCents: hoursTimesRateCents(hours, rateCents),
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

/** De rauwe prestatie-velden die {@link computePerformanceOrt} nodig heeft om het live-subtotaal +
 * ORT-uitsplitsing af te leiden. Bewust los van het Prisma-rijtype zodat de mapping puur en zonder
 * database te testen valt. */
export interface PerformanceOrtRow {
  type: string;
  rateCents: number | null | undefined;
  hours: number | null | undefined;
  amountCents: number | null | undefined;
  /** Rauwe JSON-string uit `Performance.ortSegments` (wordt intern defensief geparsed). */
  ortSegments: string | null | undefined;
  ortProfile: string | null | undefined;
  ortCustomRates: string | null | undefined;
}

export interface PerformanceOrtComputation {
  /** Live-herberekend subtotaal (excl. BTW), of `null` zonder berekenbare basis. */
  subtotalCents: number | null;
  /** Heeft deze prestatie een geldige ORT-uitsplitsing (segmenten die de motor accepteert)? */
  hasOrt: boolean;
  ortBreakdown: OrtBreakdown;
}

/**
 * Leidt het live-subtotaal + de ORT-uitsplitsing van één prestatie-rij af — de gedeelde bron voor de
 * ZZP'er- (`/diensten`) én opdrachtgever-view (`/prestaties`), zodat beide overzichten voor dezelfde
 * prestatie niet uiteen kunnen lopen (geen duplicatie van de reken-takken).
 *
 * **Defensief (robuustheid):** `parseOrtSegments` vangt alleen een JSON-syntaxfout af; een JSON-geldig
 * maar semantisch corrupt segment (onbekende categorie, negatieve/niet-eindige uren) passeert de parse
 * en laat `computeOrt` alsnog throwen (`ort.ts` weigert dat — terecht: de geldmotor mag nooit stil een
 * NaN of negatief bedrag doorlaten). In de overzicht-mappers draaien deze mappers over álle rijen van
 * een gebruiker; zónder deze guard zou één corrupte rij (alleen bereikbaar via directe DB-corruptie —
 * elke schrijver grid-checkt via `assertPerformanceWithinLimits`) de héle `/diensten`/`/prestaties`-
 * pagina + CSV-export 500'en i.p.v. per rij te degraderen. Deze functie vangt dat per rij en valt terug
 * op de basis (uren × tarief), gemarkeerd als geen-ORT — precies wat de belendende "één corrupte rij mag
 * niet de héle pagina laten crashen"-comment belooft. De schrijf-/cascade-paden roepen `computeOrt`/
 * `ortSubtotalCents` rechtstreeks aan en blijven bewust fail-closed (weigeren corrupte invoer bij
 * persistentie).
 */
export function computePerformanceOrt(row: PerformanceOrtRow): PerformanceOrtComputation {
  const rates = resolveOrtRates({ ortProfile: row.ortProfile, ortCustomRates: row.ortCustomRates });
  const segments = parseOrtSegments(row.ortSegments);
  const hasOrtSegments = segments.length > 0;

  // De ORT-motor wordt alleen geraakt bij een HOURS-prestatie mét tarief én segmenten.
  if (row.type === "HOURS" && row.rateCents != null && hasOrtSegments) {
    try {
      const subtotalCents = ortSubtotalCents(segments, row.rateCents, rates);
      const ortBreakdown = summarizeOrtBreakdown({
        segments,
        hours: row.hours,
        rateCents: row.rateCents,
        rates,
      });
      return { subtotalCents, hasOrt: true, ortBreakdown };
    } catch {
      // Corrupt segment: degradeer naar de basis (uren × tarief) i.p.v. de pagina te laten crashen.
      const fallbackBase = row.hours != null ? hoursTimesRateCents(row.hours, row.rateCents) : null;
      return {
        subtotalCents: fallbackBase,
        hasOrt: false,
        ortBreakdown:
          fallbackBase != null
            ? {
                normalHours: row.hours as number,
                ortHours: 0,
                baseCents: fallbackBase,
                surchargeCents: 0,
              }
            : EMPTY_ORT_BREAKDOWN,
      };
    }
  }

  // Geen ORT-segmenten of geen HOURS-tarief: throw-vrije paden, ongewijzigd gedrag.
  let subtotalCents: number | null = null;
  if (row.type === "HOURS" && row.rateCents != null) {
    if (row.hours != null) subtotalCents = hoursTimesRateCents(row.hours, row.rateCents);
  } else if (row.type === "MILESTONE" && row.amountCents != null) {
    subtotalCents = row.amountCents;
  }

  const ortBreakdown = summarizeOrtBreakdown({
    segments,
    hours: row.hours,
    rateCents: row.type === "HOURS" ? row.rateCents : null,
    rates,
  });

  return { subtotalCents, hasOrt: hasOrtSegments, ortBreakdown };
}
