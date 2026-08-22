// Unit-tests voor runConversationReplyReminderTask — reply-reminders naar de ontvanger van een
// onbeantwoord bericht. Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  conversations: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findMany: vi.fn(async () => store.conversations),
    },
    domainEvent: {
      findMany: vi.fn(async (args: { where: { dedupeKey: { in: string[] } } }) =>
        store.domainEvents.filter((e) => args.where.dedupeKey.in.includes(e.dedupeKey as string)),
      ),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.domainEvents.push(args.data);
        return args.data;
      }),
    },
    notification: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return args.data;
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.auditLogs.push(args.data);
        return args.data;
      }),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

import { runConversationReplyReminderTask } from "@/lib/conversation-reply-reminders-task";

const NOW = new Date("2026-08-22T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function convoRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "conv-1",
    job: { title: "Nachtdienst VVT" },
    participants: [{ userId: "sender" }, { userId: "recipient" }],
    messages: [{ senderId: "sender", createdAt: daysAgo(3), sender: { name: "Sanne" } }],
    ...over,
  };
}

beforeEach(() => {
  store.conversations = [];
  store.domainEvents = [];
  store.notifications = [];
  store.auditLogs = [];
});

describe("runConversationReplyReminderTask", () => {
  it("doet niets zonder gesprekken", async () => {
    const res = await runConversationReplyReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("nudget de ontvanger op dag 3 (notificatie + event + audit)", async () => {
    store.conversations = [convoRow()];
    const res = await runConversationReplyReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 1 });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.userId).toBe("recipient");
    expect(store.notifications[0]?.type).toBe("CONVERSATION_REPLY_REMINDER");
    expect(store.notifications[0]?.link).toBe("/berichten/conv-1");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("CONVERSATION_REPLY_REMINDER");
    expect(store.domainEvents[0]?.subjectType).toBe("Conversation");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("CONVERSATION_REPLY_REMINDER");
  });

  it("is idempotent: een tweede run op dezelfde dag stuurt niets", async () => {
    store.conversations = [convoRow()];
    await runConversationReplyReminderTask({ actorId: null, now: NOW });
    const res2 = await runConversationReplyReminderTask({ actorId: null, now: NOW });
    expect(res2).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(1);
  });

  it("stuurt niets voor een gesprek zonder berichten", async () => {
    store.conversations = [convoRow({ messages: [] })];
    const res = await runConversationReplyReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0 });
  });

  it("nudget beide niet-afzenders in een 3-weg gesprek", async () => {
    store.conversations = [
      convoRow({
        participants: [{ userId: "sender" }, { userId: "recipient" }, { userId: "bemiddelaar" }],
      }),
    ];
    const res = await runConversationReplyReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 2 });
    expect(store.notifications.map((n) => n.userId).sort()).toEqual(["bemiddelaar", "recipient"]);
  });
});
