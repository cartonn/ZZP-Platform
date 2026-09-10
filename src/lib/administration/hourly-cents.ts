// Exacte factuurbasis voor "uren × uurtarief" in hele centen.
//
// PROBLEEM (GELD): `Math.round(hours * hourlyRateCents)` rekent met IEEE-754-drijvers. Kwartier-uren
// (0,25 / 0,5 / 0,75) zijn exact in float, maar een uren-waarde met sub-kwartier-decimalen (bv. 0,29 of
// 4,14 — die de server-validatie toelaat: `validatePerformanceForm` eist finite/`>0`/max, niet een
// kwartier-stap) kan het EXACTE product op een halve-cent-grens laten landen terwijl de
// float-representatie er net ONDER zit: `0,29 × 1750 = 507,4999…994` i.p.v. `507,5`. `Math.round` rondt
// dan naar BENEDEN (507 i.p.v. 508), waardoor de ZZP'er systematisch één cent te WEINIG gefactureerd
// krijgt — in strijd met de gedocumenteerde commerciële afronding ("halve cent omhoog"). Het defect
// raakt de PERSISTENTE factuur (`Invoice.subtotalCents` via `performanceSubtotalCents`) én elke
// preview/PDF die hetzelfde product toont.
//
// OPLOSSING: reken in integer-ruimte. Uren dragen per datamodel maximaal 2 decimalen — handmatige
// invoer is 2-decimaal, en `segmentsFromMinutes` (`src/lib/shift.ts`) rondt shift-afgeleide uren af op
// honderdsten. Normaliseren naar integer honderdsten-uur (`Math.round(hours * 100)`) herstelt dus exact
// de bedoelde waarde (óók voor een float als 1,67 = 1,6699…); `hoursHundredths × rateCents` is dan een
// exact geheel getal in honderdsten-cent, en `(… + 50) / 100` (geïntegereerd) doet een EXACTE
// round-half-up. Voor elke geldige 2-decimale invoer identiek aan de oude uitkomst, behalve precies op
// de eerder verkeerd-afgeronde halve-cent-grenzen. Puur/deterministisch.
//
// De maxima (`MAX_PERFORMANCE_HOURS` = 1000 → 100.000 honderdsten; `MAX_PERFORMANCE_RATE_CENTS` =
// 200.000) houden `hoursHundredths × rateCents` (≤ 2·10¹⁰) ruim binnen `Number.MAX_SAFE_INTEGER`.

/**
 * Factuurbasis in hele centen voor `uren × uurtarief`, met exacte commerciële afronding (halve cent
 * omhoog) in integer-ruimte — vrij van de IEEE-754-halvecent-drift van `Math.round(hours * rateCents)`.
 * Verwacht niet-negatieve invoer (de aanroepers borgen dat); een negatieve waarde zou hier fout
 * afronden en hoort niet voor te komen.
 */
export function hoursTimesRateCents(hours: number, hourlyRateCents: number): number {
  const hoursHundredths = Math.round(hours * 100);
  return Math.floor((hoursHundredths * hourlyRateCents + 50) / 100);
}

/**
 * Toetst of een uren-waarde exact op de cent-grid (honderdsten-uur) valt — de resolutie waarmee
 * `hoursTimesRateCents` de factuurbasis berekent (`Math.round(hours * 100)`). Uren met méér dan twee
 * decimalen (bv. 4,149 uit een geknutselde POST of een CSV-import) worden door de factuurmotor stil
 * geherkwantiseerd (4,149 → 4,15), waardoor de GETOONDE uren op de urenstaat/PDF/CSV afwijken van de
 * GEFACTUREERDE hoeveelheid. Met dit predikaat weigeren de aanroepers zulke invoer vóór persistentie,
 * zodat wat de ZZP'er/opdrachtgever ziet altijd één-op-één de factuur voedt (server-side waarheid).
 *
 * Float-veilig: een geldige 2-decimale waarde die als IEEE-754 nét onder/boven ligt (1,67 = 1,6699…997)
 * heeft `|hours·100 − round(hours·100)| ≈ 3·10⁻¹⁴`, ruim binnen de tolerantie; een derde decimaal geeft
 * een afstand van minimaal 0,1 in geschaalde ruimte en valt er ruim buiten. Verwacht een reeds-eindige,
 * niet-negatieve waarde (aanroepers checken finite/≥0 apart).
 */
export function isCentAccurateHours(hours: number): boolean {
  const scaled = hours * 100;
  return Math.abs(scaled - Math.round(scaled)) <= 1e-6;
}
