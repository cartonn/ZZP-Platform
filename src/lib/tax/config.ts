// Fiscale parameters (Nederland) — INDICATIEF 2026. Dit zijn richtwaarden voor de
// ontzorg-berekeningen (schatting/reservering), GEEN fiscaal advies en GEEN aangifte.
// De definitieve cijfers volgen uit de aangifte/aanslag. Waarden zijn bewust hier
// geconcentreerd zodat ze per jaar bijgewerkt kunnen worden (wetgeving wijzigt).
//
// Bronnen: Belastingdienst box 1-schijven, ondernemersaftrek en Zvw (peildatum 2026).

/** Belastingjaar waarvoor deze parameters gelden. */
export const TAX_YEAR = 2026;

/** Urencriterium: minimaal aantal uren per jaar voor zelfstandigen-/startersaftrek. */
export const URENCRITERIUM_HOURS = 1225;

/** Zelfstandigenaftrek (€), aftrekbaar bij gehaald urencriterium. Indicatief 2026. */
export const ZELFSTANDIGENAFTREK_CENTS = 120000; // €1.200

/** Startersaftrek (€), bovenop de zelfstandigenaftrek; max 3x in 5 jaar. Indicatief 2026. */
export const STARTERSAFTREK_CENTS = 212300; // €2.123

/** MKB-winstvrijstelling: percentage van de winst NA ondernemersaftrek (geen urencriterium). */
export const MKB_WINSTVRIJSTELLING_BPS = 1270; // 12,70%

/** KOR-omzetgrens (€) — kleineondernemersregeling. */
export const KOR_THRESHOLD_CENTS = 2000000; // €20.000
/** EU-KOR-omzetgrens (€) — EU-breed. */
export const EU_KOR_THRESHOLD_CENTS = 10000000; // €100.000

/**
 * Box 1-schijven (gecombineerd loonbelasting + premies volksverzekeringen), INDICATIEF 2026
 * voor wie de AOW-leeftijd nog niet heeft bereikt. De daadwerkelijke heffing hangt af van de
 * persoonlijke situatie (AOW, heffingskortingen) die het platform niet volledig kent.
 */
export interface TaxBracket {
  upToCents: number | null; // null = bovenste schijf (geen plafond)
  rateBps: number;
}
export const BOX1_BRACKETS: readonly TaxBracket[] = [
  { upToCents: 3844100, rateBps: 3582 }, // tot €38.441 → 35,82%
  { upToCents: 7681700, rateBps: 3748 }, // €38.441–€76.817 → 37,48%
  { upToCents: null, rateBps: 4950 }, // daarboven → 49,50%
];

/** Zvw-bijdrage (inkomensafhankelijke bijdrage Zorgverzekeringswet) over de winst, met plafond. */
export const ZVW_RATE_BPS = 526; // 5,26% (indicatief 2026)
export const ZVW_MAX_GRONDSLAG_CENTS = 7565600; // grondslagplafond ±€75.656 (indicatief 2026)

/**
 * Reserveringsrichtlijn voor het "zet opzij"-signaal: percentage van de winst-tot-nu dat
 * een ZZP'er gemiddeld kwijt is aan IB + Zvw. Bewust conservatief; de echte radar verfijnt
 * dit met BOX1_BRACKETS. Geen geldstroom via het platform (Besluit 1) — louter signaal.
 */
export const INCOME_RESERVE_DEFAULT_BPS = 3500; // 35% vuistregel-bovengrens

/** BTW-aangiftedeadlines: de laatste dag van de maand ná het kwartaal. */
export const VAT_DEADLINES_2026: Record<1 | 2 | 3 | 4, string> = {
  1: "2026-04-30",
  2: "2026-07-31",
  3: "2026-10-31",
  4: "2027-01-31",
};

/** Disclaimer-lijn voor alle fiscale schermen (zelfde register als DBA_DISCLAIMER). */
export const TAX_DISCLAIMER =
  "Dit is een indicatieve berekening ter voorbereiding, geen fiscaal advies en geen aangifte. " +
  "De definitieve cijfers volgen uit je aangifte en aanslag. Laat dit zo nodig door een boekhouder controleren.";
