// ORT — onregelmatigheidstoeslagen (zorg). Pure rekenmotor: berekent toeslag bovenop het
// basisuurtarief per tijdscategorie (avond/nacht/zaterdag/zondag/feestdag). Integer-centen,
// percentages in bps; CONFIGUREERBAAR per CAO (zie config.ts, overschrijfbaar per opdracht).
// Plugt in op de cascade: het subtotaal van een goedgekeurde prestatie = basis + toeslagen,
// daarna pas BTW (vat.ts). Geld loopt nooit via het platform (Besluit 1) — dit is enkel berekening.

import { type OrtCategory, DEFAULT_ORT_RATES_BPS } from "@/lib/config";

/** Een gewerkte categorie; "NORMAL" = geen toeslag. */
export type OrtSegmentCategory = OrtCategory | "NORMAL";

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
