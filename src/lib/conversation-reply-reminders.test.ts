import { describe, it, expect } from "vitest";
import {
  planConversationReplyReminders,
  conversationReplyReminderWindow,
  CONVERSATION_REPLY_REMINDER_DAYS,
  type ConversationReplyReminderConversation,
} from "@/lib/conversation-reply-reminders";

const NOW = new Date("2026-08-22T12:00:00.000Z");

function daysAgo(days: number, extraHours = 0): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000 - extraHours * 60 * 60 * 1000);
}

function convo(
  over: Partial<ConversationReplyReminderConversation> = {},
): ConversationReplyReminderConversation {
  return {
    conversationId: "c1",
    lastMessage: { senderId: "sender", createdAt: daysAgo(3) },
    participantIds: ["sender", "recipient"],
    jobTitle: "Nachtdienst VVT",
    senderName: "Sanne",
    ...over,
  };
}

describe("CONVERSATION_REPLY_REMINDER_DAYS", () => {
  it("vuurt op de stiltedrempel (3) plus de config-offsets (0, 4) → dag 3 en 7", () => {
    expect([...CONVERSATION_REPLY_REMINDER_DAYS]).toEqual([3, 7]);
  });
});

describe("planConversationReplyReminders", () => {
  it("nudget de ontvanger (niet de afzender) op dag 3", () => {
    const plan = planConversationReplyReminders([convo()], NOW);
    expect(plan.reminders).toHaveLength(1);
    const r = plan.reminders[0];
    expect(r?.userId).toBe("recipient");
    expect(r?.notificationType).toBe("CONVERSATION_REPLY_REMINDER");
    expect(r?.stage).toBe("day-3");
    expect(r?.body).toContain("Sanne");
    expect(r?.body).toContain("3 dagen");
    expect(r?.body).toContain('over "Nachtdienst VVT"');
    expect(r?.dedupeKey).toBe("conversation-reply-reminder-c1-recipient-3");
  });

  it("vuurt ook op de vervolg-dag 7", () => {
    const plan = planConversationReplyReminders(
      [convo({ lastMessage: { senderId: "sender", createdAt: daysAgo(7) } })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(1);
    expect(plan.reminders[0]?.stage).toBe("day-7");
  });

  it("vuurt niet op een tussenliggende dag (idempotent per dag)", () => {
    for (const d of [1, 2, 4, 5, 6, 8, 30]) {
      const plan = planConversationReplyReminders(
        [convo({ lastMessage: { senderId: "sender", createdAt: daysAgo(d) } })],
        NOW,
      );
      expect(plan.reminders, `dag ${d}`).toHaveLength(0);
    }
  });

  it("negeert een leeg gesprek zonder laatste bericht", () => {
    const plan = planConversationReplyReminders([convo({ lastMessage: null })], NOW);
    expect(plan.reminders).toHaveLength(0);
  });

  it("nudget elke deelnemer behalve de afzender (3-weg gesprek)", () => {
    const plan = planConversationReplyReminders(
      [convo({ participantIds: ["sender", "recipient", "bemiddelaar"] })],
      NOW,
    );
    expect(plan.reminders.map((r) => r.userId).sort()).toEqual(["bemiddelaar", "recipient"]);
    // Unieke dedupeKeys per ontvanger.
    expect(new Set(plan.reminders.map((r) => r.dedupeKey)).size).toBe(2);
  });

  it("dedupliceert een dubbel voorkomende deelnemer tot één nudge", () => {
    const plan = planConversationReplyReminders(
      [convo({ participantIds: ["sender", "recipient", "recipient"] })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(1);
  });

  it("laat de opdrachttitel weg wanneer er geen opdracht is; valt terug op 'Iemand'", () => {
    const plan = planConversationReplyReminders([convo({ jobTitle: null, senderName: null })], NOW);
    expect(plan.reminders[0]?.body).toContain("Iemand wacht al 3 dagen op je antwoord.");
    expect(plan.reminders[0]?.body).not.toContain('over "');
  });

  it("gebruikt enkelvoud niet op dag 3 (meervoud), maar telt hele dagen (klok-skew → floor)", () => {
    // 3 dagen + 5 uur oud telt nog steeds als dag 3.
    const plan = planConversationReplyReminders(
      [convo({ lastMessage: { senderId: "sender", createdAt: daysAgo(3, 5) } })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(1);
    expect(plan.reminders[0]?.stage).toBe("day-3");
  });

  it("muteert de invoer niet", () => {
    const input = [convo()];
    const snapshot = JSON.stringify(input);
    planConversationReplyReminders(input, NOW);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("conversationReplyReminderWindow", () => {
  it("omvat elk gesprek op een nudge-dag en sluit te-jonge/te-oude gesprekken uit", () => {
    const { notBefore, notAfter } = conversationReplyReminderWindow(NOW);
    // Een net-gestuurd bericht (dag 0) valt na notAfter → buiten het venster.
    expect(daysAgo(0).getTime()).toBeGreaterThan(notAfter.getTime());
    // Dag 3 en dag 7 vallen binnen [notBefore, notAfter].
    for (const d of [3, 7]) {
      expect(daysAgo(d).getTime()).toBeGreaterThanOrEqual(notBefore.getTime());
      expect(daysAgo(d).getTime()).toBeLessThanOrEqual(notAfter.getTime());
    }
    // Ver voorbij de laatste nudge-dag (dag 30) valt vóór notBefore → buiten het venster.
    expect(daysAgo(30).getTime()).toBeLessThan(notBefore.getTime());
  });
});
