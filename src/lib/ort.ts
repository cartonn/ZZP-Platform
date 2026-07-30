// ORT — onregelmatigheidstoeslagen (zorg). Pure rekenmotor: berekent toeslag bovenop het
// basisuurtarief per tijdscategorie (avond/nacht/zaterdag/zondag/feestdag). Integer-centen,
// percentages in bps; CONFIGUREERBAAR per CAO (zie config.ts, overschrijfbaar per opdracht).
// Plugt in op de cascade: het subtotaal van een goedgekeurde prestatie = basis + toeslagen,
// daarna pas BTW (vat.ts). Geld loopt nooit via het platform (Besluit 1) — dit is enkel berekening.

import {
  type OrtCategory,
  type OrtSector,
  DEFAULT_ORT_RATES_BPS,
  ORT_SECTOR_PROFILES,
  ORT_SECTORS,
  ORT_CATEGORIES,
  MAX_ORT_CUSTOM_BPS,
} from "@/lib/config";

/** Een gewerkte categorie; "NORMAL" = geen toeslag. */
export type OrtSegmentCategory = OrtCategory | "NORMAL";

/** Alle geldige segmentcategorieën (toeslag-categorieën + "NORMAL"). Bron: ORT_CATEGORIES. */
const VALID_SEGMENT_CATEGORIES: ReadonlySet<string> = new Set<string>([
  ...ORT_CATEGORIES,
  "NORMAL",
]);

export interface OrtSegment {
  category: OrtSegmentCategory;
  hours: number; //  mag kwartieren zijn (7,25)
}

export interface OrtLine {
  category: OrtSegmentCategory;
  hours: number;
  baseCents: number; //       uren × basistarief
  surchargeBps: number; //    toegepaste toeslag in bps (0 bij NORMAL)
  surchargeCents: number; //  toeslagbedrag
  totalCents: number; //      basis + toeslag
}

export interface OrtResult {
  baseCents: number; //      som basis (zonder toeslag)
  surchargeCents: number; // som toeslagen
  subtotalCents: number; //  basis + toeslagen (excl. BTW)
  lines: OrtLine[];
}

/**
 * Berekent basis + onregelmatigheidstoeslag per segment en de totalen. `rates` is per CAO
 * overschrijfbaar; default = DEFAULT_ORT_RATES_BPS. Commerciële afronding op hele centen.
 */
export function computeOrt(
  segments: readonly OrtSegment[],
  hourlyRateCents: number,
  rates: Record<OrtCategory, number> = DEFAULT_ORT_RATES_BPS,
): OrtResult {
  if (!Number.isInteger(hourlyRateCents) || hourlyRateCents < 0) {
    throw new Error(`Ongeldig uurtarief in centen: ${hourlyRateCents}`);
  }

  const lines: OrtLine[] = [];
  let baseCents = 0;
  let surchargeCents = 0;

  for (const seg of segments) {
    if (seg.hours < 0) throw new Error("Uren mogen niet negatief zijn.");
    if (!Number.isFinite(seg.hours)) throw new Error(`Ongeldig aantal uren: ${seg.hours}`);
    // Categorie-guard: een onbekende categorie zou `rates[cat]` = undefined geven en zo een
    // stille NaN in het toeslagbedrag → NaN-subtotaal → NaN de BTW/administratie in laten lekken.
    // Elke bestaande caller levert een categorie uit de vaste enum; deze guard borgt dat de pure
    // motor nooit stilzwijgend geld corrumpeert als ooit een nieuwe caller een rauwe categorie doorlaat.
    if (!VALID_SEGMENT_CATEGORIES.has(seg.category)) {
      throw new Error(`Onbekende ORT-categorie: ${seg.category}`);
    }
    const base = Math.round(seg.hours * hourlyRateCents);
    const surchargeBps = seg.category === "NORMAL" ? 0 : rates[seg.category];
    const surcharge = Math.round((base * surchargeBps) / 10000);
    lines.push({
      category: seg.category,
      hours: seg.hours,
      baseCents: base,
      surchargeBps,
      surchargeCents: surcharge,
      totalCents: base + surcharge,
    });
    baseCents += base;
    surchargeCents += surcharge;
  }

  return { baseCents, surchargeCents, subtotalCents: baseCents + surchargeCents, lines };
}

/** Het factuursubtotaal (excl. BTW) van een prestatie met ORT-segmenten. */
export function ortSubtotalCents(
  segments: readonly OrtSegment[],
  hourlyRateCents: number,
  rates?: Record<OrtCategory, number>,
): number {
  return computeOrt(segments, hourlyRateCents, rates).subtotalCents;
}

/**
 * Resolvt het ORT-tarievenprofiel voor een sector/klant. Onbekend of leeg → DEFAULT.
 * Server-side waarheid: de samenwerking bepaalt het profiel (Collaboration.ortProfile),
 * niet de client. Een opdrachtgever kan een maatwerkprofiel afspreken; dat slaat het
 * sectorprofiel over en wordt als expliciete `rates` aan computeOrt gegeven.
 */
export function ortRatesForSector(sector?: string | null): Record<OrtCategory, number> {
  if (sector && (ORT_SECTORS as readonly string[]).includes(sector)) {
    return ORT_SECTOR_PROFILES[sector as OrtSector];
  }
  return DEFAULT_ORT_RATES_BPS;
}

/**
 * Parse maatwerk-toeslagen (JSON Record<OrtCategory, bps>) veilig. Geldig = elke categorie een
 * niet-negatief geheel getal; anders null (dan valt de resolver terug op het sectorprofiel).
 */
export function parseOrtCustomRates(raw?: string | null): Record<OrtCategory, number> | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const out = {} as Record<OrtCategory, number>;
  for (const cat of ORT_CATEGORIES) {
    const v = obj[cat];
    // Bovengrens als defense-in-depth: de schrijver (setOrtProfileAction) begrenst al, maar
    // legacy of bewerkte rijen mogen geen absurde toeslag in de facturen laten doorwerken.
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_ORT_CUSTOM_BPS)
      return null;
    out[cat] = v;
  }
  return out;
}

/**
 * Resolvt de definitieve ORT-tarieven: maatwerk per klant gaat vóór het sectorprofiel, dat weer
 * vóór de standaardtarieven. Server-side waarheid (de samenwerking levert beide velden).
 */
export function resolveOrtRates(opts: {
  ortProfile?: string | null;
  ortCustomRates?: string | null;
}): Record<OrtCategory, number> {
  return parseOrtCustomRates(opts.ortCustomRates) ?? ortRatesForSector(opts.ortProfile);
}

/**
 * Parse een JSON-string naar een array van OrtSegment-objecten. Bij lege/ongeldige invoer wordt
 * een lege array teruggegeven (nooit null/undefined, zodat de aanroeper altijd een array krijgt).
 */
export function parseOrtSegments(json: string | null | undefined): OrtSegment[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as OrtSegment[];
  } catch {
    return [];
  }
}
