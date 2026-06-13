import { describe, it, expect } from "vitest";
import {
  PLATFORM_BILLING_TERM_DAYS,
  dueDateFor,
  agingFor,
  summarizeAging,
} from "@/lib/platform-billing/aging";
import type { AgingInvoice } from "@/lib/platform-billing/aging";

const DAY_MS = 24 * 60 * 60 * 1000;

const BASE = new Date("2026-01-01T00:00:00.000Z");

describe("dueDateFor", () => {
  it("geeft null terug bij null issuedAt", () => {
    expect(dueDateFor(null)).toBeNull();
  });

  it("geeft issuedAt + 30 dagen terug", () => {
    const due = dueDateFor(BASE);
    expect(due).not.toBeNull();
    expect(due!.getTime()).toBe(BASE.getTime() + PLATFORM_BILLING_TERM_DAYS * DAY_MS);
  });
});

describe("agingFor — niet-SENT statussen verouderen nooit", () => {
  for (const status of ["DRAFT", "PAID", "CANCELLED"] as const) {
    it(`status ${status}: overdue false, daysOutstanding null`, () => {
      const result = agingFor({ status, issuedAt: BASE }, new Date(BASE.getTime() + 40 * DAY_MS));
      expect(result.overdue).toBe(false);
      expect(result.daysOutstanding).toBeNull();
      expect(result.daysOverdue).toBe(0);
      expect(result.dueAt).toBeNull();
    });
  }
});

describe("agingFor — SENT met issuedAt null (defensief)", () => {
  it("geeft lege aging terug", () => {
    const result = agingFor({ status: "SENT", issuedAt: null }, BASE);
    expect(result).toEqual({ dueAt: null, daysOutstanding: null, daysOverdue: 0, overdue: false });
  });
});

describe("agingFor — SENT, 10 dagen geleden uitgegeven", () => {
  it("daysOutstanding 10, overdue false, daysOverdue 0", () => {
    const issuedAt = BASE;
    const now = new Date(BASE.getTime() + 10 * DAY_MS);
    const result = agingFor({ status: "SENT", issuedAt }, now);
    expect(result.daysOutstanding).toBe(10);
    expect(result.overdue).toBe(false);
    expect(result.daysOverdue).toBe(0);
  });
});

describe("agingFor — SENT, grensgevallen rondom vervaldatum", () => {
  it("now exact op dueAt (issuedAt + 30d): overdue false, daysOverdue 0", () => {
    const issuedAt = BASE;
    const now = new Date(BASE.getTime() + 30 * DAY_MS); // exact op dueAt
    const result = agingFor({ status: "SENT", issuedAt }, now);
    expect(result.overdue).toBe(false);
    expect(result.daysOverdue).toBe(0);
  });

  it("now = dueAt + 1ms: overdue true, daysOverdue 0", () => {
    const issuedAt = BASE;
    const dueAt = BASE.getTime() + 30 * DAY_MS;
    const now = new Date(dueAt + 1);
    const result = agingFor({ status: "SENT", issuedAt }, now);
    expect(result.overdue).toBe(true);
    expect(result.daysOverdue).toBe(0);
  });

  it("now = dueAt + 5 dagen: overdue true, daysOverdue 5", () => {
    const issuedAt = BASE;
    const dueAt = BASE.getTime() + 30 * DAY_MS;
    const now = new Date(dueAt + 5 * DAY_MS);
    const result = agingFor({ status: "SENT", issuedAt }, now);
    expect(result.overdue).toBe(true);
    expect(result.daysOverdue).toBe(5);
  });
});

describe("summarizeAging", () => {
  it("telt alleen verlopen SENT-facturen mee", () => {
    const issuedAt = BASE;
    const now = new Date(BASE.getTime() + 35 * DAY_MS); // 5 dagen over termijn

    const invoices: AgingInvoice[] = [
      { status: "SENT", issuedAt, totalCents: 10000 }, // verlopen
      { status: "SENT", issuedAt, totalCents: 5000 }, // verlopen
      { status: "DRAFT", issuedAt, totalCents: 2000 }, // niet SENT
      { status: "PAID", issuedAt, totalCents: 3000 }, // betaald
      { status: "CANCELLED", issuedAt, totalCents: 1500 }, // geannuleerd
      { status: "SENT", issuedAt: null, totalCents: 800 }, // SENT maar geen datum
    ];

    const summary = summarizeAging(invoices, now);
    expect(summary.overdueCount).toBe(2);
    expect(summary.overdueCents).toBe(15000);
  });

  it("geeft 0/0 terug bij lege lijst", () => {
    expect(summarizeAging([], BASE)).toEqual({ overdueCount: 0, overdueCents: 0 });
  });

  it("geeft 0/0 terug als niets verlopen is", () => {
    const issuedAt = BASE;
    const now = new Date(BASE.getTime() + 10 * DAY_MS); // binnen termijn
    const invoices: AgingInvoice[] = [{ status: "SENT", issuedAt, totalCents: 5000 }];
    expect(summarizeAging(invoices, now)).toEqual({ overdueCount: 0, overdueCents: 0 });
  });
});
