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

/** Standaard-probe voor de marginale voet: een extra winstschijf van € 1.000. */
export const MARGINAL_PROBE_CENTS = 100000;

/**
 * Marginale IB+Zvw-voet op de vólgende winst, in basispunten. Onder een progressief stelsel
 * (schijven + 12,7% MKB-vrijstelling + vaste ondernemersaftrek) zegt de gemiddelde effectieve
 * voet weinig over wat je op extra winst kwijt bent: de vaste aftrek drukt het gemiddelde,
 * maar geldt niet marginaal. Deze voet meet de heffing over een kleine extra winstschijf op het
 * huidige niveau — het vuistregel-percentage dat je op elke volgende euro winst opzij houdt.
 *
 * Pure afleiding uit `estimateIncomeTax` (heffing bij `profit` vs. `profit + delta`); geen eigen
 * schijvenlogica → één bron van waarheid, kan niet driften. Winst onder de zelfstandigenaftrek
 * geeft terecht ~0% (de volgende euro valt nog binnen de aftrek). Nooit negatief.
 */
export function marginalIncomeTaxRateBps(
  input: ProfitInput,
  deltaCents: number = MARGINAL_PROBE_CENTS,
): number {
  const delta = Math.max(1, Math.round(deltaCents));
  const base = Math.max(0, input.profitCents);
  const lowerCents = estimateIncomeTax({ ...input, profitCents: base }).totalCents;
  const upperCents = estimateIncomeTax({ ...input, profitCents: base + delta }).totalCents;
  const marginalCents = Math.max(0, upperCents - lowerCents);
  return Math.round((marginalCents / delta) * 10000);
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
