// E-mail-fallback voor het notificatiecentrum (concurrentie-backlog punt 7).
// Wie de app een tijd niet opent, mist in-app-notificaties; deze planner bundelt ongelezen
// notificaties ouder dan een drempel tot één digest per gebruiker (gegroepeerd per categorie).
// Pure functie; de runner regelt idempotentie via Notification.digestedAt + DomainEvent dedupeKey.

import { REMINDERS } from "@/lib/config";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABEL,
  notificationMeta,
  type NotificationCategory,
} from "@/lib/notifications";

export interface DigestCandidate {
  id: string;
  userId: string;
  type: string;
  title: string;
  createdAt: Date;
}

export interface DigestLine {
  category: NotificationCategory;
  label: string;
  count: number;
  /** Maximaal MAX_TITLES_PER_CATEGORY titels, nieuwste eerst; de rest telt mee in count. */
  titles: string[];
}

export interface UserDigest {
  userId: string;
  notificationIds: string[];
  count: number;
  lines: DigestLine[];
  dedupeKey: string;
}

export interface DigestPlan {
  digests: UserDigest[];
}

/** Aantal voorbeeldtitels per categorie in de e-mail; daarboven alleen de teller. */
export const MAX_TITLES_PER_CATEGORY = 3;

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Bundelt ongelezen notificaties ouder dan `minAgeHours` tot één digest per gebruiker.
 * Categorieën volgen de vaste volgorde uit NOTIFICATION_CATEGORIES; binnen een categorie
 * nieuwste eerst. De dedupeKey is afgeleid van de nieuwste meegenomen notificatie, zodat
 * dezelfde set nooit twee keer een event oplevert.
 */
export function planNotificationDigests(
  candidates: readonly DigestCandidate[],
  now: Date = new Date(),
  minAgeHours: number = REMINDERS.notificationDigestMinAgeHours,
): DigestPlan {
  const cutoff = now.getTime() - minAgeHours * MS_PER_HOUR;
  const eligible = candidates.filter((c) => c.createdAt.getTime() <= cutoff);
  if (eligible.length === 0) return { digests: [] };

  const byUser = new Map<string, DigestCandidate[]>();
  for (const c of eligible) {
    const list = byUser.get(c.userId);
    if (list) list.push(c);
    else byUser.set(c.userId, [c]);
  }

  const digests: UserDigest[] = [];
  for (const [userId, items] of byUser) {
    // Nieuwste eerst — bepaalt zowel de voorbeeldtitels als de dedupeKey.
    const sorted = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const byCategory = new Map<NotificationCategory, DigestCandidate[]>();
    for (const item of sorted) {
      const { category } = notificationMeta(item.type);
      const list = byCategory.get(category);
      if (list) list.push(item);
      else byCategory.set(category, [item]);
    }

    const lines: DigestLine[] = NOTIFICATION_CATEGORIES.filter((cat) => byCategory.has(cat)).map(
      (cat) => {
        const inCat = byCategory.get(cat)!;
        return {
          category: cat,
          label: NOTIFICATION_CATEGORY_LABEL[cat],
          count: inCat.length,
          titles: inCat.slice(0, MAX_TITLES_PER_CATEGORY).map((i) => i.title),
        };
      },
    );

    digests.push({
      userId,
      notificationIds: sorted.map((i) => i.id),
      count: sorted.length,
      lines,
      dedupeKey: `notification-digest-${userId}-${sorted[0]!.id}`,
    });
  }

  return { digests };
}
