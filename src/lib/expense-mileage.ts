/**
 * Kilometerregistratie bij een zakelijke uitgave — pure domeinlogica (geen I/O, geen imports uit
 * prisma/next). Een ZZP'er die met eigen vervoer een zakelijke rit maakt, mag een vaste
 * kilometervergoeding als aftrekbare kostenpost boeken. Dat tarief is een netto-vergoeding: er zit
 * géén voorbelasting op (0% btw). Door de gereden kilometers op de uitgave vast te leggen ontstaat
 * een herleidbare rittenregistratie — de onderbouwing die de Belastingdienst bij deze aftrekpost
 * verwacht.
 *
 * Onderscheid met `mileage.ts`: die bouwt een reiskosten-FACTUURregel (opdrachtgever betaalt de rit,
 * vrij tarief). Deze module boekt de rit als eigen aftrekbare KOSTENPOST tegen het vaste wettelijke
 * tarief. Beide hergebruiken één bron voor tarief (`MILEAGE_RATE_CENTS`) en km-grens (`MILEAGE_MAX_KM`).
 *
 * Alle bedragen in hele centen (integers), spiegelt `expense.ts`.
 */

import { fiscalYearOf } from "@/lib/administration/fiscal-calendar";
import { MILEAGE_RATE_CENTS } from "@/lib/config";
import { MILEAGE_MAX_KM } from "@/lib/mileage";

export { MILEAGE_RATE_CENTS, MILEAGE_MAX_KM };

/**
 * Netto kostenbedrag (in centen) voor een aantal zakelijke kilometers tegen het vaste tarief.
 * Deterministisch afgerond (`Math.round`, spiegelt `vatCentsForRate`). Niet-eindige, niet-positieve
 * of te grote invoer → 0, zodat een leeg/ongeldig km-veld nooit een spookbedrag suggereert.
 */
export function mileageExpenseNetCents(km: number): number {
  if (!Number.isFinite(km) || km <= 0 || km > MILEAGE_MAX_KM) return 0;
  return Math.round(km * MILEAGE_RATE_CENTS);
}

/**
 * Valideert en normaliseert een km-invoer tot een positief geheel getal binnen de grens.
 * Retourneert `null` bij ongeldige/lege invoer zodat de caller een nette fout kan tonen; een rit van
 * 0 km heeft geen administratieve waarde en telt niet mee. Accepteert alleen hele kilometers (de
 * rittenregistratie rekent in hele km).
 */
export function parseExpenseKilometers(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const km = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(km) || km <= 0 || km > MILEAGE_MAX_KM) return null;
  return km;
}

/** Het vaste tarief als NL-euro-string voor de UI (bijv. "0,23"). */
export function mileageRateLabel(): string {
  return (MILEAGE_RATE_CENTS / 100).toFixed(2).replace(".", ",");
}

/** Minimale uitgave-vorm die de rittenregistratie nodig heeft. */
export interface MileageLike {
  occurredAt: Date;
  description: string;
  /** Vastgelegde zakelijke rit-km, of null/afwezig wanneer geen rit is geboekt. */
  kilometers?: number | null;
}

/** Eén rit in de rittenregistratie (afgeleid uit een reiskosten-uitgave met km). */
export interface MileageTrip {
  occurredAt: Date;
  description: string;
  kilometers: number;
  /** Km-aftrek in centen, canoniek afgeleid uit km × het vaste tarief (0% btw). */
  netCents: number;
}

/** Jaartotalen van de rittenregistratie. */
export interface MileageSummary {
  /** Aantal ritten met een geldig vastgelegd km-aantal. */
  tripCount: number;
  /** Totaal gereden zakelijke kilometers. */
  totalKm: number;
  /** Totale km-aftrek in centen (som van km × vast tarief per rit). */
  totalNetCents: number;
}

/**
 * Normaliseert een opgeslagen km-waarde tot een geldig geheel getal binnen de grens, of `null`.
 * Spiegelt de invoer-validatie (`parseExpenseKilometers`) zodat een ongeldige/te grote of niet-hele
 * waarde nooit in de rittenregistratie of het aftrektotaal terechtkomt.
 */
function normalizeKm(value: number | null | undefined): number | null {
  if (value == null || !Number.isInteger(value) || value <= 0 || value > MILEAGE_MAX_KM) {
    return null;
  }
  return value;
}

/**
 * Vat de vastgelegde zakelijke ritten samen (optioneel op kalenderjaar in Europe/Amsterdam — spiegelt
 * `summarizeExpenses`). Alleen uitgaven met een geldig km-aantal tellen mee; de km-aftrek wordt per rit
 * canoniek uit het km-aantal afgeleid (`mileageExpenseNetCents`), niet uit een los opgeslagen bedrag,
 * zodat het aftrektotaal niet kan driften. Puur, geen I/O.
 */
export function summarizeMileage(
  expenses: readonly MileageLike[],
  opts: { year?: number } = {},
): MileageSummary {
  let tripCount = 0;
  let totalKm = 0;
  let totalNetCents = 0;
  for (const e of expenses) {
    if (opts.year !== undefined && fiscalYearOf(e.occurredAt) !== opts.year) continue;
    const km = normalizeKm(e.kilometers);
    if (km === null) continue;
    tripCount += 1;
    totalKm += km;
    totalNetCents += mileageExpenseNetCents(km);
  }
  return { tripCount, totalKm, totalNetCents };
}

/**
 * Bouwt de rittenlijst (optioneel op kalenderjaar in Europe/Amsterdam) — één regel per zakelijke rit met de canonieke
 * km-aftrek. Recentste rit eerst (pariteit met de uitgavenlijst); stabiele tiebreak op omschrijving.
 * Puur, geen I/O.
 */
export function mileageTripLog(
  expenses: readonly MileageLike[],
  opts: { year?: number } = {},
): MileageTrip[] {
  const trips: MileageTrip[] = [];
  for (const e of expenses) {
    if (opts.year !== undefined && fiscalYearOf(e.occurredAt) !== opts.year) continue;
    const km = normalizeKm(e.kilometers);
    if (km === null) continue;
    trips.push({
      occurredAt: e.occurredAt,
      description: e.description,
      kilometers: km,
      netCents: mileageExpenseNetCents(km),
    });
  }
  return trips.sort(
    (a, b) =>
      b.occurredAt.getTime() - a.occurredAt.getTime() || a.description.localeCompare(b.description),
  );
}
