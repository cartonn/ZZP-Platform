// Per-factuur reserveringshint — "hoeveel van déze factuur zet ik opzij voor de belasting?".
// Pure, deterministisch, in hele centen. GEEN geldstroom via het platform (Besluit 1): louter
// een rekenkundig signaal op het inn-moment. Dit is een bewust conservatieve vuistregel; het
// precieze, persoonlijke beeld staat op /ontzorgd (de radar verfijnt met BOX1_BRACKETS +
// werkelijke winst-tot-nu). Indicatief (zie TAX_DISCLAIMER).

import { INCOME_RESERVE_DEFAULT_BPS } from "@/lib/tax/config";

export interface InvoiceReserveInput {
  /** Netto-omzet van de factuur (excl. btw), in centen. */
  subtotalCents: number;
  /** Btw op de factuur (af te dragen aan de Belastingdienst), in centen. */
  vatCents: number;
  /**
   * Vuistregel-voet voor IB+Zvw over de netto-omzet (basispunten). Default de canonieke
   * `INCOME_RESERVE_DEFAULT_BPS`. Per factuur kennen we de kosten niet; we passen de voet daarom
   * toe op de netto-omzet i.p.v. de winst. Onbekende kosten verlagen de werkelijke heffing → dit
   * over-reserveert bewust (veilig). Wil de ZZP'er het precies: /ontzorgd.
   */
  incomeRateBps?: number;
}

export interface InvoiceReserveHint {
  /** Volledige btw van de factuur — hoort niet bij het inkomen, apart houden voor de aangifte. */
  vatReserveCents: number;
  /** Vuistregel IB+Zvw over de netto-omzet. */
  incomeReserveCents: number;
  /** Totaal aan te houden reservering voor deze factuur. */
  totalReserveCents: number;
  /** De gebruikte vuistregel-voet (basispunten), voor transparantie in de UI. */
  incomeRateBps: number;
}

/**
 * Berekent hoeveel van één factuur opzij te zetten: de volledige btw (die je int namens de
 * Belastingdienst) plus een conservatieve vuistregel voor IB+Zvw over de netto-omzet. Negatieve
 * invoer wordt op nul afgekapt.
 */
export function invoiceReserveHint(input: InvoiceReserveInput): InvoiceReserveHint {
  const incomeRateBps = input.incomeRateBps ?? INCOME_RESERVE_DEFAULT_BPS;
  const vatReserveCents = Math.max(0, Math.round(input.vatCents));
  const netCents = Math.max(0, Math.round(input.subtotalCents));
  const incomeReserveCents = Math.round((netCents * incomeRateBps) / 10000);
  const totalReserveCents = vatReserveCents + incomeReserveCents;
  return { vatReserveCents, incomeReserveCents, totalReserveCents, incomeRateBps };
}

/**
 * Bepaalt of de reserveringshint op de factuur-detailpagina hoort. Alleen voor de crediteur
 * (de ZZP'er zelf), alleen als de netto-/btw-uitsplitsing bekend is (cascade-facturen), en niet
 * voor teruggedraaide/geannuleerde omzet — daarvoor hoef je niets te reserveren.
 */
export function shouldShowInvoiceReserve(input: {
  isFreelancerOwner: boolean;
  subtotalCents: number | null;
  vatCents: number | null;
  status: string;
  lifecycleStatus: string | null;
}): boolean {
  if (!input.isFreelancerOwner) return false;
  if (input.subtotalCents == null || input.vatCents == null) return false;
  if (input.subtotalCents <= 0) return false;
  if (input.status === "CANCELLED") return false;
  if (input.lifecycleStatus === "CREDITED" || input.lifecycleStatus === "REJECTED") return false;
  return true;
}
