// Reminder-engine voor de betaaltermijn (PLATFORM_OVERHAUL.md §4 Event D / zijpad "betaling te laat").
// Pure planner: bepaalt welke herinneringen vóór de vervaldag en welke te-laat-signalen na de
// vervaldag moeten worden gevuurd, en welke goedgekeurde facturen op OVERDUE gezet worden.
// Idempotentie regelt de runner via DomainEvent dedupeKey. Geld loopt nooit via het platform
// (Besluit 1): dit is statusregistratie + signalering, geen incasso.
// De aanmaningsladder vuurt per bereikt niveau één signaal (REMINDER → FIRST_NOTICE →
// SECOND_NOTICE → FINAL_NOTICE); dedupeKey bevat het niveau zodat de runner idempotent is.

import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import {
  REMINDERS,
  DUNNING_STAGES,
  DUNNING_ESCALATION_LEVEL,
  type DunningLevel,
} from "@/lib/config";
import { plural } from "@/lib/plural";

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

export interface PaymentEscalationItem {
  invoiceId: string;
  partyInvoiceNumber: string | null;
  freelancerUserId: string;
  clientUserId: string;
  level: DunningLevel;
  daysOverdue: number;
  dedupeKey: string; // `payment-dunning-escalation-${invoiceId}`
}

export interface PaymentReminderPlan {
  /** Facturen die van APPROVED naar OVERDUE moeten (eenmalig). */
  toMarkOverdue: string[];
  reminders: PaymentReminderItem[];
  escalations: PaymentEscalationItem[];
}

/** Hele dagen tot de vervaldag; negatief = al verstreken. */
export function daysUntil(due: Date, now: Date): number {
  return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Hele dagen ná de vervaldag (0 op de vervaldag zelf, groeit daarna). */
export function daysOverdue(due: Date, now: Date): number {
  return Math.floor((now.getTime() - due.getTime()) / DAY_MS);
}

/** Het hoogst bereikte dunning-niveau voor een (eventueel) te late factuur, of null als niet te laat. */
export function currentDunningStage(
  dueAt: Date | null,
  now: Date = new Date(),
): { level: DunningLevel; label: string; daysOverdue: number } | null {
  if (!dueAt) return null;
  if (daysUntil(dueAt, now) >= 0) return null; // nog niet over de vervaldag
  const over = Math.max(0, daysOverdue(dueAt, now));
  // hoogste stage waarvan de drempel is bereikt (REMINDER@0 dekt altijd)
  let chosen: (typeof DUNNING_STAGES)[number] = DUNNING_STAGES[0];
  for (const s of DUNNING_STAGES) if (over >= s.daysOverdue) chosen = s;
  return { level: chosen.level, label: chosen.label, daysOverdue: over };
}

export function planPaymentReminders(
  candidates: readonly PaymentReminderCandidate[],
  now: Date = new Date(),
): PaymentReminderPlan {
  const toMarkOverdue: string[] = [];
  const reminders: PaymentReminderItem[] = [];
  const escalations: PaymentEscalationItem[] = [];

  for (const c of candidates) {
    if (c.lifecycleStatus !== "APPROVED" && c.lifecycleStatus !== "OVERDUE") continue;
    if (!c.dueAt) continue;
    const num = c.partyInvoiceNumber ?? "concept";
    const days = daysUntil(c.dueAt, now);

    if (days < 0) {
      if (c.lifecycleStatus === "APPROVED") toMarkOverdue.push(c.invoiceId);

      const stage = currentDunningStage(c.dueAt, now)!;

      // Client reminder per dunning level
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.clientUserId,
        notificationType: "PAYMENT_OVERDUE",
        title: stage.label,
        body: `Factuur ${num} is ${plural(stage.daysOverdue, "dag", "dagen")} over de vervaldag (${stage.label.toLowerCase()}). Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`,
        stage: stage.level,
        dedupeKey: `payment-overdue-${c.invoiceId}-${stage.level}`,
        overdue: true,
      });

      // Freelancer reminder per dunning level
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.freelancerUserId,
        notificationType: "PAYMENT_OVERDUE",
        title: stage.label,
        body: `Factuur ${num} is ${plural(stage.daysOverdue, "dag", "dagen")} te laat. Je kunt een ${stage.label.toLowerCase()} sturen.`,
        stage: stage.level,
        dedupeKey: `payment-overdue-freelancer-${c.invoiceId}-${stage.level}`,
        overdue: true,
      });

      // Escalation: only from DUNNING_ESCALATION_LEVEL onwards
      const stageIndex = DUNNING_STAGES.findIndex((s) => s.level === stage.level);
      const escalationIndex = DUNNING_STAGES.findIndex((s) => s.level === DUNNING_ESCALATION_LEVEL);
      if (stageIndex >= escalationIndex) {
        escalations.push({
          invoiceId: c.invoiceId,
          partyInvoiceNumber: c.partyInvoiceNumber,
          freelancerUserId: c.freelancerUserId,
          clientUserId: c.clientUserId,
          level: stage.level,
          daysOverdue: stage.daysOverdue,
          dedupeKey: `payment-dunning-escalation-${c.invoiceId}`,
        });
      }

      continue;
    }

    // Herinneringen vóór de vervaldag (alleen voor nog niet te late facturen).
    if (
      c.lifecycleStatus === "APPROVED" &&
      REMINDERS.paymentBeforeDueDays.includes(days as never)
    ) {
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.clientUserId,
        notificationType: "PAYMENT_REMINDER",
        title: "Betaaltermijn nadert",
        body: `Factuur ${num} vervalt over ${plural(days, "dag", "dagen")}. Betaling verloopt rechtstreeks aan de ZZP'er.`,
        stage: `before-${days}`,
        dedupeKey: `payment-due-${c.invoiceId}-${days}`,
        overdue: false,
      });
    }
  }

  return { toMarkOverdue, reminders, escalations };
}
