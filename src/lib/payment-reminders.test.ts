import { describe, expect, it } from "vitest";
import { planPaymentReminders, daysUntil, type PaymentReminderCandidate } from "@/lib/payment-reminders";

const now = new Date("2026-05-29T12:00:00Z");

function cand(overrides: Partial<PaymentReminderCandidate> & Pick<PaymentReminderCandidate, "invoiceId">): PaymentReminderCandidate {
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

describe("daysUntil", () => {
  it("telt hele dagen, negatief na de vervaldag", () => {
    expect(daysUntil(inDays(5), now)).toBe(5);
    expect(daysUntil(inDays(-1), now)).toBe(-1);
  });
});

describe("planPaymentReminders", () => {
  it("herinnert 5 en 1 dag vóór de vervaldag (opdrachtgever)", () => {
    const plan = planPaymentReminders([cand({ invoiceId: "i5", dueAt: inDays(5) }), cand({ invoiceId: "i1", dueAt: inDays(1) })], now);
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
    const plan = planPaymentReminders([cand({ invoiceId: "iOv", dueAt: inDays(-10), lifecycleStatus: "OVERDUE" })], now);
    expect(plan.toMarkOverdue).toHaveLength(0);
    expect(plan.reminders.length).toBeGreaterThan(0); // signaal blijft (dedup bij de runner)
  });

  it("negeert facturen die niet op betaling wachten", () => {
    const plan = planPaymentReminders([
      cand({ invoiceId: "iPaid", dueAt: inDays(-5), lifecycleStatus: "PAID" }),
      cand({ invoiceId: "iDraft", dueAt: inDays(2), lifecycleStatus: "DRAFT" }),
      cand({ invoiceId: "iNoDue", dueAt: null }),
    ], now);
    expect(plan.toMarkOverdue).toHaveLength(0);
    expect(plan.reminders).toHaveLength(0);
  });
});
