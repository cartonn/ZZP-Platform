// Reminder-cascade voor open disputen (PLATFORM_OVERHAUL.md §4, zijpad dispuut/escalatie). Zolang
// een dispuut openstaat is de facturatie-cascade bevroren: geen factuur-goedkeuring, geen betaling,
// geen afronding van de samenwerking. Anders dan de andere stalls (niet-gekeurde prestatie,
// niet-ingediende concept-factuur, te late betaling) had een open dispuut géén actieve nudge —
// het stond alleen passief op `/admin/statistieken`. Deze planner herinnert béíde partijen (dag 3
// en 7) dat hun inzet bevroren is en escaleert daarna naar het platform (admins) voor bemiddeling.
// Spiegelbeeld van `performance-approval-reminders`. Pure planner; idempotentie regelt de runner via
// DomainEvent dedupeKey. Geen geldstroom, geen cascade-mutatie.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";

export interface DisputeReminderCandidate {
  collaborationId: string;
  /** Moment waarop het dispuut werd geopend; null = geen open dispuut → genegeerd. */
  disputedAt: Date | null;
  /** CollaborationStatus — een geannuleerde samenwerking telt niet mee. */
  collabStatus: string;
  /** userId van de ZZP'er (Collaboration → freelancer.userId). */
  freelancerUserId: string;
  /** userId van de opdrachtgever (Collaboration → company.userId). */
  clientUserId: string;
  /** Opdrachttitel voor de notificatietekst. */
  jobTitle: string;
}

export interface DisputeReminderItem {
  collaborationId: string;
  /** Ontvanger: een van beide partijen (beide worden herinnerd). */
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface DisputeEscalationItem {
  collaborationId: string;
  jobTitle: string;
  ageDays: number;
  dedupeKey: string;
}

export interface DisputeReminderPlan {
  reminders: DisputeReminderItem[]; //    naar béíde partijen (ZZP'er + opdrachtgever)
  escalations: DisputeEscalationItem[]; // naar het platform (admins) na de laatste herinnering
}

/**
 * Hele dagen dat het dispuut openstaat: nooit negatief (toekomstig/now → 0); floor. Spiegelt
 * `disputeAgeDays` uit `disputes.ts`, maar lokaal gehouden zodat deze planner een leaf-module
 * blijft (geen prisma-import → puur testbaar).
 */
export function disputeAgeDays(disputedAt: Date, now: Date): number {
  const diffMs = now.getTime() - disputedAt.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Herinneringsdagen >0 uit de config. Escaleren ná de laatste herinnering.
const REMIND_DAYS = REMINDERS.disputeReminderDays.filter((d) => d > 0);
const ESCALATE_AFTER = REMIND_DAYS.length ? Math.max(...REMIND_DAYS) : 7;

/**
 * Externe her-export van `ESCALATE_AFTER`: de leeftijd (in hele dagen) waarboven `planDisputeReminders`
 * escaleert. Eén bron van waarheid voor de backlog-cutoff van de gauge `zzp_disputes_overdue_escalation`;
 * verandert de config-drempel, dan schuift zowel de plan-beslissing als de where-vorm automatisch mee.
 */
export const DISPUTE_ESCALATE_AFTER_DAYS = ESCALATE_AFTER;

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Snijpunt waarvóór (of waarop) een open dispuut al door de cron naar admins geëscaleerd had moeten zijn.
 * `planDisputeReminders` escaleert zodra `d > ESCALATE_AFTER` (7) met `d = floor(ageDays)` — d.w.z. de
 * dispuut-leeftijd ≥ 8 hele dagen. Een dispuut wier `disputedAt` op of vóór dit punt ligt, had de cron
 * dus al als escalatie moeten vuren. Eén bron van waarheid voor de gauge `zzp_disputes_overdue_escalation`;
 * een drift-gate-test klinkt de cutoff vast aan de escalatie-beslissing van `planDisputeReminders`.
 */
export function disputeEscalationBacklogCutoff(now: Date): Date {
  return new Date(now.getTime() - (DISPUTE_ESCALATE_AFTER_DAYS + 1) * DAY_MS);
}

/**
 * Dedupe-sleutel voor de escalatie-DomainEvent van een dispuut. Eén bron van waarheid: zowel de planner
 * als de metrics-kant (die tegen dezelfde sleutel moet dedupliceren om reeds geëscaleerde disputen uit
 * de gauge te schrappen) mogen deze helper aanroepen — een parallelle inline-literal zou stil driften.
 */
export function disputeEscalationDedupeKey(collaborationId: string): string {
  return `dispute-escalation-${collaborationId}`;
}

function reminderBody(jobTitle: string, ageDays: number): string {
  return `Het dispuut op "${jobTitle}" staat al ${plural(ageDays, "dag", "dagen")} open. Zolang het niet is opgelost ligt de facturatie en betaling stil. Los het samen op of vraag het platform om bemiddeling.`;
}

/**
 * Plan welke herinneringen/escalaties nodig zijn. Alleen samenwerkingen met een open dispuut op een
 * niet-geannuleerde samenwerking. De invoer hoeft niet gesorteerd te zijn en wordt niet gemuteerd.
 */
export function planDisputeReminders(
  candidates: readonly DisputeReminderCandidate[],
  now: Date = new Date(),
): DisputeReminderPlan {
  const reminders: DisputeReminderItem[] = [];
  const escalations: DisputeEscalationItem[] = [];

  for (const c of candidates) {
    if (!c.disputedAt) continue; //                  geen open dispuut
    if (c.collabStatus === "CANCELLED") continue; //  geannuleerde inzet — niets meer te bemiddelen

    const d = disputeAgeDays(c.disputedAt, now);

    if ((REMIND_DAYS as readonly number[]).includes(d)) {
      const body = reminderBody(c.jobTitle, d);
      // Béíde partijen zijn geblokkeerd door het bevroren dispuut → beiden herinneren.
      for (const userId of [c.freelancerUserId, c.clientUserId]) {
        reminders.push({
          collaborationId: c.collaborationId,
          userId,
          notificationType: "DISPUTE_REMINDER",
          title: "Dispuut wacht op een oplossing",
          body,
          stage: `day-${d}`,
          dedupeKey: `dispute-reminder-${c.collaborationId}-${userId}-${d}`,
        });
      }
    }

    if (d > ESCALATE_AFTER) {
      escalations.push({
        collaborationId: c.collaborationId,
        jobTitle: c.jobTitle,
        ageDays: d,
        dedupeKey: disputeEscalationDedupeKey(c.collaborationId),
      });
    }
  }

  return { reminders, escalations };
}
