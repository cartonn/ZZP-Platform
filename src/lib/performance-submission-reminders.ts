// Reminder-cascade voor open urenstaten (PLATFORM_OVERHAUL.md §4, stap vóór Event B1). Een lopende
// uurtarief-samenwerking waarvan de laatst ingediende prestatie al een tijd geleden is — en waarvoor
// niets meer in concept of ter beoordeling staat — krijgt een seintje naar de ZZP'er om de volgende
// urenstaat in te dienen. Zo valt de facturatiecascade niet stil doordat er simpelweg geen uren
// worden geboekt. Spiegel van `concept-invoice-reminders`, maar één stap eerder.
//
// Pure planner; idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";

export interface PerformanceSubmissionCandidate {
  collaborationId: string;
  freelancerUserId: string;
  jobTitle: string;
  /** Moment van de laatst ingediende, goedgekeurde uren-prestatie; null = nog nooit uren ingediend. */
  lastHoursSubmittedAt: Date | null;
  /** Staat er al iets in concept (DRAFT) of ter beoordeling (SUBMITTED)? Dan ligt de bal elders. */
  hasOpenSubmission: boolean;
}

export interface PerformanceSubmissionReminderItem {
  collaborationId: string;
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface PerformanceSubmissionReminderPlan {
  reminders: PerformanceSubmissionReminderItem[]; // naar de ZZP'er
}

/** Hele dagen sinds `since`. */
export function daysSince(since: Date, now: Date): number {
  return Math.floor((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
}

/** YYYY-MM-DD (UTC) — ankert de dedupeKey aan de laatste indiening zodat een nieuwe periode opnieuw mag herinneren. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Herinneringsdagen >0 uit de config.
const REMIND_DAYS = REMINDERS.performanceSubmissionDays.filter((d) => d > 0);

export function planPerformanceSubmissionReminders(
  candidates: readonly PerformanceSubmissionCandidate[],
  now: Date = new Date(),
): PerformanceSubmissionReminderPlan {
  const reminders: PerformanceSubmissionReminderItem[] = [];

  for (const c of candidates) {
    // Iets staat al klaar/ter beoordeling -> niet aansporen (concept-/approval-reminders dekken dat).
    if (c.hasOpenSubmission) continue;
    // Nog nooit uren ingediend: geen cadans om aan te herinneren (een verse inzet mag eerst draaien).
    if (!c.lastHoursSubmittedAt) continue;

    const d = daysSince(c.lastHoursSubmittedAt, now);
    if (!(REMIND_DAYS as readonly number[]).includes(d)) continue;

    reminders.push({
      collaborationId: c.collaborationId,
      userId: c.freelancerUserId,
      notificationType: "PERFORMANCE_SUBMISSION_REMINDER",
      title: "Urenstaat indienen?",
      body: `Je hebt al ${plural(d, "dag", "dagen")} geen uren ingediend voor "${c.jobTitle}". Dien je urenstaat in zodat de facturatie doorloopt.`,
      stage: `day-${d}`,
      // Anker op de laatste indiening: een volgende periode (nieuwe lastHoursSubmittedAt) mag opnieuw herinneren.
      dedupeKey: `perf-submission-reminder-${c.collaborationId}-${isoDate(c.lastHoursSubmittedAt)}-${d}`,
    });
  }

  return { reminders };
}
