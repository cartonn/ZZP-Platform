import { describe, expect, it } from "vitest";
import {
  WAIT_ATTENTION_DAYS,
  countApplicationsAwaitingAttention,
  summarizeApplicationWait,
} from "./application-wait";

const NOW = new Date("2026-06-25T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe("summarizeApplicationWait", () => {
  it("geeft null voor besloten statussen", () => {
    for (const status of ["REJECTED", "ACCEPTED", "WITHDRAWN"]) {
      expect(
        summarizeApplicationWait({ status, createdAt: daysAgo(30), hasCollaboration: false }, NOW),
      ).toBeNull();
    }
  });

  it("geeft null zodra er een samenwerking is, ook bij een wachtende status", () => {
    expect(
      summarizeApplicationWait(
        { status: "SHORTLIST", createdAt: daysAgo(40), hasCollaboration: true },
        NOW,
      ),
    ).toBeNull();
  });

  it("telt hele dagen en klemt een toekomstige createdAt op 0", () => {
    expect(
      summarizeApplicationWait(
        { status: "NEW", createdAt: daysAgo(3), hasCollaboration: false },
        NOW,
      )?.daysWaiting,
    ).toBe(3);
    expect(
      summarizeApplicationWait(
        { status: "NEW", createdAt: new Date(NOW.getTime() + 86_400_000), hasCollaboration: false },
        NOW,
      )?.daysWaiting,
    ).toBe(0);
  });

  it("markeert NEW als aandacht vanaf de drempel, niet eronder", () => {
    const below = summarizeApplicationWait(
      { status: "NEW", createdAt: daysAgo(WAIT_ATTENTION_DAYS.NEW - 1), hasCollaboration: false },
      NOW,
    );
    const at = summarizeApplicationWait(
      { status: "NEW", createdAt: daysAgo(WAIT_ATTENTION_DAYS.NEW), hasCollaboration: false },
      NOW,
    );
    expect(below?.attention).toBe(false);
    expect(at?.attention).toBe(true);
  });

  it("hanteert per fase een eigen, oplopende drempel", () => {
    // 14 dagen: NEW + VIEWED zijn over hun drempel, SHORTLIST nog niet (21).
    const age = 14;
    expect(
      summarizeApplicationWait(
        { status: "NEW", createdAt: daysAgo(age), hasCollaboration: false },
        NOW,
      )?.attention,
    ).toBe(true);
    expect(
      summarizeApplicationWait(
        { status: "VIEWED", createdAt: daysAgo(age), hasCollaboration: false },
        NOW,
      )?.attention,
    ).toBe(true);
    expect(
      summarizeApplicationWait(
        { status: "SHORTLIST", createdAt: daysAgo(age), hasCollaboration: false },
        NOW,
      )?.attention,
    ).toBe(false);
  });
});

describe("countApplicationsAwaitingAttention", () => {
  it("telt alleen de wachtende reacties die over hun drempel zijn", () => {
    const inputs = [
      { status: "NEW", createdAt: daysAgo(10), hasCollaboration: false }, // attention
      { status: "VIEWED", createdAt: daysAgo(3), hasCollaboration: false }, // te vers
      { status: "SHORTLIST", createdAt: daysAgo(30), hasCollaboration: false }, // attention
      { status: "ACCEPTED", createdAt: daysAgo(99), hasCollaboration: false }, // besloten
      { status: "NEW", createdAt: daysAgo(99), hasCollaboration: true }, // samenwerking
    ];
    expect(countApplicationsAwaitingAttention(inputs, NOW)).toBe(2);
  });

  it("geeft 0 voor een lege set", () => {
    expect(countApplicationsAwaitingAttention([], NOW)).toBe(0);
  });
});
