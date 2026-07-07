// Factuur-logica: statusovergangen (expliciete map) en server-berekende bedragen.
// Bedragen in centen (integer) — nooit floats opslaan; nooit client-bedragen vertrouwen.
// Pure functies, getest.

import { type Prisma } from "@prisma/client";
import { type InvoiceStatus } from "@/lib/enums";

/**
 * Where-fragment voor samenwerkingen waaruit een ZZP'er een LOSSE factuur mag opstellen: lopend of
 * afgerond, en nog NIET in de uren-/prestatie-cascade. Zodra er een prestatie of een cascade-factuur
 * (lifecycleStatus) bestaat, loopt de facturatie via het werkproces en zou een losse factuur dubbel
 * factureren. Eén bron van waarheid voor /facturen/nieuw, de "Nieuwe factuur"-knop en de
 * "Factuur opstellen"-knop op /samenwerkingen — zodat die niet uiteenlopen (en doodlopen).
 */
export function invoiceableCollaborationsWhere(
  freelancerUserId: string,
): Prisma.CollaborationWhereInput {
  return {
    freelancer: { userId: freelancerUserId },
    status: { in: ["ACTIVE", "COMPLETED"] },
    performances: { none: {} },
    invoices: { none: { lifecycleStatus: { not: null } } },
  };
}

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

/**
 * Bovengrens voor een bedrag in centen. `Invoice.totalCents`, `InvoiceLine.amountCents` en
 * `Performance.amountCents` zijn Prisma `Int` (Postgres `int4`, max 2.147.483.647 ≈ € 21,4 mln).
 * Een bedrag hierboven overschrijdt de kolombreedte → een ruwe DB-schrijffout (500) i.p.v. een
 * nette server-side weigering. Klem daarom élk factuur-/regelbedrag hierop (server-side waarheid,
 * CLAUDE.md regel 1): het `max`-attribuut op een formulier is geen garantie, een geknutselde POST
 * omzeilt het. `invoiceLineSchema` staat per regel tot 1e13 cents toe (100000 × 100_000_000),
 * ruim 3 orden hierboven; deze grens vangt dat af vóór de DB.
 */
export const MAX_INVOICE_CENTS = 2_147_483_647;

/** Blijft een bedrag in centen binnen de `int4`-kolombreedte? Geheel, niet-negatief, ≤ plafond. */
export function invoiceCentsWithinInt4(cents: number): boolean {
  return Number.isInteger(cents) && cents >= 0 && cents <= MAX_INVOICE_CENTS;
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
