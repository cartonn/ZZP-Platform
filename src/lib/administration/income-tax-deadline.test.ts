import { describe, it, expect } from "vitest";
import {
  INCOME_TAX_DEADLINE_SOON_DAYS,
  incomeTaxFilingDeadline,
  incomeTaxDeadlineNeedsAction,
  nextIncomeTaxYear,
  summarizeIncomeTaxDeadline,
  taxYearRange,
} from "@/lib/administration/income-tax-deadline";

describe("incomeTaxFilingDeadline", () => {
  it("is 1 mei van het jaar ná het belastingjaar (UTC-middernacht)", () => {
    const d = incomeTaxFilingDeadline(2026);
    expect(d.toISOString()).toBe("2027-05-01T00:00:00.000Z");
  });

  it("rolt correct over de jaargrens", () => {
    expect(incomeTaxFilingDeadline(2025).toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(incomeTaxFilingDeadline(2030).toISOString()).toBe("2031-05-01T00:00:00.000Z");
  });
});

describe("nextIncomeTaxYear", () => {
  it("kiest het net-afgesloten jaar vóór 1 mei", () => {
    // 15 feb 2027 → deadline over 2026 (1 mei 2027) is nog niet verstreken.
    expect(nextIncomeTaxYear(new Date("2027-02-15T12:00:00Z"))).toBe(2026);
  });

  it("toont de deadline nog op de deadline-dag zelf (1 mei)", () => {
    expect(nextIncomeTaxYear(new Date("2027-05-01T10:00:00Z"))).toBe(2026);
  });

  it("flipt naar het lopende jaar vanaf 2 mei", () => {
    expect(nextIncomeTaxYear(new Date("2027-05-02T00:00:00Z"))).toBe(2027);
  });

  it("kiest het lopende jaar diep in het jaar (na de deadline)", () => {
    // 10 aug 2026 → deadline over 2025 (1 mei 2026) is verstreken → agendeer 2026.
    expect(nextIncomeTaxYear(new Date("2026-08-10T00:00:00Z"))).toBe(2026);
  });
});

describe("summarizeIncomeTaxDeadline", () => {
  it("is altijd forward-looking: daysUntil ≥ 0", () => {
    const s = summarizeIncomeTaxDeadline(new Date("2026-08-10T00:00:00Z"));
    expect(s.taxYear).toBe(2026);
    expect(s.deadline.toISOString()).toBe("2027-05-01T00:00:00.000Z");
    expect(s.daysUntil).toBeGreaterThanOrEqual(0);
    expect(s.status).toBe("upcoming");
  });

  it("markeert due-soon binnen het venster", () => {
    // 15 apr 2027 → 16 dagen tot 1 mei 2027 (≤ 30) → due-soon.
    const s = summarizeIncomeTaxDeadline(new Date("2027-04-15T00:00:00Z"));
    expect(s.taxYear).toBe(2026);
    expect(s.daysUntil).toBe(16);
    expect(s.daysUntil).toBeLessThanOrEqual(INCOME_TAX_DEADLINE_SOON_DAYS);
    expect(s.status).toBe("due-soon");
  });

  it("is upcoming ruim vóór de deadline", () => {
    const s = summarizeIncomeTaxDeadline(new Date("2027-01-15T00:00:00Z"));
    expect(s.status).toBe("upcoming");
  });

  it("op de deadline-dag is daysUntil 0 en due-soon", () => {
    const s = summarizeIncomeTaxDeadline(new Date("2027-05-01T09:00:00Z"));
    expect(s.taxYear).toBe(2026);
    expect(s.daysUntil).toBe(0);
    expect(s.status).toBe("due-soon");
  });
});

describe("incomeTaxDeadlineNeedsAction", () => {
  it("nudget wanneer de deadline binnen het venster valt (due-soon)", () => {
    const s = summarizeIncomeTaxDeadline(new Date("2027-04-15T00:00:00Z"));
    expect(s.status).toBe("due-soon");
    expect(incomeTaxDeadlineNeedsAction(s)).toBe(true);
  });

  it("nudget niet ruim vóór de deadline (upcoming)", () => {
    const s = summarizeIncomeTaxDeadline(new Date("2027-01-15T00:00:00Z"));
    expect(s.status).toBe("upcoming");
    expect(incomeTaxDeadlineNeedsAction(s)).toBe(false);
  });
});

describe("taxYearRange", () => {
  it("omsluit precies het kalenderjaar (start inclusief, end exclusief)", () => {
    const { start, end } = taxYearRange(2026);
    expect(start).toEqual(new Date(2026, 0, 1));
    expect(end).toEqual(new Date(2027, 0, 1));
  });
});
