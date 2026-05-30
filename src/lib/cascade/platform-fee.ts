// Event F — Platformfee-module (PLATFORM_OVERHAUL.md §4 Event F + §0A Besluit 4).
// STATUS: configureerbaar, **standaard UITGESCHAKELD**. Het platform int NOOIT op de hoofdtransactie
// (Besluit 1); een fee is een APARTE factuur van het platform aan de betalende partij, met eigen
// BTW en eigen nummerreeks (PLATFORM_ISSUER). Pure berekening + boekingen; getest. De runtime-
// activering (echte fee-factuur aanmaken) volgt zodra het fee-besluit (Davud) binnen is — Fase 7.

import { PLATFORM_FEE, type PlatformFeeConfig } from "@/lib/config";
import { computeVat } from "@/lib/administration/vat";
import { planInvoiceSubmitted, planInvoiceApproved, type LedgerParty, type Posting } from "@/lib/administration/ledger";

export interface PlatformFeeResult {
  /** False als de fee uit staat of op 0 uitkomt — dan geen factuur, geen boekingen. */
  applicable: boolean;
  payer: LedgerParty; //        wie de fee betaalt (CLIENT of FREELANCER)
  subtotalCents: number; //     fee excl. BTW
  vatCents: number;
  totalCents: number; //        fee incl. BTW
  /** Boekingen: platform = omzet + af te dragen BTW; betaler = kosten + voorbelasting. */
  postings: Posting[];
}

/** Het fee-subtotaal: percentage van de opdrachtwaarde, of een vast bedrag (beide configureerbaar). */
export function feeSubtotalCents(opdrachtwaardeCents: number, config: PlatformFeeConfig): number {
  if (config.fixedCents > 0) return config.fixedCents;
  if (config.percentageBps > 0) return Math.round((opdrachtwaardeCents * config.percentageBps) / 10000);
  return 0;
}

/**
 * Berekent de platformfee over de opdrachtwaarde en de bijbehorende boekingen. Gescheiden van de
 * geldstroom opdrachtgever → ZZP'er (Besluit 1/4). Standaard `config` = PLATFORM_FEE (uit).
 */
export function computePlatformFee(
  opdrachtwaardeCents: number,
  config: PlatformFeeConfig = PLATFORM_FEE,
): PlatformFeeResult {
  const payer: LedgerParty = config.payer; // "CLIENT" | "FREELANCER"
  const subtotalCents = config.enabled ? feeSubtotalCents(opdrachtwaardeCents, config) : 0;

  if (!config.enabled || subtotalCents <= 0) {
    return { applicable: false, payer, subtotalCents: 0, vatCents: 0, totalCents: 0, postings: [] };
  }

  const vat = computeVat(subtotalCents, config.vatRegime);
  const fin = { issuer: "PLATFORM" as LedgerParty, counterparty: payer, subtotalCents: vat.subtotalCents, vatCents: vat.vatCents, totalCents: vat.totalCents };

  // Platform schrijft de fee-factuur uit (debiteur/omzet/af te dragen BTW); de betaler boekt
  // kosten + voorbelasting. Aparte factuur, los van de hoofdtransactie.
  const postings = [...planInvoiceSubmitted(fin), ...planInvoiceApproved(fin)];

  return { applicable: true, payer, subtotalCents: vat.subtotalCents, vatCents: vat.vatCents, totalCents: vat.totalCents, postings };
}
