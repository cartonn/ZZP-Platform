// Pure gereedheidscheck voor het automatisch afronden van een samenwerking in de betaal-cascade.
// Een samenwerking met nog openstaand geld (niet-afgewikkelde facturen) of onbeoordeeld werk
// (ingediende prestaties die nog op goedkeuring wachten) mag niet automatisch op COMPLETED
// springen — anders raakt die betaalverplichting of dat werk los van zijn context.
// Server-berekend, geen DB-toegang (CLAUDE.md regel 1). Pure functie, unit-testbaar.

// Een cascade-factuur (lifecycleStatus gezet) is afgewikkeld zodra de keten klaar is.
export const SETTLED_INVOICE_LIFECYCLE = ["PAID", "PROCESSED", "CREDITED"] as const;
// Een legacy-factuur (geen lifecycleStatus) is afgewikkeld bij betaald of geannuleerd.
export const SETTLED_INVOICE_LEGACY_STATUS = ["PAID", "CANCELLED"] as const;

export interface InvoiceStateSnapshot {
  lifecycleStatus: string | null;
  status: string;
}

/**
 * Een factuur is "afgewikkeld" (geen openstaand geld meer) als ze cascade is met
 * lifecycleStatus PAID/PROCESSED/CREDITED, of legacy (geen lifecycleStatus) met status
 * PAID/CANCELLED. Alle overige toestanden (DRAFT, SUBMITTED, APPROVED, OVERDUE, REJECTED,
 * legacy SENT/DRAFT) gelden als openstaand.
 */
export function isInvoiceSettled(inv: InvoiceStateSnapshot): boolean {
  if (inv.lifecycleStatus != null) {
    return (SETTLED_INVOICE_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return (SETTLED_INVOICE_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

export interface OpenWorkSnapshot {
  /** Andere facturen van de samenwerking (de zojuist betaalde factuur uitgesloten). */
  otherInvoices: InvoiceStateSnapshot[];
  /** Aantal ingediende prestaties (Performance status SUBMITTED) dat nog op goedkeuring wacht. */
  submittedPerformances: number;
}

/**
 * True zodra er nog openstaand geld (een niet-afgewikkelde andere factuur) of onbeoordeeld
 * werk (een ingediende prestatie) is. Pure functie, geen DB.
 */
export function hasOpenCollaborationWork(snapshot: OpenWorkSnapshot): boolean {
  if (snapshot.submittedPerformances > 0) return true;
  return snapshot.otherInvoices.some((inv) => !isInvoiceSettled(inv));
}
