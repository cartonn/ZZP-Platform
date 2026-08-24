// Aggregeert de wettelijk oplopende extra kosten (handelsrente art. 6:119a BW + incassokosten WIK)
// over de te late betaalverplichtingen van een OPDRACHTGEVER. Puur en deterministisch: geen DB.
//
// De reken-engine (`collection-costs.ts`) wordt ook door de aanmaning van de ZZP'er gebruikt; door
// hier exact dezelfde `summarizeOverdueCharges` op de hoofdsom (`grossCents`, incl. BTW — net als de
// aanmaning `totalCents` doorgeeft) aan te roepen, ziet de debiteur precies wat de crediteur mag
// claimen — geen drift tussen aanmaning en het verplichtingen-scherm. Alleen een indicatie: het
// platform int niet (Besluit 1: geldstroom loopt rechtstreeks tussen partijen).

import { summarizeOverdueCharges, type OverdueCharges } from "@/lib/collection-costs";
import type { ObligationItem } from "@/lib/payment-obligations";

export interface ObligationItemCharges {
  invoiceId: string;
  charges: OverdueCharges;
}

export interface OverdueChargeExposure {
  /** Per-factuur de oplopende extra kosten — alleen facturen die daadwerkelijk kosten dragen. */
  items: ObligationItemCharges[];
  /** Aantal te late facturen met oplopende kosten. */
  count: number;
  /** Opgebouwde wettelijke handelsrente over alle te late facturen (cent). */
  totalInterestCents: number;
  /** Buitengerechtelijke incassokosten (WIK) over alle te late facturen (cent). */
  totalCollectionCostsCents: number;
  /** rente + incassokosten samen — het bedrag bovenop de hoofdsommen (cent). */
  totalExtraCents: number;
  /** Gehanteerde jaarrente (basispunten) — indicatief. */
  interestRateBps: number;
  /** True zodra er ergens iets oploopt. */
  hasCharges: boolean;
}

/**
 * Vat de oplopende extra kosten samen over de betaalverplichtingen. Een factuur telt alleen mee als
 * `summarizeOverdueCharges` daadwerkelijk kosten teruggeeft (dus ná de vervaldag). SUBMITTED-items
 * (nog geen vervaldag) en op-tijd APPROVED-items dragen niets bij.
 */
export function summarizeObligationOverdueCharges(
  items: readonly ObligationItem[],
  now: Date,
  annualRateBps?: number,
): OverdueChargeExposure {
  const charged: ObligationItemCharges[] = [];
  let totalInterestCents = 0;
  let totalCollectionCostsCents = 0;
  let interestRateBps = 0;

  for (const item of items) {
    const charges = summarizeOverdueCharges({
      principalCents: item.grossCents,
      dueAt: item.dueDate,
      now,
      annualRateBps,
    });
    if (!charges.hasCharges) continue;
    charged.push({ invoiceId: item.invoiceId, charges });
    totalInterestCents += charges.interestCents;
    totalCollectionCostsCents += charges.collectionCostsCents;
    interestRateBps = charges.interestRateBps;
  }

  return {
    items: charged,
    count: charged.length,
    totalInterestCents,
    totalCollectionCostsCents,
    totalExtraCents: totalInterestCents + totalCollectionCostsCents,
    interestRateBps,
    hasCharges: charged.length > 0,
  };
}

/** Snelle lookup per factuur voor de rij-weergave. */
export function chargesByInvoiceId(exposure: OverdueChargeExposure): Map<string, OverdueCharges> {
  return new Map(exposure.items.map((entry) => [entry.invoiceId, entry.charges]));
}
