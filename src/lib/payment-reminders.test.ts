import { describe, expect, it } from "vitest";
import {
  planPaymentReminders,
  daysUntil,
  daysOverdue,
  currentDunningStage,
  type PaymentReminderCandidate,
} from "@/lib/payment-reminders";

const now = new Date("2026-05-29T12:00:00Z");

function cand(
  overrides: Partial<PaymentReminderCandidate> & Pick<PaymentReminderCandidate, "invoiceId">,
): PaymentReminderCandidate {
  return {
    lifecycleStatus: "APPROVED",
    dueAt: null,
    freelancerUserId: "f1",
    clientUserId: "c1",
    partyInvoiceNumber: "2026-0001",
    ...overrides,
  };
}

function inDays(n: number): Date {
  return new Date(now.getTime() + n * 86400000);
}

// ---------------------------------------------------------------------------
// Existing tests (must remain passing)
// ---------------------------------------------------------------------------

describe("daysUntil", () => {
  it("telt hele dagen, negatief na de vervaldag", () => {
    expect(daysUntil(inDays(5), now)).toBe(5);
    expect(daysUntil(inDays(-1), now)).toBe(-1);
  });
});

describe("planPaymentReminders", () => {
  it("herinnert 5 en 1 dag vóór de vervaldag (opdrachtgever)", () => {
    const plan = planPaymentReminders(
      [cand({ invoiceId: "i5", dueAt: inDays(5) }), cand({ invoiceId: "i1", dueAt: inDays(1) })],
      now,
    );
    expect(plan.reminders.map((r) => r.stage).sort()).toEqual(["before-1", "before-5"]);
    expect(plan.reminders.every((r) => r.userId === "c1" && !r.overdue)).toBe(true);
    expect(plan.toMarkOverdue).toHaveLength(0);
  });

  it("herinnert niet op een dag die niet in de config staat", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "i3", dueAt: inDays(3) })], now);
    expect(plan.reminders).toHaveLength(0);
  });

  it("markeert een verstreken goedgekeurde factuur als OVERDUE en signaleert beide partijen", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iLate", dueAt: inDays(-2) })], now);
    expect(plan.toMarkOverdue).toEqual(["iLate"]);
    expect(plan.reminders.map((r) => r.userId).sort()).toEqual(["c1", "f1"]);
    expect(plan.reminders.every((r) => r.overdue)).toBe(true);
  });

  it("een al-OVERDUE factuur wordt niet opnieuw gemarkeerd", () => {
    const plan = planPaymentReminders(
      [cand({ invoiceId: "iOv", dueAt: inDays(-10), lifecycleStatus: "OVERDUE" })],
      now,
    );
    expect(plan.toMarkOverdue).toHaveLength(0);
    expect(plan.reminders.length).toBeGreaterThan(0); // signaal blijft (dedup bij de runner)
  });

  it("negeert facturen die niet op betaling wachten", () => {
    const plan = planPaymentReminders(
      [
        cand({ invoiceId: "iPaid", dueAt: inDays(-5), lifecycleStatus: "PAID" }),
        cand({ invoiceId: "iDraft", dueAt: inDays(2), lifecycleStatus: "DRAFT" }),
        cand({ invoiceId: "iNoDue", dueAt: null }),
      ],
      now,
    );
    expect(plan.toMarkOverdue).toHaveLength(0);
    expect(plan.reminders).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// New tests: dunning ladder
// ---------------------------------------------------------------------------

describe("daysOverdue", () => {
  it("is 0 op de vervaldag zelf", () => {
    const due = now;
    expect(daysOverdue(due, now)).toBe(0);
  });

  it("groeit na de vervaldag", () => {
    expect(daysOverdue(inDays(-3), now)).toBe(3);
    expect(daysOverdue(inDays(-14), now)).toBe(14);
  });
});

describe("currentDunningStage", () => {
  it("geeft null terug voor een toekomstige vervaldag", () => {
    expect(currentDunningStage(inDays(5), now)).toBeNull();
  });

  it("geeft null terug voor null dueAt", () => {
    expect(currentDunningStage(null, now)).toBeNull();
  });

  it("geeft REMINDER terug op de vervaldag zelf (0 dagen over)", () => {
    // daysUntil(now, now) === 0, so >=0 branch — should be null
    // But at exactly -1 day it flips negative
    expect(currentDunningStage(inDays(-1), now)).toMatchObject({ level: "REMINDER" });
  });

  it("geeft FIRST_NOTICE terug bij 20 dagen te laat", () => {
    const stage = currentDunningStage(inDays(-20), now);
    expect(stage).not.toBeNull();
    expect(stage!.level).toBe("FIRST_NOTICE");
    expect(stage!.daysOverdue).toBe(20);
  });

  it("geeft SECOND_NOTICE terug bij 35 dagen te laat", () => {
    const stage = currentDunningStage(inDays(-35), now);
    expect(stage!.level).toBe("SECOND_NOTICE");
  });

  it("geeft FINAL_NOTICE terug bij 50 dagen te laat", () => {
    const stage = currentDunningStage(inDays(-50), now);
    expect(stage!.level).toBe("FINAL_NOTICE");
  });
});

describe("aanmaningsladder — niveauprogessie", () => {
  const cases: Array<{ daysLate: number; expectedLevel: string }> = [
    { daysLate: 2, expectedLevel: "REMINDER" },
    { daysLate: 15, expectedLevel: "FIRST_NOTICE" },
    { daysLate: 31, expectedLevel: "SECOND_NOTICE" },
    { daysLate: 46, expectedLevel: "FINAL_NOTICE" },
  ];

  for (const { daysLate, expectedLevel } of cases) {
    it(`produceert niveau ${expectedLevel} bij ${daysLate} dagen te laat`, () => {
      const plan = planPaymentReminders([cand({ invoiceId: "iD", dueAt: inDays(-daysLate) })], now);
      expect(plan.reminders.every((r) => r.stage === expectedLevel)).toBe(true);
      expect(plan.reminders.every((r) => r.dedupeKey.includes(expectedLevel))).toBe(true);
    });
  }
});

describe("aanmaningsladder — precies 2 reminders per niveau", () => {
  it("elke overdue factuur krijgt client- en freelancer-reminder met unieke dedupeKeys", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iX", dueAt: inDays(-15) })], now);
    expect(plan.reminders).toHaveLength(2);
    const keys = plan.reminders.map((r) => r.dedupeKey);
    expect(new Set(keys).size).toBe(2); // uniek
    const clientReminder = plan.reminders.find((r) => r.userId === "c1");
    const freelancerReminder = plan.reminders.find((r) => r.userId === "f1");
    expect(clientReminder).toBeDefined();
    expect(freelancerReminder).toBeDefined();
  });
});

describe("aanmaningsladder — escalatie", () => {
  it("geen escalatie bij REMINDER niveau (-2 dagen)", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iE", dueAt: inDays(-2) })], now);
    expect(plan.escalations).toHaveLength(0);
  });

  it("geen escalatie bij FIRST_NOTICE niveau (-15 dagen)", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iE", dueAt: inDays(-15) })], now);
    expect(plan.escalations).toHaveLength(0);
  });

  it("geen escalatie bij SECOND_NOTICE niveau (-31 dagen)", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iE", dueAt: inDays(-31) })], now);
    expect(plan.escalations).toHaveLength(0);
  });

  it("escalatie aanwezig bij FINAL_NOTICE niveau (-46 dagen)", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "iF", dueAt: inDays(-46) })], now);
    expect(plan.escalations).toHaveLength(1);
    const esc = plan.escalations[0]!;
    expect(esc.dedupeKey).toBe("payment-dunning-escalation-iF");
    expect(esc.level).toBe("FINAL_NOTICE");
  });

  it("escalation.dedupeKey bevat het invoiceId", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "invoice-99", dueAt: inDays(-50) })], now);
    const esc = plan.escalations[0]!;
    expect(esc.dedupeKey).toBe("payment-dunning-escalation-invoice-99");
  });
});
