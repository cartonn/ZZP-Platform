// Geplande runner voor de berichten-reply-reminders: nudget de ontvanger van een onbeantwoord bericht
// zodra het gesprek stilligt (dag 3 en 7 na het laatste bericht). Idempotent via DomainEvent dedupeKey.
// Plan/apply-patroon zoals runApplicationDecisionReminderTask. Geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planConversationReplyReminders,
  conversationReplyReminderWindow,
  type ConversationReplyReminderConversation,
} from "@/lib/conversation-reply-reminders";

export interface ConversationReplyReminderResult {
  reminded: number;
}

// Begrensde pagina's houden latere gesprekken bereikbaar zonder alle rijen tegelijk te laden. Eerdere
// opzet (één scan met `take: 500`) liet een gesprek voorbij de cap structureel buiten de run vallen:
// het reminder-venster is een bewegend venster op `updatedAt` (dag 3-9), dus zo'n gesprek verloor
// — zodra zijn `updatedAt` voorbij `notBefore` verouderde — zijn dag-3- én dag-7-nudge definitief
// (zelfde klasse als de bereikbaar-voorbij-de-cap-herstellen #1529-1534).
const CONVERSATION_BATCH_SIZE = 1000;

export async function runConversationReplyReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<ConversationReplyReminderResult> {
  const now = opts.now ?? new Date();
  const window = conversationReplyReminderWindow(now);

  // `Conversation.updatedAt` wordt bij elke berichtzending bijgewerkt (zie berichten/actions.ts), dus
  // het benadert het moment van het laatste bericht. We begrenzen de scan tot het reminder-venster;
  // de planner beslist daarna de exacte dag uit het werkelijke `lastMessage.createdAt`. Keyset-paginatie
  // op `id` doorloopt het hele venster in begrensde batches, zodat elk gesprek bereikbaar blijft.
  let afterId: string | undefined;
  let reminded = 0;
  while (true) {
    const rows = await prisma.conversation.findMany({
      where: {
        updatedAt: { gte: window.notBefore, lte: window.notAfter },
        ...(afterId ? { id: { gt: afterId } } : {}),
      },
      select: {
        id: true,
        job: { select: { title: true } },
        participants: { select: { userId: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { senderId: true, createdAt: true, sender: { select: { name: true } } },
        },
      },
      orderBy: { id: "asc" },
      take: CONVERSATION_BATCH_SIZE,
    });

    const last = rows.at(-1);
    if (!last) break;
    afterId = last.id;

    const conversations: ConversationReplyReminderConversation[] = rows.map((c) => {
      const lastMessage = c.messages[0] ?? null;
      return {
        conversationId: c.id,
        lastMessage: lastMessage
          ? { senderId: lastMessage.senderId, createdAt: lastMessage.createdAt }
          : null,
        participantIds: c.participants.map((p) => p.userId),
        jobTitle: c.job?.title ?? null,
        senderName: lastMessage?.sender?.name ?? null,
      };
    });

    const plan = planConversationReplyReminders(conversations, now);

    // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
    const keys = plan.reminders.map((r) => r.dedupeKey);
    const existing = await prisma.domainEvent.findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    });
    const seen = new Set(existing.map((e) => e.dedupeKey));
    const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));

    for (const r of fresh) {
      await prisma.$transaction([
        prisma.domainEvent.create({
          data: {
            type: "CONVERSATION_REPLY_REMINDER",
            actorRole: "SYSTEM",
            actorId: opts.actorId ?? null,
            subjectType: "Conversation",
            subjectId: r.conversationId,
            payload: JSON.stringify({ stage: r.stage }),
            correlationId: null,
            dedupeKey: r.dedupeKey,
          },
        }),
        prisma.notification.create({
          data: {
            userId: r.userId,
            type: r.notificationType,
            title: r.title,
            body: r.body,
            link: `/berichten/${r.conversationId}`,
          },
        }),
        prisma.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "CONVERSATION_REPLY_REMINDER",
            entityType: "Conversation",
            entityId: r.conversationId,
            metadata: { stage: r.stage, userId: r.userId },
          }),
        }),
      ]);
    }

    reminded += fresh.length;
    if (rows.length < CONVERSATION_BATCH_SIZE) break;
  }

  return { reminded };
}
