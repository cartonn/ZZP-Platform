// Reminder-cascade voor ingediende prestaties die nog niet door de opdrachtgever zijn gekeurd
// (PLATFORM_OVERHAUL.md §4, Event B1 → B2). Een ingediende urenstaat/oplevering die blijft liggen
// stalt de hele facturatie-cascade: geen goedkeuring → geen concept-factuur → geen betaling. Het
// grace-venster (auto-goedkeuring) staat default UIT (financieel beleid), dus zonder een actieve
// nudge blijft zo'n prestatie eindeloos hangen. Deze planner herinnert de opdrachtgever (dag 3 en 7)
// en escaleert daarna naar het platform. Spiegelbeeld van `concept-invoice-reminders` (dat de ZZP'er
// aan de niet-ingediende concept-factuur herinnert). Pure planner; idempotentie regelt de runner via
// DomainEvent dedupeKey. Geen geldstroom.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";

export interface PerformanceApprovalCandidate {
  performanceId: string;
  /** PerformanceState — alleen SUBMITTED telt mee. */
  status: string;
  /** Moment van indienen; null = nog niet ingediend → genegeerd. */
  submittedAt: Date | null;
  /** userId van de opdrachtgever (Performance → collaboration → company.userId). */
  clientUserId: string;
  /** CollaborationStatus — een geannuleerde samenwerking telt niet mee. */
  collabStatus: string;
  /** Dispuut open → cascade bevroren; geen nudge. */
  disputed: boolean;
  /** Korte omschrijving van de prestatie (periode of milestone) voor de notificatietekst. */
  label: string;
}

export interface PerformanceApprovalReminderItem {
  performanceId: string;
  /** Ontvanger: de opdrachtgever. */
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface PerformanceApprovalEscalationItem {
  performanceId: string;
  clientUserId: string;
  label: string;
  daysSince: number;
  dedupeKey: string;
}

export interface PerformanceApprovalReminderPlan {
  reminders: PerformanceApprovalReminderItem[]; //   naar de opdrachtgever (keurder)
  escalations: PerformanceApprovalEscalationItem[]; //naar het platform (admins) na de laatste herinnering
}

/** Hele dagen sinds `submitted`. */
export function daysSince(submitted: Date, now: Date): number {
  return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
}

// Herinneringsdagen >0 uit de config. Escaleren ná de laatste herinnering.
const REMIND_DAYS = REMINDERS.performanceApprovalDays.filter((d) => d > 0);
const ESCALATE_AFTER = REMIND_DAYS.length ? Math.max(...REMIND_DAYS) : 7;

/**
 * Plan welke herinneringen/escalaties nodig zijn. Alleen ingediende prestaties op een
 * niet-geannuleerde, niet-betwiste samenwerking; dezelfde poort als het grace-venster. De invoer
 * hoeft niet gesorteerd te zijn en wordt niet gemuteerd.
 */
export function planPerformanceApprovalReminders(
  candidates: readonly PerformanceApprovalCandidate[],
  now: Date = new Date(),
): PerformanceApprovalReminderPlan {
  const reminders: PerformanceApprovalReminderItem[] = [];
  const escalations: PerformanceApprovalEscalationItem[] = [];

  for (const c of candidates) {
    if (c.status !== "SUBMITTED") continue; // alleen ingediende, nog-niet-gekeurde prestaties
    if (!c.submittedAt) continue;
    if (c.collabStatus === "CANCELLED") continue; // geannuleerde inzet keurt niemand meer
    if (c.disputed) continue; //                     dispuut → cascade bevroren, geen nudge

    const d = daysSince(c.submittedAt, now);

    if ((REMIND_DAYS as readonly number[]).includes(d)) {
      reminders.push({
        performanceId: c.performanceId,
        userId: c.clientUserId,
        notificationType: "PERFORMANCE_APPROVAL_REMINDER",
        title: "Urenstaat wacht op je goedkeuring",
        body: `${c.label} staat al ${plural(d, "dag", "dagen")} klaar om te keuren. Keur of wijs hem af zodat de facturatie kan starten.`,
        stage: `day-${d}`,
        dedupeKey: `performance-approval-reminder-${c.performanceId}-${d}`,
      });
    }

    if (d > ESCALATE_AFTER) {
      escalations.push({
        performanceId: c.performanceId,
        clientUserId: c.clientUserId,
        label: c.label,
        daysSince: d,
        dedupeKey: `performance-approval-escalation-${c.performanceId}`,
      });
    }
  }

  return { reminders, escalations };
}
