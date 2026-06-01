// Inkomstenbelasting-schatting (box 1, winst uit onderneming) — pure, deterministisch,
// in hele centen. INDICATIEF: dit bereidt voor en schat, het is geen aangifte (zie TAX_DISCLAIMER).
// De ZZP'er (DigiD) of een gemachtigd fiscaal dienstverlener dient zelf in.

import {
  BOX1_BRACKETS,
  MKB_WINSTVRIJSTELLING_BPS,
  STARTERSAFTREK_CENTS,
  ZELFSTANDIGENAFTREK_CENTS,
  ZVW_MAX_GRONDSLAG_CENTS,
  ZVW_RATE_BPS,
  type TaxBracket,
} from "@/lib/tax/config";

/** Commerciële afronding naar hele centen (halve centen omhoog). */
function round(cents: number): number {
  return Math.round(cents);
}

/** Progressieve heffing over een grondslag volgens een schijventabel. */
export function progressiveTax(
  baseCents: number,
  brackets: readonly TaxBracket[] = BOX1_BRACKETS,
): number {
  if (baseCents <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upToCents ?? Infinity;
    if (baseCents <= lower) break;
    const slice = Math.min(baseCents, upper) - lower;
    if (slice > 0) tax += (slice * b.rateBps) / 10000;
    lower = upper;
  }
  return round(tax);
}

export interface ProfitInput {
  /** Winst vóór ondernemersaftrek (omzet − kosten), in centen. */
  profitCents: number;
  /** Is het urencriterium (1.225 uur) gehaald? Bepaalt zelfstandigen-/startersaftrek. */
  urencriteriumMet: boolean;
  /** Heeft de ondernemer recht op startersaftrek (max 3x in 5 jaar)? */
  starter?: boolean;
}

export interface TaxableProfit {
  profitCents: number; //            winst vóór aftrek
  zelfstandigenaftrekCents: number;
  startersaftrekCents: number;
  mkbVrijstellingCents: number; //   12,7% van (winst − ondernemersaftrek)
  taxableProfitCents: number; //     belastbare winst (grondslag box 1)
}

/**
 * Belastbare winst: trek de ondernemersaftrek af (alleen bij gehaald urencriterium),
 * pas daarna de MKB-winstvrijstelling (12,7%) toe op het restant. Aftrek kan de winst
 * niet onder nul brengen.
 */
export function taxableProfit(input: ProfitInput): TaxableProfit {
  const profitCents = Math.max(0, input.profitCents);
  const zelfstandigenaftrekCents = input.urencriteriumMet
    ? Math.min(profitCents, ZELFSTANDIGENAFTREK_CENTS)
    : 0;
  const afterZelf = profitCents - zelfstandigenaftrekCents;
  const startersaftrekCents =
    input.urencriteriumMet && input.starter ? Math.min(afterZelf, STARTERSAFTREK_CENTS) : 0;
  const afterOndernemersaftrek = afterZelf - startersaftrekCents;
  const mkbVrijstellingCents = round((afterOndernemersaftrek * MKB_WINSTVRIJSTELLING_BPS) / 10000);
  const taxableProfitCents = Math.max(0, afterOndernemersaftrek - mkbVrijstellingCents);
  return {
    profitCents,
    zelfstandigenaftrekCents,
    startersaftrekCents,
    mkbVrijstellingCents,
    taxableProfitCents,
  };
}

export interface IncomeTaxEstimate extends TaxableProfit {
  box1Cents: number; //         geschatte inkomstenbelasting box 1
  zvwCents: number; //          geschatte Zvw-bijdrage
  totalCents: number; //        box1 + Zvw
  effectiveRateBps: number; //  totale heffing als % van de winst vóór aftrek
}

/** Indicatieve IB+Zvw-schatting over de winst uit onderneming. */
export function estimateIncomeTax(input: ProfitInput): IncomeTaxEstimate {
  const tp = taxableProfit(input);
  const box1Cents = progressiveTax(tp.taxableProfitCents);
  // Zvw over de winst (vóór MKB-vrijstelling/ondernemersaftrek wijkt af; we hanteren de
  // belastbare winst met plafond als indicatieve grondslag).
  const zvwGrondslag = Math.min(tp.taxableProfitCents, ZVW_MAX_GRONDSLAG_CENTS);
  const zvwCents = round((zvwGrondslag * ZVW_RATE_BPS) / 10000);
  const totalCents = box1Cents + zvwCents;
  const effectiveRateBps =
    tp.profitCents > 0 ? Math.round((totalCents / tp.profitCents) * 10000) : 0;
  return { ...tp, box1Cents, zvwCents, totalCents, effectiveRateBps };
}
