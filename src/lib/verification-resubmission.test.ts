import { describe, it, expect } from "vitest";
import {
  resubmissionSignal,
  resubmissionBadgeLabel,
  countResubmissions,
  type PriorRejection,
} from "@/lib/verification-resubmission";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-06-15T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

describe("resubmissionSignal", () => {
  it("geeft null zonder eerdere afwijzing (eerste inzending)", () => {
    expect(resubmissionSignal([])).toBeNull();
  });

  it("herkent een enkele eerdere afwijzing", () => {
    const rejections: PriorRejection[] = [{ reason: "Document onleesbaar", createdAt: daysAgo(3) }];
    const signal = resubmissionSignal(rejections);
    expect(signal).toEqual({
      count: 1,
      latestReason: "Document onleesbaar",
      latestAt: daysAgo(3),
    });
  });

  it("kiest de meest recente afwijzing ongeacht de invoervolgorde", () => {
    const oud: PriorRejection = { reason: "Verkeerd type", createdAt: daysAgo(30) };
    const nieuw: PriorRejection = { reason: "Naam komt niet overeen", createdAt: daysAgo(2) };
    // Bewust oudste-eerst aangeleverd: de helper moet zelf de recentste kiezen.
    const signal = resubmissionSignal([oud, nieuw]);
    expect(signal?.count).toBe(2);
    expect(signal?.latestReason).toBe("Naam komt niet overeen");
    expect(signal?.latestAt).toEqual(daysAgo(2));
  });

  it("trimt de reden en normaliseert een lege/whitespace reden naar null", () => {
    expect(resubmissionSignal([{ reason: "  Te oud  ", createdAt: NOW }])?.latestReason).toBe(
      "Te oud",
    );
    expect(resubmissionSignal([{ reason: "   ", createdAt: NOW }])?.latestReason).toBeNull();
    expect(resubmissionSignal([{ reason: null, createdAt: NOW }])?.latestReason).toBeNull();
  });

  it("muteert de invoer niet", () => {
    const rejections: PriorRejection[] = [
      { reason: "A", createdAt: daysAgo(1) },
      { reason: "B", createdAt: daysAgo(5) },
    ];
    const snapshot = rejections.map((r) => ({ ...r }));
    resubmissionSignal(rejections);
    expect(rejections).toEqual(snapshot);
  });
});

describe("resubmissionBadgeLabel", () => {
  it("noemt geen aantal bij één eerdere afwijzing", () => {
    expect(resubmissionBadgeLabel(1)).toBe("Herindiening na afwijzing");
  });

  it("noemt het aantal bij meerdere eerdere afwijzingen", () => {
    expect(resubmissionBadgeLabel(2)).toBe("Herindiening · 2× eerder afgewezen");
    expect(resubmissionBadgeLabel(4)).toBe("Herindiening · 4× eerder afgewezen");
  });
});

describe("countResubmissions", () => {
  it("telt alleen inzendingen met minstens één eerdere afwijzing", () => {
    const items = [
      { verifications: [] },
      { verifications: [{ reason: "x", createdAt: NOW }] },
      {
        verifications: [
          { reason: "y", createdAt: daysAgo(2) },
          { reason: "z", createdAt: NOW },
        ],
      },
    ];
    expect(countResubmissions(items)).toBe(2);
  });

  it("geeft 0 voor een lege wachtrij", () => {
    expect(countResubmissions([])).toBe(0);
  });
});
