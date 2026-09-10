// Reminder-cascade voor ingediende (SUBMITTED) cascade-facturen die nog niet door de opdrachtgever
// zijn goedgekeurd (PLATFORM_OVERHAUL.md §4, Event C → D). Nadat de ZZP'er een concept-factuur
// indient krijgt die een factuurnummer en gaat de vordering naar de opdrachtgever ter goedkeuring.
// Blijft die goedkeuring liggen, dan stalt de laatste stap van de cascade: geen goedkeuring → geen
// betaal-registratie → geen afwikkeling. Dit is — anders dan de prestatie-goedkeuring — de énige
// opdrachtgever-poort in de cascade die nog géén nudge had. Deze planner herinnert de opdrachtgever
// (dag 3 en 7) en escaleert daarna naar het platform. Spiegelbeeld van
// `performance-approval-reminders` (dat de vorige poort, de prestatie-goedkeuring, bewaakt). Pure
// planner; idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";

export interface InvoiceApprovalCandidate {
  invoiceId: string;
  /** InvoiceLifecycleState — alleen SUBMITTED telt mee. */
  lifecycleStatus: string;
  /** Moment van indienen (Invoice.issuedAt, gezet bij de SUBMITTED-overgang); null = negeren. */
  submittedAt: Date | null;
  /** userId van de opdrachtgever (Invoice.counterpartyUserId). */
  clientUserId: string;
  /** CollaborationStatus van de bron-samenwerking — een geannuleerde inzet telt niet mee. */
  collabStatus: string;
  /** Dispuut open → cascade bevroren; geen nudge. */
  disputed: boolean;
  /** Factuurnummer binnen de partij-reeks (of null) voor de notificatietekst. */
  partyInvoiceNumber: string | null;
}

export interface InvoiceApprovalReminderItem {
  invoiceId: string;
  /** Ontvanger: de opdrachtgever (goedkeurder). */
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface InvoiceApprovalEscalationItem {
  invoiceId: string;
  clientUserId: string;
  partyInvoiceNumber: string | null;
  daysSince: number;
  dedupeKey: string;
}

export interface InvoiceApprovalReminderPlan {
  reminders: InvoiceApprovalReminderItem[]; //   naar de opdrachtgever (goedkeurder)
  escalations: InvoiceApprovalEscalationItem[]; //naar het platform (admins) na de laatste herinnering
}

/** Hele dagen sinds `submitted`. */
export function daysSince(submitted: Date, now: Date): number {
  return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
}

/** Leesbare aanduiding van de factuur voor de notificatietekst. */
export function invoiceLabel(partyInvoiceNumber: string | null): string {
  return partyInvoiceNumber ? `Factuur ${partyInvoiceNumber}` : "Een ingediende factuur";
}

// Herinneringsdagen >0 uit de config. Escaleren ná de laatste herinnering.
const REMIND_DAYS = REMINDERS.invoiceApprovalDays.filter((d) => d > 0);
const ESCALATE_AFTER = REMIND_DAYS.length ? Math.max(...REMIND_DAYS) : 7;

/**
 * Plan welke herinneringen/escalaties nodig zijn. Alleen ingediende (SUBMITTED) facturen op een
 * niet-geannuleerde, niet-betwiste samenwerking; dezelfde poort als de prestatie-goedkeuring. De
 * invoer hoeft niet gesorteerd te zijn en wordt niet gemuteerd.
 */
export function planInvoiceApprovalReminders(
  candidates: readonly InvoiceApprovalCandidate[],
  now: Date = new Date(),
): InvoiceApprovalReminderPlan {
  const reminders: InvoiceApprovalReminderItem[] = [];
  const escalations: InvoiceApprovalEscalationItem[] = [];

  for (const c of candidates) {
    if (c.lifecycleStatus !== "SUBMITTED") continue; // alleen ingediende, nog-niet-goedgekeurde facturen
    if (!c.submittedAt) continue;
    if (c.collabStatus === "CANCELLED") continue; // geannuleerde inzet keurt niemand meer
    if (c.disputed) continue; //                     dispuut → cascade bevroren, geen nudge

    const d = daysSince(c.submittedAt, now);
    const label = invoiceLabel(c.partyInvoiceNumber);

    if ((REMIND_DAYS as readonly number[]).includes(d)) {
      reminders.push({
        invoiceId: c.invoiceId,
        userId: c.clientUserId,
        notificationType: "INVOICE_APPROVAL_REMINDER",
        title: "Factuur wacht op je goedkeuring",
        body: `${label} staat al ${plural(d, "dag", "dagen")} klaar om te keuren. Keur of wijs hem af zodat de betaling kan starten.`,
        stage: `day-${d}`,
        dedupeKey: `invoice-approval-reminder-${c.invoiceId}-${d}`,
      });
    }

    if (d > ESCALATE_AFTER) {
      escalations.push({
        invoiceId: c.invoiceId,
        clientUserId: c.clientUserId,
        partyInvoiceNumber: c.partyInvoiceNumber,
        daysSince: d,
        dedupeKey: `invoice-approval-escalation-${c.invoiceId}`,
      });
    }
  }

  return { reminders, escalations };
}
