import { describe, expect, it } from "vitest";
import {
  PERFORMANCE_APPROVAL_STALE_DAYS,
  summarizePerformanceApproval,
  daysWaiting,
  waitingLabel,
} from "@/lib/performance-approval";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(now: number, days: number): Date {
  return new Date(now - days * DAY);
}

describe("performance-approval — re-exports", () => {
  it("daysWaiting/waitingLabel zijn beschikbaar via deze module", () => {
    const now = Date.UTC(2026, 5, 15);
    expect(daysWaiting(daysAgo(now, 2), now)).toBe(2);
    expect(waitingLabel(0)).toBe("vandaag ingediend");
    expect(waitingLabel(1)).toBe("1 dag wachtend");
    expect(waitingLabel(4)).toBe("4 dagen wachtend");
  });
});

describe("summarizePerformanceApproval", () => {
  const now = Date.UTC(2026, 5, 15);

  it("lege invoer → nullen", () => {
    expect(summarizePerformanceApproval([], now)).toEqual({
      pending: 0,
      oldestDays: 0,
      staleCount: 0,
    });
  });

  it("negeert items zonder submittedAt", () => {
    const result = summarizePerformanceApproval(
      [{ submittedAt: null }, { submittedAt: daysAgo(now, 1) }, { submittedAt: null }],
      now,
    );
    expect(result.pending).toBe(1);
  });

  it("telt pending, bepaalt de oudste en stale-telling", () => {
    const result = summarizePerformanceApproval(
      [
        { submittedAt: daysAgo(now, 0) },
        { submittedAt: daysAgo(now, 2) },
        { submittedAt: daysAgo(now, 5) },
      ],
      now,
    );
    expect(result.pending).toBe(3);
    expect(result.oldestDays).toBe(5);
    // stale = >= 3 dagen → alleen de 5-dagen-prestatie
    expect(result.staleCount).toBe(1);
  });

  it("grensgeval: exact op de drempel telt mee als stale", () => {
    const result = summarizePerformanceApproval(
      [{ submittedAt: daysAgo(now, PERFORMANCE_APPROVAL_STALE_DAYS) }],
      now,
    );
    expect(result.staleCount).toBe(1);
  });

  it("één dag onder de drempel telt niet als stale", () => {
    const result = summarizePerformanceApproval(
      [{ submittedAt: daysAgo(now, PERFORMANCE_APPROVAL_STALE_DAYS - 1) }],
      now,
    );
    expect(result.staleCount).toBe(0);
    expect(result.pending).toBe(1);
  });

  it("accepteert een numerieke klok", () => {
    const result = summarizePerformanceApproval([{ submittedAt: daysAgo(now, 4) }], now);
    expect(result.oldestDays).toBe(4);
    expect(result.staleCount).toBe(1);
  });

  it("muteert de invoer niet", () => {
    const items = Object.freeze([{ submittedAt: daysAgo(now, 2) }]);
    expect(() => summarizePerformanceApproval(items, now)).not.toThrow();
    expect(items).toHaveLength(1);
  });
});
