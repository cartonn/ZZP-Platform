import { describe, it, expect } from "vitest";
import {
  planPerformanceApprovalReminders,
  daysSince,
  type PerformanceApprovalCandidate,
} from "@/lib/performance-approval-reminders";

const NOW = new Date("2026-06-18T12:00:00.000Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function candidate(over: Partial<PerformanceApprovalCandidate> = {}): PerformanceApprovalCandidate {
  return {
    performanceId: "perf-1",
    status: "SUBMITTED",
    submittedAt: daysAgo(3),
    clientUserId: "client-1",
    collabStatus: "ACTIVE",
    disputed: false,
    label: "Een ingediende urenstaat",
    ...over,
  };
}

describe("daysSince", () => {
  it("telt hele dagen sinds indienen", () => {
    expect(daysSince(daysAgo(0), NOW)).toBe(0);
    expect(daysSince(daysAgo(3), NOW)).toBe(3);
    expect(daysSince(daysAgo(10), NOW)).toBe(10);
  });
});

describe("planPerformanceApprovalReminders", () => {
  it("herinnert de opdrachtgever op de geconfigureerde dagen (3 en 7)", () => {
    const day3 = planPerformanceApprovalReminders([candidate({ submittedAt: daysAgo(3) })], NOW);
    expect(day3.reminders).toHaveLength(1);
    const r3 = day3.reminders[0]!;
    expect(r3.userId).toBe("client-1");
    expect(r3.notificationType).toBe("PERFORMANCE_APPROVAL_REMINDER");
    expect(r3.stage).toBe("day-3");
    expect(r3.dedupeKey).toBe("performance-approval-reminder-perf-1-3");

    const day7 = planPerformanceApprovalReminders([candidate({ submittedAt: daysAgo(7) })], NOW);
    expect(day7.reminders).toHaveLength(1);
    expect(day7.reminders[0]!.stage).toBe("day-7");
  });

  it("herinnert niet op een tussenliggende dag (geen dagelijks gezeur)", () => {
    for (const d of [1, 2, 4, 5, 6]) {
      const plan = planPerformanceApprovalReminders([candidate({ submittedAt: daysAgo(d) })], NOW);
      expect(plan.reminders, `dag ${d}`).toHaveLength(0);
    }
  });

  it("escaleert naar het platform ná de laatste herinnering (dag > 7)", () => {
    const plan = planPerformanceApprovalReminders([candidate({ submittedAt: daysAgo(8) })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(1);
    expect(plan.escalations[0]!.daysSince).toBe(8);
    expect(plan.escalations[0]!.dedupeKey).toBe("performance-approval-escalation-perf-1");
  });

  it("escaleert niet precies op de escalatiedrempel (dag 7 is nog een herinnering)", () => {
    const plan = planPerformanceApprovalReminders([candidate({ submittedAt: daysAgo(7) })], NOW);
    expect(plan.escalations).toHaveLength(0);
  });

  it("negeert prestaties die niet meer wachten op goedkeuring", () => {
    for (const status of ["DRAFT", "APPROVED", "REJECTED"]) {
      const plan = planPerformanceApprovalReminders(
        [candidate({ status, submittedAt: daysAgo(3) })],
        NOW,
      );
      expect(plan.reminders, status).toHaveLength(0);
    }
  });

  it("negeert een prestatie zonder submittedAt", () => {
    const plan = planPerformanceApprovalReminders([candidate({ submittedAt: null })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("nudget niet op een geannuleerde samenwerking", () => {
    const plan = planPerformanceApprovalReminders(
      [candidate({ collabStatus: "CANCELLED", submittedAt: daysAgo(3) })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(0);
  });

  it("nudget niet op een betwiste (bevroren) samenwerking", () => {
    const plan = planPerformanceApprovalReminders(
      [candidate({ disputed: true, submittedAt: daysAgo(8) })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("muteert de invoer niet en verwerkt meerdere kandidaten", () => {
    const input = [
      candidate({ performanceId: "p1", submittedAt: daysAgo(3) }),
      candidate({ performanceId: "p2", submittedAt: daysAgo(8), clientUserId: "client-2" }),
      candidate({ performanceId: "p3", submittedAt: daysAgo(1) }),
    ];
    const snapshot = JSON.stringify(input);
    const plan = planPerformanceApprovalReminders(input, NOW);
    expect(plan.reminders.map((r) => r.performanceId)).toEqual(["p1"]);
    expect(plan.escalations.map((e) => e.performanceId)).toEqual(["p2"]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
