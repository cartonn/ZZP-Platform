// Pure planning voor de PAST_DUE-abonnementsladder (plan/apply zoals de andere reminder-taken).
// Een mislukte betaling zet een abonnement op PAST_DUE (webhook). Daarna: herinneringen op dag
// 1, 3 en 7, en bij dag 8+ een downgrade naar Gratis. Geen I/O — deterministisch en getest.

import { daysSince } from "@/lib/concept-invoice-reminders";

export const PAST_DUE_REMINDER_DAYS = [1, 3, 7] as const;
/** Vanaf deze leeftijd (dagen) wordt het abonnement teruggezet naar Gratis. */
export const PAST_DUE_DOWNGRADE_AFTER_DAYS = 7;

export interface PastDueCandidate {
  id: string;
  userId: string;
  /** Sinds wanneer PAST_DUE; valt terug op updatedAt voor rijen van vóór dit veld. */
  pastDueAt: Date | null;
  updatedAt: Date;
}

export interface PastDueReminderItem {
  subscriptionId: string;
  userId: string;
  day: number;
  dedupeKey: string;
}

export interface PastDueDowngradeItem {
  subscriptionId: string;
  userId: string;
  dedupeKey: string;
}

export interface PastDuePlan {
  reminders: PastDueReminderItem[];
  downgrades: PastDueDowngradeItem[];
}

/**
 * Bepaalt per PAST_DUE-abonnement welke herinnering of downgrade aan de beurt is. De aanroeper
 * levert alleen PAST_DUE-kandidaten. Downgrade (dag > 7) gaat vóór de dag-exacte herinneringen,
 * zodat een gemiste cron-dag de downgrade niet overslaat.
 */
export function planPastDue(
  candidates: readonly PastDueCandidate[],
  now: Date = new Date(),
): PastDuePlan {
  const reminders: PastDueReminderItem[] = [];
  const downgrades: PastDueDowngradeItem[] = [];

  for (const c of candidates) {
    const since = c.pastDueAt ?? c.updatedAt;
    const d = daysSince(since, now);
    // Cyclus-discriminator: een abonnement-rij wordt hergebruikt over zijn hele levensloop (uniek
    // per userId, upsert bij her-aanmelding), terwijl DomainEvent-rijen permanent blijven. Zonder
    // een per-episode-token zou een tweede mislukte betaling exact dezelfde dedupeKeys produceren en
    // als "al gevuurd" worden weggefilterd → geen herinneringen en geen downgrade meer. `since`
    // (pastDueAt, vers gezet door de webhook bij elke mislukking) is per episode uniek én stabiel.
    const cycle = since.getTime();
    if (d > PAST_DUE_DOWNGRADE_AFTER_DAYS) {
      downgrades.push({
        subscriptionId: c.id,
        userId: c.userId,
        dedupeKey: `subscription-downgrade-${c.id}-${cycle}`,
      });
    } else if ((PAST_DUE_REMINDER_DAYS as readonly number[]).includes(d)) {
      reminders.push({
        subscriptionId: c.id,
        userId: c.userId,
        day: d,
        dedupeKey: `subscription-past-due-${c.id}-${cycle}-day-${d}`,
      });
    }
  }

  return { reminders, downgrades };
}
