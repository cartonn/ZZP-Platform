import { describe, it, expect } from "vitest";
import {
  planDisputeReminders,
  disputeAgeDays,
  disputeEscalationBacklogCutoff,
  disputeEscalationDedupeKey,
  DISPUTE_ESCALATE_AFTER_DAYS,
  type DisputeReminderCandidate,
} from "@/lib/dispute-reminders";

const NOW = new Date("2026-06-19T12:00:00.000Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function candidate(over: Partial<DisputeReminderCandidate> = {}): DisputeReminderCandidate {
  return {
    collaborationId: "collab-1",
    disputedAt: daysAgo(3),
    collabStatus: "ACTIVE",
    freelancerUserId: "zzp-1",
    clientUserId: "client-1",
    jobTitle: "Verpleegkundige (detachering)",
    ...over,
  };
}

describe("disputeAgeDays", () => {
  it("telt hele dagen dat het dispuut openstaat", () => {
    expect(disputeAgeDays(daysAgo(0), NOW)).toBe(0);
    expect(disputeAgeDays(daysAgo(3), NOW)).toBe(3);
    expect(disputeAgeDays(daysAgo(10), NOW)).toBe(10);
  });

  it("nooit negatief bij een toekomstige datum", () => {
    expect(disputeAgeDays(new Date(NOW.getTime() + 86_400_000), NOW)).toBe(0);
  });
});

describe("planDisputeReminders", () => {
  it("herinnert béíde partijen op een herinneringsdag (dag 3)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(3) })], NOW);
    expect(plan.reminders).toHaveLength(2);
    const recipients = plan.reminders.map((r) => r.userId).sort();
    expect(recipients).toEqual(["client-1", "zzp-1"]);
    expect(plan.escalations).toHaveLength(0);
    // Beide herinneringen dragen dezelfde stage, maar onderscheidende dedupeKeys per ontvanger.
    expect(new Set(plan.reminders.map((r) => r.dedupeKey)).size).toBe(2);
    expect(plan.reminders.every((r) => r.stage === "day-3")).toBe(true);
    expect(plan.reminders[0]!.notificationType).toBe("DISPUTE_REMINDER");
  });

  it("herinnert ook op dag 7", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(7) })], NOW);
    expect(plan.reminders).toHaveLength(2);
    expect(plan.reminders.every((r) => r.stage === "day-7")).toBe(true);
  });

  it("geeft geen herinnering op een tussendag (dag 5)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(5) })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("escaleert ná de laatste herinneringsdag (dag 8 > 7)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(8) })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(1);
    expect(plan.escalations[0]).toMatchObject({
      collaborationId: "collab-1",
      jobTitle: "Verpleegkundige (detachering)",
      ageDays: 8,
      dedupeKey: "dispute-escalation-collab-1",
    });
  });

  it("escaleert niet exact op de laatste herinneringsdag (dag 7, geen >)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(7) })], NOW);
    expect(plan.escalations).toHaveLength(0);
  });

  it("negeert een samenwerking zonder open dispuut (disputedAt null)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: null })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("negeert een geannuleerde samenwerking (geen bemiddeling meer)", () => {
    const plan = planDisputeReminders(
      [candidate({ disputedAt: daysAgo(8), collabStatus: "CANCELLED" })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("dedupeKey bevat collaboratie, ontvanger én dag (onderscheidt nieuwe herinneringsdag)", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(3) })], NOW);
    expect(plan.reminders.map((r) => r.dedupeKey).sort()).toEqual([
      "dispute-reminder-collab-1-client-1-3",
      "dispute-reminder-collab-1-zzp-1-3",
    ]);
  });

  it("muteert de invoer niet en accepteert ongesorteerde input", () => {
    const input = [
      candidate({ collaborationId: "c-8", disputedAt: daysAgo(8) }),
      candidate({ collaborationId: "c-3", disputedAt: daysAgo(3) }),
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    const plan = planDisputeReminders(input, NOW);
    expect(plan.reminders).toHaveLength(2); // alleen c-3
    expect(plan.escalations).toHaveLength(1); // alleen c-8
    expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot);
  });

  it("noemt de opdrachttitel en de leeftijd in de herinneringstekst", () => {
    const plan = planDisputeReminders([candidate({ disputedAt: daysAgo(3) })], NOW);
    expect(plan.reminders[0]!.body).toContain("Verpleegkundige (detachering)");
    expect(plan.reminders[0]!.body).toContain("3 dagen");
  });
});

describe("disputeEscalationBacklogCutoff / DISPUTE_ESCALATE_AFTER_DAYS", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it("spiegelt de config-drempel ESCALATE_AFTER (huidige default = 7 dagen)", () => {
    // Config-default: REMINDERS.disputeReminderDays = [3, 7] → Math.max = 7. Verandert de config,
    // dan schuift de constante mee — de assert bewaakt zowel de waarde als de her-export.
    expect(DISPUTE_ESCALATE_AFTER_DAYS).toBe(7);
  });

  it("legt de cutoff exact (DISPUTE_ESCALATE_AFTER_DAYS + 1) dagen vóór now", () => {
    const cutoff = disputeEscalationBacklogCutoff(NOW);
    expect(NOW.getTime() - cutoff.getTime()).toBe((DISPUTE_ESCALATE_AFTER_DAYS + 1) * DAY_MS);
  });

  it("drift-gate: dispuut op de cutoff escaleert, één ms na de cutoff niet (spijkert where aan plan)", () => {
    // Een dispuut wier disputedAt exact op de cutoff ligt is 8 hele dagen oud (d=8, d>7 → escaleert).
    // Eén milliseconde na de cutoff (dus jonger dan 8 hele dagen) valt d op 7 (d>7 → false).
    const cutoff = disputeEscalationBacklogCutoff(NOW);
    const justOverdue = candidate({ collaborationId: "on-cutoff", disputedAt: cutoff });
    const justNotOverdue = candidate({
      collaborationId: "past-cutoff",
      disputedAt: new Date(cutoff.getTime() + 1),
    });

    const planOverdue = planDisputeReminders([justOverdue], NOW);
    expect(planOverdue.escalations.map((e) => e.collaborationId)).toEqual(["on-cutoff"]);

    const planFresh = planDisputeReminders([justNotOverdue], NOW);
    expect(planFresh.escalations).toEqual([]);
  });
});

describe("disputeEscalationDedupeKey", () => {
  it("levert een stabiele sleutel per samenwerking", () => {
    expect(disputeEscalationDedupeKey("abc-123")).toBe("dispute-escalation-abc-123");
  });

  it("wordt door planDisputeReminders gebruikt (geen parallelle inline literal)", () => {
    // Drift-gate: als iemand de helper vergeet en terug naar een inline literal in de planner gaat,
    // moet deze assert breken zodra de sleutelvorm daar afwijkt.
    const plan = planDisputeReminders(
      [candidate({ collaborationId: "collab-X", disputedAt: daysAgo(8) })],
      NOW,
    );
    expect(plan.escalations[0]?.dedupeKey).toBe(disputeEscalationDedupeKey("collab-X"));
  });
});
