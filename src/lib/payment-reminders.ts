// Reminder-engine voor de betaaltermijn (PLATFORM_OVERHAUL.md §4 Event D / zijpad "betaling te laat").
// Pure planner: bepaalt welke herinneringen vóór de vervaldag en welke te-laat-signalen na de
// vervaldag moeten worden gevuurd, en welke goedgekeurde facturen op OVERDUE gezet worden.
// Idempotentie regelt de runner via DomainEvent dedupeKey. Geld loopt nooit via het platform
// (Besluit 1): dit is statusregistratie + signalering, geen incasso.

import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { REMINDERS } from "@/lib/config";

export interface PaymentReminderCandidate {
  invoiceId: string;
  lifecycleStatus: InvoiceLifecycleState;
  dueAt: Date | null;
  freelancerUserId: string;
  clientUserId: string;
  partyInvoiceNumber: string | null;
}

export interface PaymentReminderItem {
  invoiceId: string;
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  /** "overdue" of "before-<dagen>" — bepaalt het event-type en de dedup. */
  stage: string;
  dedupeKey: string;
  overdue: boolean;
}

export interface PaymentReminderPlan {
  /** Facturen die van APPROVED naar OVERDUE moeten (eenmalig). */
  toMarkOverdue: string[];
  reminders: PaymentReminderItem[];
}

/** Hele dagen tot de vervaldag; negatief = al verstreken. */
export function daysUntil(due: Date, now: Date): number {
  return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function planPaymentReminders(
  candidates: readonly PaymentReminderCandidate[],
  now: Date = new Date(),
): PaymentReminderPlan {
  const toMarkOverdue: string[] = [];
  const reminders: PaymentReminderItem[] = [];

  for (const c of candidates) {
    if (c.lifecycleStatus !== "APPROVED" && c.lifecycleStatus !== "OVERDUE") continue;
    if (!c.dueAt) continue;
    const num = c.partyInvoiceNumber ?? "concept";
    const days = daysUntil(c.dueAt, now);

    if (days < 0) {
      if (c.lifecycleStatus === "APPROVED") toMarkOverdue.push(c.invoiceId);
      // Eén te-laat-signaal: opdrachtgever wordt herinnerd, ZZP'er kan een aanmaning sturen.
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.clientUserId,
        notificationType: "PAYMENT_OVERDUE",
        title: "Betaaltermijn verstreken",
        body: `De betaaltermijn van factuur ${num} is verstreken. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`,
        stage: "overdue",
        dedupeKey: `payment-overdue-${c.invoiceId}`,
        overdue: true,
      });
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.freelancerUserId,
        notificationType: "PAYMENT_OVERDUE",
        title: "Betaling te laat",
        body: `Factuur ${num} is over de vervaldag. Je kunt een betalingsherinnering of aanmaning sturen.`,
        stage: "overdue",
        dedupeKey: `payment-overdue-freelancer-${c.invoiceId}`,
        overdue: true,
      });
      continue;
    }

    // Herinneringen vóór de vervaldag (alleen voor nog niet te late facturen).
    if (c.lifecycleStatus === "APPROVED" && REMINDERS.paymentBeforeDueDays.includes(days as never)) {
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.clientUserId,
        notificationType: "PAYMENT_REMINDER",
        title: "Betaaltermijn nadert",
        body: `Factuur ${num} vervalt over ${days} dag(en). Betaling verloopt rechtstreeks aan de ZZP'er.`,
        stage: `before-${days}`,
        dedupeKey: `payment-due-${c.invoiceId}-${days}`,
        overdue: false,
      });
    }
  }

  return { toMarkOverdue, reminders };
}
