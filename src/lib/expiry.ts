// Expiry-planning: pure module zonder I/O of Prisma.
// Berekent welke credentials moeten worden verlopen (toExpire) en welke
// een "verloopt binnenkort"-herinnering verdienen (toRemind).
// Server-side is de waarheid (CLAUDE.md regel 1 & 3).

import { daysUntilExpiry, expiryTransition, isExpiringSoon } from "@/lib/credentials";
import { type CredentialStatus } from "@/lib/enums";

/** Aantal dagen vóór de vervaldatum waarop we een "verloopt binnenkort"-herinnering sturen. */
export const EXPIRY_REMINDER_WINDOW_DAYS = 30;

export interface ExpiryCandidate {
  id: string;
  status: CredentialStatus;
  expiresAt: Date | null;
  /** Vervaldatum waarvoor al een herinnering is verstuurd (dedup). null = nog nooit. */
  expiryReminderFor: Date | null;
  title: string;
  /** De userId van de eigenaar (freelancerProfile.userId) — voor de notificatie. */
  userId: string;
}

export interface ExpirePlanItem {
  id: string;
  userId: string;
  title: string;
}

export interface ReminderPlanItem {
  id: string;
  userId: string;
  title: string;
  /** De vervaldatum waarvoor we herinneren; wordt opgeslagen in expiryReminderFor. */
  expiresAt: Date;
  /** Hele dagen tot verlopen (>= 0). */
  daysLeft: number;
}

export interface ExpiryPlan {
  toExpire: ExpirePlanItem[];
  toRemind: ReminderPlanItem[];
}

/**
 * Bepaalt voor een lijst van kandidaat-credentials welke moeten verlopen en
 * welke een herinnering verdienen.
 *
 * @param candidates - Te beoordelen credentials.
 * @param now        - Referentietijdstip (standaard: huidige datum/tijd).
 * @param windowDays - Hoeveel dagen vóór expiry we herinneren (standaard: EXPIRY_REMINDER_WINDOW_DAYS).
 * @returns ExpiryPlan met toExpire- en toRemind-lijsten (nooit overlappend).
 */
export function planExpiryRun(
  candidates: ExpiryCandidate[],
  now: Date = new Date(),
  windowDays: number = EXPIRY_REMINDER_WINDOW_DAYS,
): ExpiryPlan {
  const toExpire: ExpirePlanItem[] = [];
  const toRemind: ReminderPlanItem[] = [];

  for (const candidate of candidates) {
    const { id, userId, title, status, expiresAt, expiryReminderFor } = candidate;

    // Controleer of de credential naar EXPIRED moet overgaan.
    // expiryTransition handhaaft: alleen VERIFIED + daadwerkelijk verlopen.
    if (expiryTransition({ status, expiresAt }, now) === "EXPIRED") {
      toExpire.push({ id, userId, title });
      // Een verlopen credential kan nooit tegelijk in toRemind staan.
      continue;
    }

    // Controleer of de credential binnenkort verloopt en nog geen herinnering
    // heeft ontvangen voor déze specifieke vervaldatum.
    if (isExpiringSoon({ status, expiresAt }, windowDays, now)) {
      // Dedup: sla de herinnering over als we al herinnerd hebben voor exact
      // dezelfde vervaldatum (expiryReminderFor.getTime() === expiresAt.getTime()).
      const alreadyReminded =
        expiryReminderFor !== null &&
        expiresAt !== null &&
        expiryReminderFor.getTime() === expiresAt.getTime();

      if (!alreadyReminded) {
        // expiresAt is gegarandeerd niet-null hier omdat isExpiringSoon dat afdwingt.
        const days = daysUntilExpiry(expiresAt, now);
        // Clamp op 0: in theorie altijd >= 0 hier (isExpiringSoon sluit verlopen uit),
        // maar we verdedigen ons tegen afrondingsverschillen.
        const daysLeft = days !== null ? Math.max(0, days) : 0;

        toRemind.push({
          id,
          userId,
          title,
          expiresAt: expiresAt as Date,
          daysLeft,
        });
      }
    }
  }

  return { toExpire, toRemind };
}
