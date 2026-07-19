// Tarief-rekenhulp — de omgekeerde vraag van de marktband: "wat moet ik per uur
// vragen om netto € X over te houden?" Pure, deterministisch, in hele centen.
// INDICATIEF: dit schat op basis van de fiscale richtwaarden (zie tax/config.ts) en is
// geen fiscaal advies. Hergebruikt exact dezelfde IB/Zvw-motor als de ontzorg-berekeningen
// (estimateIncomeTax) zodat de schatting consistent is met de rest van het platform.

import { estimateIncomeTax } from "@/lib/tax/income-tax";
import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

export interface RateCalcInput {
  /** Gewenst netto jaarinkomen (ná geschatte IB + Zvw), in centen. */
  targetNetAnnualCents: number;
  /** Declarabele (factureerbare) uren per jaar. */
  billableHoursPerYear: number;
  /** Jaarlijkse aftrekbare zakelijke kosten, in centen. Default 0. */
  annualCostsCents?: number;
  /**
   * Voldoet aan het urencriterium (1.225 uur) → ondernemersaftrek van toepassing.
   * Default: afgeleid uit de declarabele uren (`>= URENCRITERIUM_HOURS`).
   */
  urencriteriumMet?: boolean;
  /** Recht op startersaftrek (max 3x in 5 jaar). Default false. */
  starter?: boolean;
}

export interface RateCalcResult {
  /** false bij ongeldige/onvolledige invoer (nul/negatief/niet-eindig). */
  ok: boolean;
  requiredProfitCents: number; //       benodigde winst (omzet − kosten)
  requiredRevenueCents: number; //      benodigde omzet (excl. btw)
  requiredHourlyRateCents: number; //   benodigd uurtarief (excl. btw)
  incomeTaxCents: number; //            geschatte IB + Zvw op die winst
  netAnnualCents: number; //            gerealiseerde netto (≈ doel)
  effectiveRateBps: number; //          heffing als % van de winst
  urencriteriumMet: boolean; //         gehanteerde aanname
}

const EMPTY: RateCalcResult = {
  ok: false,
  requiredProfitCents: 0,
  requiredRevenueCents: 0,
  requiredHourlyRateCents: 0,
  incomeTaxCents: 0,
  netAnnualCents: 0,
  effectiveRateBps: 0,
  urencriteriumMet: false,
};

function isPositiveFinite(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/**
 * Bereken het benodigde uurtarief om een netto-inkomensdoel te halen.
 *
 * De netto-functie `net(winst) = winst − heffing(winst)` is monotoon niet-dalend en
 * continu (stuksgewijs lineair via de box 1-schijven + ondernemersaftrek), dus de inverse
 * is met bisectie op hele centen exact te vinden. Vervolgens: omzet = winst + kosten en
 * uurtarief = omzet / declarabele uren (naar boven afgerond zodat het doel niet ondersneeuwt).
 */
export function requiredHourlyRate(input: RateCalcInput): RateCalcResult {
  const { targetNetAnnualCents, billableHoursPerYear } = input;
  if (!isPositiveFinite(targetNetAnnualCents) || !isPositiveFinite(billableHoursPerYear)) {
    return EMPTY;
  }

  const annualCostsCents =
    Number.isFinite(input.annualCostsCents) && (input.annualCostsCents as number) > 0
      ? Math.round(input.annualCostsCents as number)
      : 0;
  const urencriteriumMet = input.urencriteriumMet ?? billableHoursPerYear >= URENCRITERIUM_HOURS;
  const starter = input.starter ?? false;
  const target = Math.round(targetNetAnnualCents);

  const netFor = (profitCents: number): number =>
    profitCents - estimateIncomeTax({ profitCents, urencriteriumMet, starter }).totalCents;

  // Invariant: netFor(lo) < target ≤ netFor(hi). Omdat de heffing ≥ 0 is geldt net(p) ≤ p,
  // dus de benodigde winst is minstens `target`; lo = target − 1 zit daar gegarandeerd onder.
  let lo = Math.max(0, target - 1);
  let hi = target * 2 + 100000;
  let guard = 0;
  while (netFor(hi) < target && guard < 60) {
    hi *= 2;
    guard += 1;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (netFor(mid) < target) lo = mid;
    else hi = mid;
  }

  const requiredProfitCents = hi;
  const tax = estimateIncomeTax({ profitCents: requiredProfitCents, urencriteriumMet, starter });
  const requiredRevenueCents = requiredProfitCents + annualCostsCents;
  const requiredHourlyRateCents = Math.ceil(requiredRevenueCents / billableHoursPerYear);

  return {
    ok: true,
    requiredProfitCents,
    requiredRevenueCents,
    requiredHourlyRateCents,
    incomeTaxCents: tax.totalCents,
    netAnnualCents: requiredProfitCents - tax.totalCents,
    effectiveRateBps: tax.effectiveRateBps,
    urencriteriumMet,
  };
}
