// Wettelijke incassokosten (WIK-staffel) + wettelijke handelsrente op een te late B2B-factuur.
// Pure: geen DB-toegang, volledig testbaar. Alleen berekening/indicatie — het platform int niet
// (Besluit 1: geldstroom loopt rechtstreeks tussen ZZP'er en opdrachtgever). Deze module levert de
// bedragen die een crediteur bij verzuim wettelijk mag claimen, zodat de aanmaning ze kan tonen.
//
// Bronnen (INDICATIEF — controleer de actuele wetgeving/rente):
//  • Buitengerechtelijke incassokosten: Besluit vergoeding voor buitengerechtelijke incassokosten
//    (BIK) — de staffel hieronder, met een minimum van € 40 en een maximum van € 6.775.
//  • Wettelijke handelsrente (handelstransacties B2B): art. 6:119a BW. Het percentage wordt per
//    halfjaar vastgesteld; de waarde hier is een richtwaarde die per periode moet worden bijgewerkt.

/** Minimale buitengerechtelijke incassokosten (€ 40). */
export const WIK_MIN_CENTS = 4000;
/** Maximale buitengerechtelijke incassokosten (€ 6.775). */
export const WIK_MAX_CENTS = 677500;

/**
 * WIK-staffel: percentage (basispunten) per schijf van de hoofdsom. `upToCents` is de bovengrens
 * van de schijf (cumulatief); `null` = geen bovengrens (bovenste schijf).
 */
interface WikTier {
  upToCents: number | null;
  rateBps: number;
}
const WIK_TIERS: readonly WikTier[] = [
  { upToCents: 250000, rateBps: 1500 }, // 15% over de eerste € 2.500
  { upToCents: 500000, rateBps: 1000 }, // 10% over € 2.500 – € 5.000
  { upToCents: 1000000, rateBps: 500 }, // 5% over € 5.000 – € 10.000
  { upToCents: 20000000, rateBps: 100 }, // 1% over € 10.000 – € 200.000
  { upToCents: null, rateBps: 50 }, // 0,5% boven € 200.000
];

/**
 * Wettelijke handelsrente per jaar (basispunten), INDICATIEF. Wordt per halfjaar vastgesteld;
 * bewust conservatief richtwaarde die per periode moet worden bijgewerkt. Op de aanmaning wordt
 * de rente expliciet als indicatief gelabeld met het verzoek de actuele rente te controleren.
 */
export const WETTELIJKE_HANDELSRENTE_BPS = 800; // 8,00% (indicatief)

const MS_PER_DAY = 86_400_000;

/**
 * Berekent de buitengerechtelijke incassokosten over een hoofdsom volgens de WIK-staffel.
 * Klemt op het wettelijke minimum (€ 40) en maximum (€ 6.775). Een niet-positieve/ongeldige
 * hoofdsom levert € 0 (geen vordering → geen kosten).
 */
export function calculateCollectionCostsCents(principalCents: number): number {
  if (!Number.isFinite(principalCents) || principalCents <= 0) return 0;

  let remaining = principalCents;
  let prevCap = 0;
  let cost = 0;
  for (const tier of WIK_TIERS) {
    const cap = tier.upToCents ?? Infinity;
    const band = Math.min(remaining, cap - prevCap);
    if (band <= 0) break;
    cost += (band * tier.rateBps) / 10000;
    remaining -= band;
    prevCap = cap;
    if (remaining <= 0) break;
  }

  const rounded = Math.round(cost);
  return Math.min(Math.max(rounded, WIK_MIN_CENTS), WIK_MAX_CENTS);
}

/**
 * Berekent de opgebouwde wettelijke handelsrente over een hoofdsom tussen de vervaldag en nu
 * (enkelvoudige rente, dagen/365). Rente loopt pas ná de vervaldag: is de factuur nog niet
 * verlopen, ontbreekt de vervaldag, of is de hoofdsom niet-positief → € 0.
 */
export function calculateStatutoryInterestCents(input: {
  principalCents: number;
  dueAt: Date | null;
  now: Date;
  annualRateBps?: number;
}): number {
  const { principalCents, dueAt, now } = input;
  const annualRateBps = input.annualRateBps ?? WETTELIJKE_HANDELSRENTE_BPS;
  if (!Number.isFinite(principalCents) || principalCents <= 0) return 0;
  if (!dueAt || Number.isNaN(dueAt.getTime())) return 0;
  const days = Math.floor((now.getTime() - dueAt.getTime()) / MS_PER_DAY);
  if (days <= 0) return 0;
  return Math.round((principalCents * (annualRateBps / 10000) * days) / 365);
}

export interface OverdueCharges {
  /** Aantal dagen dat de factuur over de vervaldag is (≥ 0). */
  daysOverdue: number;
  /** Opgebouwde wettelijke handelsrente (cent). */
  interestCents: number;
  /** Buitengerechtelijke incassokosten volgens de WIK-staffel (cent). */
  collectionCostsCents: number;
  /** Gehanteerde jaarrente (basispunten) — indicatief. */
  interestRateBps: number;
  /** Hoofdsom + rente + incassokosten (cent). */
  totalWithChargesCents: number;
  /** True zodra er iets te claimen valt (rente of incassokosten > 0). */
  hasCharges: boolean;
}

/**
 * Vat samen wat een crediteur bij verzuim mag claimen bovenop de hoofdsom: opgebouwde wettelijke
 * handelsrente + buitengerechtelijke incassokosten (WIK). Puur en deterministisch.
 */
export function summarizeOverdueCharges(input: {
  principalCents: number;
  dueAt: Date | null;
  now: Date;
  annualRateBps?: number;
}): OverdueCharges {
  const { principalCents, dueAt, now } = input;
  const interestRateBps = input.annualRateBps ?? WETTELIJKE_HANDELSRENTE_BPS;
  const daysOverdue =
    dueAt && !Number.isNaN(dueAt.getTime())
      ? Math.max(0, Math.floor((now.getTime() - dueAt.getTime()) / MS_PER_DAY))
      : 0;
  const interestCents = calculateStatutoryInterestCents({
    principalCents,
    dueAt,
    now,
    annualRateBps: interestRateBps,
  });
  const collectionCostsCents = daysOverdue > 0 ? calculateCollectionCostsCents(principalCents) : 0;
  const safePrincipal = Number.isFinite(principalCents) && principalCents > 0 ? principalCents : 0;
  return {
    daysOverdue,
    interestCents,
    collectionCostsCents,
    interestRateBps,
    totalWithChargesCents: safePrincipal + interestCents + collectionCostsCents,
    hasCharges: interestCents > 0 || collectionCostsCents > 0,
  };
}
