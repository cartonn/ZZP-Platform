import { describe, it, expect } from "vitest";
import {
  VERIFICATION_STALE_DAYS,
  daysWaiting,
  waitingLabel,
  summarizeVerificationQueue,
  staleThreshold,
} from "@/lib/verification-queue";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-06-15T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

describe("daysWaiting", () => {
  it("geeft 0 voor vandaag ingediend", () => {
    expect(daysWaiting(NOW, NOW)).toBe(0);
  });

  it("telt hele dagen (floor)", () => {
    expect(daysWaiting(daysAgo(2.9), NOW)).toBe(2);
    expect(daysWaiting(daysAgo(3), NOW)).toBe(3);
  });

  it("nooit negatief bij een toekomstige datum", () => {
    expect(daysWaiting(new Date(NOW.getTime() + DAY_MS), NOW)).toBe(0);
  });

  it("accepteert now als getal (ms)", () => {
    expect(daysWaiting(daysAgo(4), NOW.getTime())).toBe(4);
  });
});

describe("waitingLabel", () => {
  it("toont 'vandaag ingediend' bij 0", () => {
    expect(waitingLabel(0)).toBe("vandaag ingediend");
  });

  it("enkelvoud bij 1 dag", () => {
    expect(waitingLabel(1)).toBe("1 dag wachtend");
  });

  it("meervoud bij meerdere dagen", () => {
    expect(waitingLabel(7)).toBe("7 dagen wachtend");
  });
});

describe("summarizeVerificationQueue", () => {
  it("geeft nullen bij een lege wachtrij", () => {
    expect(summarizeVerificationQueue([], NOW)).toEqual({
      pending: 0,
      oldestDays: 0,
      staleCount: 0,
    });
  });

  it("telt pending en bepaalt de oudste", () => {
    const result = summarizeVerificationQueue(
      [{ updatedAt: daysAgo(1) }, { updatedAt: daysAgo(8) }, { updatedAt: daysAgo(3) }],
      NOW,
    );
    expect(result.pending).toBe(3);
    expect(result.oldestDays).toBe(8);
  });

  it("telt alleen aanvragen >= VERIFICATION_STALE_DAYS als stale", () => {
    const result = summarizeVerificationQueue(
      [
        { updatedAt: daysAgo(0) },
        { updatedAt: daysAgo(VERIFICATION_STALE_DAYS - 1) },
        { updatedAt: daysAgo(VERIFICATION_STALE_DAYS) }, // grensgeval: telt mee
        { updatedAt: daysAgo(VERIFICATION_STALE_DAYS + 4) },
      ],
      NOW,
    );
    expect(result.staleCount).toBe(2);
  });

  it("muteert de invoer niet", () => {
    const items = Object.freeze([{ updatedAt: daysAgo(6) }]);
    expect(() => summarizeVerificationQueue(items, NOW)).not.toThrow();
    expect(items).toHaveLength(1);
  });

  it("werkt met now als getal", () => {
    const result = summarizeVerificationQueue([{ updatedAt: daysAgo(10) }], NOW.getTime());
    expect(result.oldestDays).toBe(10);
    expect(result.staleCount).toBe(1);
  });
});

describe("staleThreshold", () => {
  it("ligt precies VERIFICATION_STALE_DAYS in het verleden", () => {
    const threshold = staleThreshold(NOW);
    expect(threshold.getTime()).toBe(NOW.getTime() - VERIFICATION_STALE_DAYS * DAY_MS);
  });

  it("is consistent met summarizeVerificationQueue op de grens", () => {
    // Een aanvraag exact op de drempel telt als stale (>= grens) én valt onder
    // updatedAt <= staleThreshold(now) — beide paden moeten het eens zijn.
    const onBoundary = daysAgo(VERIFICATION_STALE_DAYS);
    const threshold = staleThreshold(NOW);
    expect(onBoundary.getTime() <= threshold.getTime()).toBe(true);
    expect(summarizeVerificationQueue([{ updatedAt: onBoundary }], NOW).staleCount).toBe(1);
  });

  it("accepteert now als getal", () => {
    expect(staleThreshold(NOW.getTime()).getTime()).toBe(
      NOW.getTime() - VERIFICATION_STALE_DAYS * DAY_MS,
    );
  });
});
