// Factuur-logica: statusovergangen (expliciete map) en server-berekende bedragen.
// Bedragen in centen (integer) — nooit floats opslaan; nooit client-bedragen vertrouwen.
// Pure functies, getest.

import { type InvoiceStatus } from "@/lib/enums";

export class InvoiceTransitionError extends Error {
  constructor(from: InvoiceStatus, to: InvoiceStatus) {
    super(`Ongeldige factuur-statusovergang: ${from} -> ${to}`);
    this.name = "InvoiceTransitionError";
  }
}

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["PAID", "OVERDUE", "CANCELLED"],
  OVERDUE: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return INVOICE_TRANSITIONS[from].includes(to);
}

export function assertInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!canTransitionInvoice(from, to)) throw new InvoiceTransitionError(from, to);
}

export interface LineInput {
  quantity: number;
  unitCents: number;
}

/** Regelbedrag in centen. */
export function lineAmountCents(line: LineInput): number {
  return line.quantity * line.unitCents;
}

/** Factuurtotaal in centen (som van regels). Server-berekend; client levert nooit het totaal. */
export function invoiceTotalCents(lines: readonly LineInput[]): number {
  return lines.reduce((sum, l) => sum + lineAmountCents(l), 0);
}

/** Een verzonden factuur is verlopen zodra de vervaldatum is gepasseerd. */
export function isOverdue(
  invoice: { status: InvoiceStatus; dueAt?: Date | null },
  now: Date = new Date(),
): boolean {
  return invoice.status === "SENT" && !!invoice.dueAt && invoice.dueAt.getTime() < now.getTime();
}

/** Oplopend, jaargebonden factuurnummer, bijv. 2026-0007. */
export function formatInvoiceNumber(year: number, seq: number): string {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

/** Euro-bedrag (mag decimaal zijn) naar hele centen. */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/** Centen naar Nederlands euro-formaat, bijv. "€ 1.234,56". */
export function formatEuro(cents: number): string {
  return `€ ${(cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
