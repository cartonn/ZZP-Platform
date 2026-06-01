// Statusovergangen voor aangifte-delegatie via de expliciete map (CLAUDE.md regel 3).

import { TAX_FILING_TRANSITIONS, type TaxFilingStatus } from "@/lib/enums";

export class TaxFilingTransitionError extends Error {
  constructor(from: TaxFilingStatus, to: TaxFilingStatus) {
    super(`Ongeldige aangifte-overgang: ${from} -> ${to}`);
    this.name = "TaxFilingTransitionError";
  }
}

export function canTaxFilingTransition(from: TaxFilingStatus, to: TaxFilingStatus): boolean {
  return TAX_FILING_TRANSITIONS[from].includes(to);
}

export function assertTaxFilingTransition(from: TaxFilingStatus, to: TaxFilingStatus): void {
  if (!canTaxFilingTransition(from, to)) throw new TaxFilingTransitionError(from, to);
}
