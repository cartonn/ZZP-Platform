// Belastingreservering-radar — "hoeveel moet je opzij zetten?". Pure, in hele centen.
// GEEN geldstroom via het platform (Besluit 1): dit is uitsluitend een rekenkundig signaal.
// De ZZP'er houdt het bedrag zelf op een externe (spaar)rekening.

import { estimateIncomeTax, type ProfitInput } from "@/lib/tax/income-tax";

export interface ReservationInput extends ProfitInput {
  /** Saldo van de lopende BTW-aangifte (af te dragen − voorbelasting), in centen. */
  currentVatBalanceCents: number;
}

export interface ReservationAdvice {
  /** 100% van het lopende BTW-saldo (alleen als er per saldo moet worden afgedragen). */
  vatReserveCents: number;
  /** Geschatte IB+Zvw over de winst-tot-nu. */
  incomeReserveCents: number;
  /** Totaal aan te houden reservering. */
  totalReserveCents: number;
  /** Reservering als percentage van de winst (transparantie). */
  reserveRateBps: number;
}

/**
 * Berekent het aan te houden reserveringsbedrag: het volledige af te dragen BTW-saldo plus
 * de geschatte inkomstenbelasting + Zvw over de winst tot nu toe. Een negatief BTW-saldo
 * (terug te ontvangen) telt als nul reservering (je hoeft niets opzij te zetten voor BTW).
 */
export function reservationAdvice(input: ReservationInput): ReservationAdvice {
  const vatReserveCents = Math.max(0, input.currentVatBalanceCents);
  const incomeReserveCents = estimateIncomeTax(input).totalCents;
  const totalReserveCents = vatReserveCents + incomeReserveCents;
  const reserveRateBps =
    input.profitCents > 0 ? Math.round((totalReserveCents / input.profitCents) * 10000) : 0;
  return { vatReserveCents, incomeReserveCents, totalReserveCents, reserveRateBps };
}

/**
 * "Beschikbaar om uit te keren" = winst-tot-nu minus de aan te houden reservering, met een
 * ondergrens van nul. Geeft de ZZP'er in één getal wat écht van hem is.
 */
export function availableToWithdrawCents(profitCents: number, advice: ReservationAdvice): number {
  return Math.max(0, profitCents - advice.totalReserveCents);
}
