// Platform-facturatie: pure logica voor het bundelen van PENDING-bijdragen tot een factuur en de
// statusovergangen ervan (DRAFT → SENT → PAID / CANCELLED). Geld in integer-centen. Geen I/O — de
// runner (billing-run.ts) en de acties doen de DB-toegang. Spiegelt het patroon van invoices.ts.

import { type PlatformBillingStatus } from "@/lib/enums";

export class PlatformBillingTransitionError extends Error {
  constructor(from: PlatformBillingStatus, to: PlatformBillingStatus) {
    super(`Ongeldige facturatie-statusovergang: ${from} -> ${to}`);
    this.name = "PlatformBillingTransitionError";
  }
}

export const PLATFORM_BILLING_TRANSITIONS: Record<
  PlatformBillingStatus,
  readonly PlatformBillingStatus[]
> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

export function canTransitionPlatformBilling(
  from: PlatformBillingStatus,
  to: PlatformBillingStatus,
): boolean {
  return PLATFORM_BILLING_TRANSITIONS[from].includes(to);
}

export function assertPlatformBillingTransition(
  from: PlatformBillingStatus,
  to: PlatformBillingStatus,
): void {
  if (!canTransitionPlatformBilling(from, to)) throw new PlatformBillingTransitionError(from, to);
}

/** Oplopend, jaargebonden platform-factuurnummer, bijv. "PF-2026-0007". */
export function formatPlatformInvoiceNumber(year: number, seq: number): string {
  return `PF-${year}-${String(seq).padStart(4, "0")}`;
}

export interface BillingLineAmount {
  subtotalCents: number;
  vatCents: number;
}

export interface BillingTotals {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

/** Telt de regels (bijdragen) op tot het factuurtotaal. Server-berekend; nooit een client-totaal. */
export function summarizeBillingLines(lines: readonly BillingLineAmount[]): BillingTotals {
  const subtotalCents = lines.reduce((s, l) => s + l.subtotalCents, 0);
  const vatCents = lines.reduce((s, l) => s + l.vatCents, 0);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
