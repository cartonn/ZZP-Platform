import { DEFAULT_PAYMENT_TERM_DAYS } from "@/lib/config";

export const PLATFORM_BILLING_TERM_DAYS = DEFAULT_PAYMENT_TERM_DAYS; // 30

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AgingInvoice {
  status: string; // "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  issuedAt: Date | null;
  totalCents: number;
}

export interface InvoiceAging {
  dueAt: Date | null; // issuedAt + PLATFORM_BILLING_TERM_DAYS dagen, anders null
  daysOutstanding: number | null; // hele dagen sinds issuedAt (>= 0), anders null
  daysOverdue: number; // max(0, hele dagen na dueAt); 0 indien n.v.t.
  overdue: boolean; // alleen SENT met issuedAt én now > dueAt (strikt groter)
}

export function dueDateFor(issuedAt: Date | null): Date | null {
  if (issuedAt === null) return null;
  return new Date(issuedAt.getTime() + PLATFORM_BILLING_TERM_DAYS * DAY_MS);
}

export function agingFor(inv: { status: string; issuedAt: Date | null }, now: Date): InvoiceAging {
  if (inv.status !== "SENT") {
    return { dueAt: null, daysOutstanding: null, daysOverdue: 0, overdue: false };
  }

  if (inv.issuedAt === null) {
    return { dueAt: null, daysOutstanding: null, daysOverdue: 0, overdue: false };
  }

  const issuedAt = inv.issuedAt;
  const dueAt = dueDateFor(issuedAt)!;
  const daysOutstanding = Math.max(0, Math.floor((now.getTime() - issuedAt.getTime()) / DAY_MS));
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueAt.getTime()) / DAY_MS));
  const overdue = now.getTime() > dueAt.getTime();

  return { dueAt, daysOutstanding, daysOverdue, overdue };
}

export interface AgingSummary {
  overdueCount: number;
  overdueCents: number;
}

export function summarizeAging(invoices: AgingInvoice[], now: Date): AgingSummary {
  let overdueCount = 0;
  let overdueCents = 0;

  for (const inv of invoices) {
    const aging = agingFor(inv, now);
    if (aging.overdue) {
      overdueCount += 1;
      overdueCents += inv.totalCents;
    }
  }

  return { overdueCount, overdueCents };
}
