// Pure planning voor de PAST_DUE-abonnementsladder (plan/apply zoals de andere reminder-taken).
// Een mislukte betaling zet een abonnement op PAST_DUE (webhook). Daarna: herinneringen op dag
// 1, 3 en 7, en bij dag 8+ een downgrade naar Gratis. Geen I/O — deterministisch en getest.

import type { Prisma } from "@prisma/client";
import { daysSince } from "@/lib/concept-invoice-reminders";

const DAY_MS = 24 * 60 * 60 * 1000;

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

/**
 * Snijpunt waarvóór (of waarop) een PAST_DUE-abonnement al door de cron gedowngraded had moeten zijn.
 * `planPastDue` downgradet zodra `daysSince(since) > PAST_DUE_DOWNGRADE_AFTER_DAYS` (7) — d.w.z. de
 * effectieve PAST_DUE-leeftijd ≥ 8 hele dagen (`daysSince` = floor). Een rij wier effectieve
 * PAST_DUE-begin (`pastDueAt ?? updatedAt`) op of vóór dit punt ligt, had de cron dus al naar
 * CANCELLED (→ Gratis) moeten zetten.
 */
export function pastDueDowngradeBacklogCutoff(now: Date): Date {
  return new Date(now.getTime() - (PAST_DUE_DOWNGRADE_AFTER_DAYS + 1) * DAY_MS);
}

/**
 * Where-vorm voor PAST_DUE-abonnementen die al gedowngraded hadden moeten zijn: status PAST_DUE én de
 * effectieve PAST_DUE-begintijd op of vóór de cutoff. Spiegelt de `since = pastDueAt ?? updatedAt`-
 * afspraak uit `planPastDue` met een OR (pastDueAt gezet → toets op pastDueAt; legacy-rijen met
 * pastDueAt = null → toets op updatedAt). Eén bron van waarheid voor de
 * `zzp_subscriptions_past_due_overdue_downgrade`-gauge op /api/metrics; een drift-gate-test
 * (past-due.test.ts) klinkt de vorm vast aan de downgrade-beslissing van `planPastDue`.
 *
 * NB: dit is de DOWNGRADE-achterstand (de duidelijke monotone stille-faalmodus). Blijft dit getal
 * oplopen terwijl de cron-heartbeat "vers" is, dan verwerkt de past-due-pijplijn niets meer: mislukte
 * betalingen blijven eeuwig in PAST_DUE hangen en de herstel-herinneringen (dag 1/3/7) gaan niet uit.
 */
export function overdueDowngradeSubscriptionWhere(cutoff: Date): Prisma.SubscriptionWhereInput {
  return {
    status: "PAST_DUE",
    OR: [{ pastDueAt: { lte: cutoff } }, { pastDueAt: null, updatedAt: { lte: cutoff } }],
  };
}
