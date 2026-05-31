// Reminder-cascade voor niet-ingediende concept-facturen (PLATFORM_OVERHAUL.md §4, Event B2).
// Na goedkeuring van een prestatie ontstaat een concept-factuur (lifecycle DRAFT). Blijft die te
// lang liggen, dan herinnert het platform de ZZP'er (dag 3 en 7) en escaleert het daarna naar het
// platform. Pure planner; idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.

import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { REMINDERS } from "@/lib/config";

export interface ConceptInvoiceCandidate {
  invoiceId: string;
  lifecycleStatus: InvoiceLifecycleState;
  createdAt: Date;
  issuerUserId: string;
  partyInvoiceNumber: string | null;
}

export interface ConceptReminderItem {
  invoiceId: string;
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface ConceptEscalationItem {
  invoiceId: string;
  partyInvoiceNumber: string | null;
  issuerUserId: string;
  daysSince: number;
  dedupeKey: string;
}

export interface ConceptReminderPlan {
  reminders: ConceptReminderItem[]; //    naar de ZZP'er (uitschrijver)
  escalations: ConceptEscalationItem[]; // naar het platform (admins) na de laatste herinnering
}

/** Hele dagen sinds `created`. */
export function daysSince(created: Date, now: Date): number {
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// Herinneringsdagen >0 uit de config (dag 0 doet de cascade zelf bij B2). Escaleren ná de laatste.
const REMIND_DAYS = REMINDERS.conceptInvoiceDays.filter((d) => d > 0);
const ESCALATE_AFTER = REMIND_DAYS.length ? Math.max(...REMIND_DAYS) : 7;

export function planConceptInvoiceReminders(
  candidates: readonly ConceptInvoiceCandidate[],
  now: Date = new Date(),
): ConceptReminderPlan {
  const reminders: ConceptReminderItem[] = [];
  const escalations: ConceptEscalationItem[] = [];

  for (const c of candidates) {
    if (c.lifecycleStatus !== "DRAFT") continue; // alleen nog-niet-ingediende concept-facturen
    const d = daysSince(c.createdAt, now);
    const num = c.partyInvoiceNumber ?? "concept-factuur";

    if ((REMIND_DAYS as readonly number[]).includes(d)) {
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.issuerUserId,
        notificationType: "INVOICE_DRAFT_REMINDER",
        title: "Concept-factuur nog niet ingediend",
        body: `Je ${num} staat al ${d} dag(en) klaar. Controleer en dien hem in zodat de betaling kan starten.`,
        stage: `day-${d}`,
        dedupeKey: `concept-reminder-${c.invoiceId}-${d}`,
      });
    }

    if (d > ESCALATE_AFTER) {
      escalations.push({
        invoiceId: c.invoiceId,
        partyInvoiceNumber: c.partyInvoiceNumber,
        issuerUserId: c.issuerUserId,
        daysSince: d,
        dedupeKey: `concept-escalation-${c.invoiceId}`,
      });
    }
  }

  return { reminders, escalations };
}
