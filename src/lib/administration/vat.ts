// BTW-berekening (PLATFORM_OVERHAUL.md §5). Pure functies, integer-centen, geen floats.
// Af te dragen BTW bij de uitschrijver, voorbelasting bij de ontvanger, BTW over de fee apart.
// Verschillende tarieven + verlegd/vrijgesteld als configuratie-optie (zie config.ts).

import { VAT_RATE_BPS, regimeChargesVat, type VatRegime } from "@/lib/config";
import { hoursTimesRateCents } from "@/lib/administration/hourly-cents";

export interface VatBreakdown {
  subtotalCents: number; //  bedrag exclusief BTW
  vatRegime: VatRegime;
  vatRateBps: number; //     toegepast tarief in basispunten
  vatCents: number; //       BTW-bedrag (0 bij verlegd/vrijgesteld/nul)
  totalCents: number; //     subtotaal + BTW
}

/**
 * Berekent de BTW over een subtotaal in centen volgens het regime. Rondt commercieel af
 * (halve cent omhoog) op hele centen. Bij verlegd/vrijgesteld/nul is de BTW 0.
 */
export function computeVat(subtotalCents: number, regime: VatRegime): VatBreakdown {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error(`Ongeldig subtotaal in centen: ${subtotalCents}`);
  }
  const vatRateBps = VAT_RATE_BPS[regime];
  const vatCents = regimeChargesVat(regime) ? Math.round((subtotalCents * vatRateBps) / 10000) : 0;
  return {
    subtotalCents,
    vatRegime: regime,
    vatRateBps,
    vatCents,
    totalCents: subtotalCents + vatCents,
  };
}

/** Subtotaal voor uurtarief: uren × uurtarief (beide bron-eenheden, resultaat in centen). */
export function hourlySubtotalCents(hours: number, hourlyRateCents: number): number {
  if (hours < 0 || hourlyRateCents < 0) throw new Error("Uren en tarief mogen niet negatief zijn.");
  // Exacte commerciële afronding in integer-ruimte (geen IEEE-754-halvecent-drift). Zie hourly-cents.ts.
  return hoursTimesRateCents(hours, hourlyRateCents);
}

/** Een creditregel is de tegenboeking: zelfde regime, negatief subtotaal. */
export function creditVat(original: VatBreakdown): VatBreakdown {
  return computeVatNegated(original);
}

function computeVatNegated(b: VatBreakdown): VatBreakdown {
  return {
    subtotalCents: -b.subtotalCents,
    vatRegime: b.vatRegime,
    vatRateBps: b.vatRateBps,
    vatCents: -b.vatCents,
    totalCents: -b.totalCents,
  };
}
