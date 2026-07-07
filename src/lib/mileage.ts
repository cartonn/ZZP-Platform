// Reiskosten-declaratie: bouwt uit een aantal kilometers × een tarief per kilometer een correcte
// factuurregel voor de ZZP'er. Puur en deterministisch — geen I/O, geen neveneffecten. Vertaalt
// Bendy's "declarabele kilometers" naar onze bestaande factuurregel-vorm (quantity × unitCents),
// zodat een reiskosten-regel exact zo verwerkt wordt als elke andere regel (geen schema- of
// cascadewijziging). De server blijft de waarheid: de client toont/voorinvult, de bestaande
// createInvoice-actie herberekent en valideert elke regel opnieuw.

import { formatEuro, invoiceCentsWithinInt4 } from "./invoices";

// Grenzen die aansluiten op invoiceLineSchema (quantity: int 1..100000, unitCents: 0..100_000_000).
// Kilometers zijn hele eenheden (quantity), het tarief per km in centen.
export const MILEAGE_MIN_KM = 1;
export const MILEAGE_MAX_KM = 100_000;
export const MILEAGE_MAX_RATE_CENTS = 100_000_000;

export interface MileageInput {
  /** Aantal gereden kilometers (hele eenheden). */
  kilometers: number;
  /** Tarief per kilometer in centen (bijv. 23 = € 0,23). */
  ratePerKmCents: number;
}

export interface MileageLine {
  /** Nette, zelf-uitleggende omschrijving voor op de factuur. */
  description: string;
  /** Aantal kilometers = quantity van de factuurregel. */
  kilometers: number;
  /** Tarief per km in centen = unitCents van de factuurregel. */
  ratePerKmCents: number;
  /** kilometers × ratePerKmCents, server-berekend. */
  amountCents: number;
}

export type MileageResult = { ok: true; line: MileageLine } | { ok: false; error: string };

/** Is dit een geheel, eindig getal binnen [min, max]? */
function isWholeInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Bouwt een reiskosten-factuurregel. Weigert niet-hele/negatieve/te grote invoer met een duidelijke
 * NL-reden, zodat de client nooit een ongeldige regel kan voorinvullen die de server toch afkeurt.
 * Het bedrag wordt hier berekend puur als preview; de bestaande factuuractie herberekent het bij
 * opslaan (server-side waarheid).
 */
export function buildMileageLine(input: MileageInput): MileageResult {
  const { kilometers, ratePerKmCents } = input;

  if (!isWholeInRange(kilometers, MILEAGE_MIN_KM, MILEAGE_MAX_KM)) {
    return {
      ok: false,
      error: `Vul een aantal kilometers in tussen ${MILEAGE_MIN_KM} en ${MILEAGE_MAX_KM}.`,
    };
  }
  if (!isWholeInRange(ratePerKmCents, 0, MILEAGE_MAX_RATE_CENTS)) {
    return { ok: false, error: "Vul een geldig tarief per kilometer in." };
  }

  const amountCents = kilometers * ratePerKmCents;
  // De losse grenzen (km × tarief) laten samen een bedrag boven de int4-factuurkolom toe → klem het.
  if (!invoiceCentsWithinInt4(amountCents)) {
    return { ok: false, error: "Het reiskostenbedrag is te hoog (maximaal € 21.474.836)." };
  }
  const description = `Reiskosten — ${kilometers} km × ${formatEuro(ratePerKmCents)}/km`;

  return { ok: true, line: { description, kilometers, ratePerKmCents, amountCents } };
}

/** Centen naar een schone euro-decimaalstring voor het tarief-invoerveld (bijv. 23 → "0.23"). */
export function centsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
