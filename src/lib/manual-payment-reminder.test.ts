import { describe, expect, it } from "vitest";
import {
  canSendPaymentReminder,
  isAwaitingPayment,
  MANUAL_REMINDER_COOLDOWN_DAYS,
  type ManualReminderInput,
} from "./manual-payment-reminder";

const NOW = new Date("2026-07-04T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function input(overrides: Partial<ManualReminderInput> = {}): ManualReminderInput {
  return {
    isFreelancerOwner: true,
    status: "SENT",
    lifecycleStatus: null,
    issuedAt: new Date("2026-06-20T00:00:00.000Z"),
    dueAt: new Date("2026-06-27T23:59:59.000Z"),
    lastReminderAt: null,
    ...overrides,
  };
}

describe("isAwaitingPayment", () => {
  it("losse factuur: SENT en OVERDUE wachten op betaling", () => {
    expect(isAwaitingPayment("SENT", null)).toBe(true);
    expect(isAwaitingPayment("OVERDUE", null)).toBe(true);
  });

  it("losse factuur: DRAFT/PAID/CANCELLED wachten niet", () => {
    expect(isAwaitingPayment("DRAFT", null)).toBe(false);
    expect(isAwaitingPayment("PAID", null)).toBe(false);
    expect(isAwaitingPayment("CANCELLED", null)).toBe(false);
  });

  it("cascade: APPROVED en OVERDUE wachten op betaling", () => {
    expect(isAwaitingPayment("SENT", "APPROVED")).toBe(true);
    expect(isAwaitingPayment("SENT", "OVERDUE")).toBe(true);
  });

  it("cascade: PAID/PROCESSED/CREDITED/DRAFT/SUBMITTED wachten niet", () => {
    for (const s of ["PAID", "PROCESSED", "CREDITED", "DRAFT", "SUBMITTED", "REJECTED"] as const) {
      expect(isAwaitingPayment("SENT", s)).toBe(false);
    }
  });
});

describe("canSendPaymentReminder", () => {
  it("staat een herinnering toe voor een verzonden, openstaande losse factuur", () => {
    const r = canSendPaymentReminder(input(), NOW);
    expect(r.eligible).toBe(true);
    expect(r.reason).toBeUndefined();
    expect(r.nextAllowedAt).toBeNull();
  });

  it("berekent dagen te laat (vervaldag verstreken)", () => {
    // due 2026-06-27T23:59:59 → 6 hele dagen vóór NOW (2026-07-04T12:00)
    const r = canSendPaymentReminder(input(), NOW);
    expect(r.daysOverdue).toBe(6);
  });

  it("geeft 0 dagen te laat als de factuur nog niet vervallen is", () => {
    const r = canSendPaymentReminder(input({ dueAt: new Date("2026-07-20T23:59:59.000Z") }), NOW);
    expect(r.eligible).toBe(true);
    expect(r.daysOverdue).toBe(0);
  });

  it("weigert wanneer de actor niet de crediteur is", () => {
    const r = canSendPaymentReminder(input({ isFreelancerOwner: false }), NOW);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("not-owner");
  });

  it("weigert een nog niet verstuurde (concept) factuur", () => {
    const r = canSendPaymentReminder(input({ issuedAt: null, status: "DRAFT" }), NOW);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("not-issued");
  });

  it("weigert een reeds betaalde factuur", () => {
    const r = canSendPaymentReminder(input({ status: "PAID" }), NOW);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("not-awaiting-payment");
  });

  it("weigert een betaalde cascade-factuur", () => {
    const r = canSendPaymentReminder(input({ lifecycleStatus: "PAID" }), NOW);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("not-awaiting-payment");
  });

  it("weigert binnen de afkoelperiode en geeft het eerstvolgende moment terug", () => {
    const lastReminderAt = new Date(NOW.getTime() - 1 * DAY);
    const r = canSendPaymentReminder(input({ lastReminderAt }), NOW);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("cooldown");
    expect(r.nextAllowedAt).toEqual(
      new Date(lastReminderAt.getTime() + MANUAL_REMINDER_COOLDOWN_DAYS * DAY),
    );
  });

  it("staat opnieuw toe zodra de afkoelperiode voorbij is", () => {
    const lastReminderAt = new Date(NOW.getTime() - (MANUAL_REMINDER_COOLDOWN_DAYS + 1) * DAY);
    const r = canSendPaymentReminder(input({ lastReminderAt }), NOW);
    expect(r.eligible).toBe(true);
  });

  it("blokkeert precies op de rand van de afkoelperiode (exclusief)", () => {
    const lastReminderAt = new Date(NOW.getTime() - MANUAL_REMINDER_COOLDOWN_DAYS * DAY);
    const r = canSendPaymentReminder(input({ lastReminderAt }), NOW);
    // now === nextAllowedAt → niet langer geblokkeerd (strikt kleiner-dan)
    expect(r.eligible).toBe(true);
  });

  it("eigenaarschap wint van de afkoelperiode in de reason-volgorde", () => {
    const r = canSendPaymentReminder(input({ isFreelancerOwner: false, lastReminderAt: NOW }), NOW);
    expect(r.reason).toBe("not-owner");
  });
});
