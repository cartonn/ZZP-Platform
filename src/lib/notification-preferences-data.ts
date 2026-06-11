// Databaselaag voor de e-mailvoorkeuren (notification-preferences.ts is de pure kern). Hier zit
// het lezen uit Prisma; het schrijven gebeurt in de account-actie (mutatieketen + audit).

import { prisma } from "@/lib/db";
import {
  type EmailPreferenceCategory,
  type EmailPreferenceMap,
  resolveEmailPreferences,
} from "@/lib/notification-preferences";

/** De volledige voorkeurenkaart voor één gebruiker (ontbrekende rijen vallen terug op aan). */
export async function loadEmailPreferences(userId: string): Promise<EmailPreferenceMap> {
  const rows = await prisma.notificationPreference.findMany({
    where: { userId },
    select: { category: true, emailEnabled: true },
  });
  return resolveEmailPreferences(rows);
}

/** Voorkeuren voor meerdere gebruikers tegelijk (voor de taakrunners; één query, geen N+1).
 *  Elke gevraagde gebruiker komt in de map voor, ook als hij geen rijen heeft (standaard aan). */
export async function loadEmailPreferencesFor(
  userIds: ReadonlyArray<string>,
): Promise<Map<string, EmailPreferenceMap>> {
  const unique = [...new Set(userIds)];
  const out = new Map<string, EmailPreferenceMap>();
  if (unique.length === 0) return out;

  const rows = await prisma.notificationPreference.findMany({
    where: { userId: { in: unique } },
    select: { userId: true, category: true, emailEnabled: true },
  });
  const byUser = new Map<string, { category: string; emailEnabled: boolean }[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId);
    if (list) list.push(row);
    else byUser.set(row.userId, [row]);
  }
  for (const id of unique) out.set(id, resolveEmailPreferences(byUser.get(id) ?? []));
  return out;
}

/** Wil deze gebruiker e-mail voor deze categorie? Standaard true (opt-out-model). */
export async function recipientWantsEmail(
  userId: string,
  category: EmailPreferenceCategory,
): Promise<boolean> {
  const prefs = await loadEmailPreferences(userId);
  return prefs[category];
}
