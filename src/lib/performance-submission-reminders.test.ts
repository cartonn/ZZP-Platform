import { describe, expect, it } from "vitest";
import {
  planPerformanceSubmissionReminders,
  daysSince,
  type PerformanceSubmissionCandidate,
} from "@/lib/performance-submission-reminders";

const now = new Date("2026-06-19T12:00:00Z");

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 86400000);
}

function cand(
  overrides: Partial<PerformanceSubmissionCandidate> &
    Pick<PerformanceSubmissionCandidate, "collaborationId">,
): PerformanceSubmissionCandidate {
  return {
    freelancerUserId: "f1",
    jobTitle: "Verpleegkundige",
    lastHoursSubmittedAt: daysAgo(7),
    hasOpenSubmission: false,
    ...overrides,
  };
}

describe("daysSince", () => {
  it("telt hele dagen sinds de laatste indiening", () => {
    expect(daysSince(daysAgo(7), now)).toBe(7);
    expect(daysSince(now, now)).toBe(0);
  });
});

describe("planPerformanceSubmissionReminders", () => {
  it("herinnert op dag 7 en dag 14 (aan de ZZP'er)", () => {
    const plan = planPerformanceSubmissionReminders(
      [
        cand({ collaborationId: "c7", lastHoursSubmittedAt: daysAgo(7) }),
        cand({ collaborationId: "c14", lastHoursSubmittedAt: daysAgo(14) }),
      ],
      now,
    );
    expect(plan.reminders.map((r) => r.stage).sort()).toEqual(["day-14", "day-7"]);
    expect(plan.reminders.every((r) => r.userId === "f1")).toBe(true);
    expect(
      plan.reminders.every((r) => r.notificationType === "PERFORMANCE_SUBMISSION_REMINDER"),
    ).toBe(true);
  });

  it("herinnert niet op een tussenliggende dag", () => {
    const plan = planPerformanceSubmissionReminders(
      [cand({ collaborationId: "c10", lastHoursSubmittedAt: daysAgo(10) })],
      now,
    );
    expect(plan.reminders).toHaveLength(0);
  });

  it("slaat een samenwerking met iets in concept/ter beoordeling over", () => {
    const plan = planPerformanceSubmissionReminders(
      [
        cand({
          collaborationId: "cOpen",
          lastHoursSubmittedAt: daysAgo(7),
          hasOpenSubmission: true,
        }),
      ],
      now,
    );
    expect(plan.reminders).toHaveLength(0);
  });

  it("herinnert niet wanneer er nog nooit uren zijn ingediend", () => {
    const plan = planPerformanceSubmissionReminders(
      [cand({ collaborationId: "cFresh", lastHoursSubmittedAt: null })],
      now,
    );
    expect(plan.reminders).toHaveLength(0);
  });

  it("ankert de dedupeKey op de laatste indiening zodat een nieuwe periode opnieuw mag herinneren", () => {
    const periodA = planPerformanceSubmissionReminders(
      [cand({ collaborationId: "c1", lastHoursSubmittedAt: daysAgo(7) })],
      now,
    );
    // Latere periode: dezelfde samenwerking, een nieuwere laatste indiening, weer 7 dagen later.
    const later = new Date("2026-07-10T12:00:00Z");
    const periodB = planPerformanceSubmissionReminders(
      [
        cand({
          collaborationId: "c1",
          lastHoursSubmittedAt: new Date(later.getTime() - 7 * 86400000),
        }),
      ],
      later,
    );
    expect(periodA.reminders[0]?.dedupeKey).not.toBe(periodB.reminders[0]?.dedupeKey);
    expect(periodA.reminders[0]?.dedupeKey).toContain("perf-submission-reminder-c1-");
  });
});
