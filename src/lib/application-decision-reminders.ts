// Reminder-planner voor kandidaten die op een beslissing van de opdrachtgever wachten. De ZZP'er ziet
// op /reacties al de versheid van de eigen reactie (`application-wait.ts`); de opdrachtgever ziet op
// /kandidaten het next-action-signaal `staleApplications` — maar alleen als hij inlogt. Deze planner
// stuurt een pró-actieve notificatie zodra een reeds-bekeken kandidaat (VIEWED/SHORTLIST) langer dan
// gebruikelijk blijft liggen, zodat talent niet koud wordt terwijl de opdrachtgever wacht.
// Spiegelbeeld van `performance-approval-reminders` (dat de opdrachtgever aan het keuren herinnert) en
// `payment-reminders`; het vroegste, meest impactvolle lek in de trechter. Concurrenten (Temper/Malt/
// Deel) belonen snelle opdrachtgevers en verliezen talent bij trage reacties — wij maken dat expliciet.
// Pure planner; idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";
import { WAIT_ATTENTION_DAYS, type WaitStage } from "@/lib/application-wait";

export interface ApplicationDecisionCandidate {
  applicationId: string;
  /** ApplicationStatus van de reactie; alleen VIEWED/SHORTLIST tellen mee. */
  status: string;
  /** Aanmaakmoment van de reactie (onveranderlijk) — de basis voor de wachttijd. */
  createdAt: Date;
  /** Of er al een samenwerking uit de reactie is voortgekomen (dan is beslissen niet meer aan de orde). */
  hasCollaboration: boolean;
  /** JobStatus van de opdracht; alleen een nog-gepubliceerde opdracht verdient een beslis-nudge. */
  jobStatus: string;
  /** Ontvanger: de opdrachtgever (Application → job → company.userId). */
  clientUserId: string;
  /** Titel van de opdracht voor de notificatietekst. */
  jobTitle: string;
}

export interface ApplicationDecisionReminderItem {
  applicationId: string;
  /** Ontvanger: de opdrachtgever. */
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface ApplicationDecisionReminderPlan {
  reminders: ApplicationDecisionReminderItem[];
}

/** Hele dagen sinds `created`. Een `created` in de toekomst (data-ruis) levert 0, nooit negatief. */
export function daysSince(created: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}

// Offsets bovenop de per-fase aandachtsdrempel (uniek + oplopend). ≥0 afgedwongen.
const OFFSETS = [...new Set(REMINDERS.applicationDecisionDays.filter((d) => d >= 0))].sort(
  (a, b) => a - b,
);

function isNudgeableStage(status: string): status is Extract<WaitStage, "VIEWED" | "SHORTLIST"> {
  // NEW valt bewust weg: die dekt de "nieuwe reacties"-taak al (`applicationsReviewTask`).
  return status === "VIEWED" || status === "SHORTLIST";
}

/**
 * Plan welke beslis-reminders vandaag nodig zijn. Alleen nog-onbesliste, reeds-bekeken reacties
 * (VIEWED/SHORTLIST) op een nog-gepubliceerde opdracht zonder samenwerking. De reminder vuurt op de
 * per-fase aandachtsdrempel plus de geconfigureerde vervolg-offsets — exact wanneer /kandidaten de
 * reactie ook als "wacht al langer dan gebruikelijk" markeert (geen drift). De invoer hoeft niet
 * gesorteerd te zijn en wordt niet gemuteerd; `now` wordt geïnjecteerd voor reproduceerbaarheid.
 */
export function planApplicationDecisionReminders(
  candidates: readonly ApplicationDecisionCandidate[],
  now: Date = new Date(),
): ApplicationDecisionReminderPlan {
  const reminders: ApplicationDecisionReminderItem[] = [];

  for (const c of candidates) {
    if (c.hasCollaboration) continue; //           beslist / voortgezet — geen nudge meer
    if (c.jobStatus !== "PUBLISHED") continue; //  concept/gesloten opdracht: beslissen is moot
    if (!isNudgeableStage(c.status)) continue; //  alleen bekeken kandidaten (VIEWED/SHORTLIST)

    const threshold = WAIT_ATTENTION_DAYS[c.status];
    const reminderDays = OFFSETS.map((o) => threshold + o);
    const d = daysSince(c.createdAt, now);
    if (!reminderDays.includes(d)) continue;

    reminders.push({
      applicationId: c.applicationId,
      userId: c.clientUserId,
      notificationType: "APPLICATION_DECISION_REMINDER",
      title: "Kandidaat wacht op je beslissing",
      body: `Een kandidaat wacht al ${plural(d, "dag", "dagen")} op je beslissing voor "${c.jobTitle}". Bekijk en beslis zodat je het talent niet verliest.`,
      stage: `day-${d}`,
      dedupeKey: `application-decision-reminder-${c.applicationId}-${d}`,
    });
  }

  return { reminders };
}
