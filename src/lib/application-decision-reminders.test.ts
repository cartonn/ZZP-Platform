// Unit-tests voor de pure planApplicationDecisionReminders. Drempels: VIEWED 14 / SHORTLIST 21
// (WAIT_ATTENTION_DAYS) + offsets [0, 7] (REMINDERS.applicationDecisionDays) → VIEWED vuurt op dag
// 14 en 21, SHORTLIST op dag 21 en 28. Klok vast geïnjecteerd.

import { describe, it, expect } from "vitest";
import {
  planApplicationDecisionReminders,
  daysSince,
  type ApplicationDecisionCandidate,
} from "@/lib/application-decision-reminders";

const NOW = new Date("2026-08-21T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function cand(over: Partial<ApplicationDecisionCandidate> = {}): ApplicationDecisionCandidate {
  return {
    applicationId: "app-1",
    status: "VIEWED",
    createdAt: daysAgo(14),
    hasCollaboration: false,
    jobStatus: "PUBLISHED",
    clientUserId: "client-1",
    jobTitle: "Nachtdienst VVT",
    ...over,
  };
}

describe("daysSince", () => {
  it("telt hele dagen en clampt een toekomstig moment naar 0", () => {
    expect(daysSince(daysAgo(14), NOW)).toBe(14);
    expect(daysSince(daysAgo(0), NOW)).toBe(0);
    expect(daysSince(new Date(NOW.getTime() + 5 * 86_400_000), NOW)).toBe(0);
  });
});

describe("planApplicationDecisionReminders", () => {
  it("geeft niets bij een lege invoer", () => {
    expect(planApplicationDecisionReminders([], NOW).reminders).toHaveLength(0);
  });

  it("nudget een VIEWED-reactie op de drempel (dag 14)", () => {
    const { reminders } = planApplicationDecisionReminders([cand({ createdAt: daysAgo(14) })], NOW);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      applicationId: "app-1",
      userId: "client-1",
      notificationType: "APPLICATION_DECISION_REMINDER",
      stage: "day-14",
      dedupeKey: "application-decision-reminder-app-1-14",
    });
    expect(reminders[0]?.body).toContain("Nachtdienst VVT");
    expect(reminders[0]?.body).toContain("14 dagen");
  });

  it("stuurt een vervolg-nudge een week later (dag 21) met eigen dedupeKey", () => {
    const { reminders } = planApplicationDecisionReminders([cand({ createdAt: daysAgo(21) })], NOW);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.dedupeKey).toBe("application-decision-reminder-app-1-21");
  });

  it("zwijgt onder de drempel en tussen de vuurdagen in", () => {
    for (const d of [10, 13, 15, 20, 22]) {
      const { reminders } = planApplicationDecisionReminders(
        [cand({ createdAt: daysAgo(d) })],
        NOW,
      );
      expect(reminders, `dag ${d}`).toHaveLength(0);
    }
  });

  it("hanteert de hogere SHORTLIST-drempel (dag 21, niet 14)", () => {
    expect(
      planApplicationDecisionReminders([cand({ status: "SHORTLIST", createdAt: daysAgo(14) })], NOW)
        .reminders,
    ).toHaveLength(0);
    expect(
      planApplicationDecisionReminders([cand({ status: "SHORTLIST", createdAt: daysAgo(21) })], NOW)
        .reminders,
    ).toHaveLength(1);
    expect(
      planApplicationDecisionReminders([cand({ status: "SHORTLIST", createdAt: daysAgo(28) })], NOW)
        .reminders,
    ).toHaveLength(1);
  });

  it("negeert NEW (gedekt door de nieuwe-reacties-taak) en besliste statussen", () => {
    for (const status of ["NEW", "REJECTED", "ACCEPTED", "WITHDRAWN"]) {
      const { reminders } = planApplicationDecisionReminders(
        [cand({ status, createdAt: daysAgo(30) })],
        NOW,
      );
      expect(reminders, status).toHaveLength(0);
    }
  });

  it("nudget niet zodra er een samenwerking uit de reactie is voortgekomen", () => {
    expect(
      planApplicationDecisionReminders([cand({ hasCollaboration: true })], NOW).reminders,
    ).toHaveLength(0);
  });

  it("nudget alleen bij een gepubliceerde opdracht (niet concept/gesloten)", () => {
    for (const jobStatus of ["DRAFT", "CLOSED"]) {
      expect(
        planApplicationDecisionReminders([cand({ jobStatus })], NOW).reminders,
        jobStatus,
      ).toHaveLength(0);
    }
  });
});
