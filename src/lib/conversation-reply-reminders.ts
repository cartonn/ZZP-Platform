// Reminder-planner voor onbeantwoorde berichten. /berichten toont de wachtende kant al dat een
// gesprek "stil" ligt (`conversation-turn.ts`: `isStaleAwaitingReply` vanaf `CONVERSATION_STALE_DAYS`),
// maar niemand nudget de kant die aan zet is — de ontvanger van het laatste bericht die nog niet
// antwoordde. Deze planner stuurt die ontvanger een pró-actieve notificatie zodra het gesprek stilligt,
// zodat de andere partij (ZZP'er, opdrachtgever of bemiddelaar) niet geghost wordt terwijl een match,
// een opdracht of een samenwerking op een antwoord wacht. Spiegelbeeld van `application-decision-reminders`
// (dat de opdrachtgever aan het beslissen herinnert) en `performance-approval-reminders`. Benchmark:
// Intercom/Malt/Temper nudgen onbeantwoorde berichten. Pure planner; idempotentie regelt de runner via
// DomainEvent dedupeKey. Geen geldstroom.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";
import { CONVERSATION_STALE_DAYS, daysSince } from "@/lib/conversation-turn";

export interface ConversationReplyReminderConversation {
  conversationId: string;
  /** Het laatste bericht in het gesprek, of null bij een leeg gesprek (dan geen nudge). */
  lastMessage: { senderId: string; createdAt: Date } | null;
  /** User-ids van alle deelnemers; iedereen behalve de afzender van het laatste bericht is aan zet. */
  participantIds: readonly string[];
  /** Titel van de gekoppelde opdracht (optioneel) voor de notificatietekst. */
  jobTitle: string | null;
  /** Naam van de afzender die op antwoord wacht (optioneel). */
  senderName: string | null;
}

export interface ConversationReplyReminderItem {
  conversationId: string;
  /** Ontvanger: de deelnemer die aan zet is (nog niet antwoordde). */
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  stage: string;
  dedupeKey: string;
}

export interface ConversationReplyReminderPlan {
  reminders: ConversationReplyReminderItem[];
}

// Offsets bovenop de in-app stiltedrempel (uniek + oplopend, ≥0 afgedwongen). Levert de exacte dagen
// waarop een nudge vuurt; het `.includes(d)`-patroon maakt elke dag idempotent (één nudge per dag).
const OFFSETS = [...new Set(REMINDERS.conversationReplyDays.filter((d) => d >= 0))].sort(
  (a, b) => a - b,
);

/** De dagen (ná het laatste bericht) waarop een reply-reminder vuurt, bv. [3, 7]. */
export const CONVERSATION_REPLY_REMINDER_DAYS: readonly number[] = OFFSETS.map(
  (o) => CONVERSATION_STALE_DAYS + o,
);

/**
 * Coarse tijdvenster (op `Conversation.updatedAt`, dat elke berichtzending bijwerkt) waarbinnen een
 * gesprek een nudge kán verdienen — puur om de runner-query te begrenzen. De planner beslist daarna
 * de exacte dag uit `lastMessage.createdAt` (bron van waarheid). Een dag `d` betekent `createdAt` in
 * `[now-(d+1)d, now-d·d)`, dus het venster loopt van de oudste tot de jongste relevante dag (+1 dag
 * speling aan de oude kant tegen klok-/updatedAt-drift).
 */
export function conversationReplyReminderWindow(now: Date): { notBefore: Date; notAfter: Date } {
  const dayMs = 24 * 60 * 60 * 1000;
  const maxDay = Math.max(...CONVERSATION_REPLY_REMINDER_DAYS);
  const minDay = Math.min(...CONVERSATION_REPLY_REMINDER_DAYS);
  return {
    // Ouder dan dit → voorbij de laatste nudge-dag (met 1 dag speling).
    notBefore: new Date(now.getTime() - (maxDay + 2) * dayMs),
    // Jonger dan dit → nog niet aan de eerste nudge-dag toe.
    notAfter: new Date(now.getTime() - minDay * dayMs),
  };
}

/**
 * Plan welke reply-reminders vandaag nodig zijn. Voor elk gesprek met een laatste bericht dat exact op
 * een nudge-dag stilligt, krijgt elke deelnemer behalve de afzender een reminder. De invoer hoeft niet
 * gesorteerd te zijn en wordt niet gemuteerd; `now` wordt geïnjecteerd voor reproduceerbaarheid.
 * Idempotentie (niet twee keer dezelfde dag) regelt de runner via de dedupeKey.
 */
export function planConversationReplyReminders(
  conversations: readonly ConversationReplyReminderConversation[],
  now: Date = new Date(),
): ConversationReplyReminderPlan {
  const reminders: ConversationReplyReminderItem[] = [];

  for (const c of conversations) {
    const last = c.lastMessage;
    if (!last) continue; //                                    leeg gesprek: niets te beantwoorden
    const d = daysSince(last.createdAt, now);
    if (!CONVERSATION_REPLY_REMINDER_DAYS.includes(d)) continue;

    const seen = new Set<string>();
    for (const userId of c.participantIds) {
      if (userId === last.senderId) continue; //               de afzender wacht juist op antwoord
      if (seen.has(userId)) continue; //                       dubbele deelnemer-rij → één nudge
      seen.add(userId);

      const who = c.senderName?.trim() || "Iemand";
      const about = c.jobTitle ? ` over "${c.jobTitle}"` : "";
      reminders.push({
        conversationId: c.conversationId,
        userId,
        notificationType: "CONVERSATION_REPLY_REMINDER",
        title: "Bericht wacht op je antwoord",
        body: `${who} wacht al ${plural(d, "dag", "dagen")} op je antwoord${about}. Reageer om het gesprek op gang te houden.`,
        stage: `day-${d}`,
        dedupeKey: `conversation-reply-reminder-${c.conversationId}-${userId}-${d}`,
      });
    }
  }

  return { reminders };
}
