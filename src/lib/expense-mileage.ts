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
