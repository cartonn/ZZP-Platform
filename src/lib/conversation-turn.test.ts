import { describe, expect, it } from "vitest";
import {
  CONVERSATION_STALE_DAYS,
  conversationTurn,
  daysSince,
  isStaleAwaitingReply,
  staleLabel,
  summarizeConversationTurns,
  type ConversationTurn,
} from "./conversation-turn";

const ME = "user-me";
const OTHER = "user-other";
const NOW = new Date("2026-06-17T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("conversationTurn", () => {
  it("is 'none' voor een leeg gesprek", () => {
    expect(conversationTurn({ lastMessage: null, unreadFromOther: 0, viewerId: ME })).toBe("none");
  });

  it("is 'yours' zodra er ongelezen berichten van de tegenpartij staan", () => {
    expect(
      conversationTurn({
        lastMessage: { senderId: OTHER, createdAt: daysAgo(1) },
        unreadFromOther: 2,
        viewerId: ME,
      }),
    ).toBe("yours");
  });

  it("is 'yours' bij ongelezen berichten zelfs als de kijker het laatste bericht stuurde", () => {
    // Verdedigt het primaat van de ongelezen-telling boven de senderId van het laatste bericht.
    expect(
      conversationTurn({
        lastMessage: { senderId: ME, createdAt: daysAgo(1) },
        unreadFromOther: 1,
        viewerId: ME,
      }),
    ).toBe("yours");
  });

  it("is 'theirs' wanneer de kijker het laatste bericht stuurde en alles gelezen is", () => {
    expect(
      conversationTurn({
        lastMessage: { senderId: ME, createdAt: daysAgo(2) },
        unreadFromOther: 0,
        viewerId: ME,
      }),
    ).toBe("theirs");
  });

  it("is 'none' wanneer het laatste bericht van de tegenpartij is maar al gelezen", () => {
    expect(
      conversationTurn({
        lastMessage: { senderId: OTHER, createdAt: daysAgo(2) },
        unreadFromOther: 0,
        viewerId: ME,
      }),
    ).toBe("none");
  });
});

describe("daysSince", () => {
  it("telt hele dagen en is nooit negatief", () => {
    expect(daysSince(daysAgo(3), NOW)).toBe(3);
    expect(daysSince(daysAgo(0), NOW)).toBe(0);
    expect(daysSince(new Date(NOW.getTime() + 60_000), NOW)).toBe(0);
  });

  it("accepteert een numerieke now", () => {
    expect(daysSince(daysAgo(2), NOW.getTime())).toBe(2);
  });
});

describe("isStaleAwaitingReply", () => {
  it("is alleen waar voor de wachtende kant ('theirs')", () => {
    const old = { senderId: OTHER, createdAt: daysAgo(10) };
    expect(isStaleAwaitingReply("yours", old, NOW)).toBe(false);
    expect(isStaleAwaitingReply("none", old, NOW)).toBe(false);
  });

  it("wordt stil op exact de drempel", () => {
    const msg = { senderId: ME, createdAt: daysAgo(CONVERSATION_STALE_DAYS) };
    expect(isStaleAwaitingReply("theirs", msg, NOW)).toBe(true);
  });

  it("is niet stil net onder de drempel", () => {
    const msg = { senderId: ME, createdAt: daysAgo(CONVERSATION_STALE_DAYS - 1) };
    expect(isStaleAwaitingReply("theirs", msg, NOW)).toBe(false);
  });

  it("is false zonder laatste bericht", () => {
    expect(isStaleAwaitingReply("theirs", null, NOW)).toBe(false);
  });

  it("respecteert een aangepaste drempel", () => {
    const msg = { senderId: ME, createdAt: daysAgo(2) };
    expect(isStaleAwaitingReply("theirs", msg, NOW, 5)).toBe(false);
    expect(isStaleAwaitingReply("theirs", msg, NOW, 2)).toBe(true);
  });
});

describe("staleLabel", () => {
  it("gebruikt enkel-/meervoud", () => {
    expect(staleLabel(1)).toBe("1 dag geen reactie");
    expect(staleLabel(4)).toBe("4 dagen geen reactie");
  });
});

describe("summarizeConversationTurns", () => {
  it("telt beurten en stilte op zonder de invoer te muteren", () => {
    const items: { turn: ConversationTurn; stale: boolean }[] = [
      { turn: "yours", stale: false },
      { turn: "yours", stale: false },
      { turn: "theirs", stale: true },
      { turn: "theirs", stale: false },
      { turn: "none", stale: false },
    ];
    const snapshot = JSON.stringify(items);
    expect(summarizeConversationTurns(items)).toEqual({
      awaitingYou: 2,
      awaitingThem: 2,
      stale: 1,
    });
    expect(JSON.stringify(items)).toBe(snapshot);
  });

  it("geeft nullen voor een lege lijst", () => {
    expect(summarizeConversationTurns([])).toEqual({ awaitingYou: 0, awaitingThem: 0, stale: 0 });
  });

  it("telt stilte alleen mee bij 'theirs'", () => {
    // Een 'yours'-item met stale:true mag de stale-teller niet beïnvloeden.
    expect(
      summarizeConversationTurns([
        { turn: "yours", stale: true },
        { turn: "theirs", stale: true },
      ]),
    ).toEqual({ awaitingYou: 1, awaitingThem: 1, stale: 1 });
  });
});
