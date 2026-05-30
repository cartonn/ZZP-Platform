import { describe, expect, it } from "vitest";
import { quarterOf, quarterEndDate, isInReminderWindow, planVatReminders } from "@/lib/vat-reminder";

describe("quarterOf", () => {
  it.each([
    { date: "2026-01-15", q: 1, y: 2026 },
    { date: "2026-03-31", q: 1, y: 2026 },
    { date: "2026-04-01", q: 2, y: 2026 },
    { date: "2026-06-30", q: 2, y: 2026 },
    { date: "2026-07-01", q: 3, y: 2026 },
    { date: "2026-09-30", q: 3, y: 2026 },
    { date: "2026-10-01", q: 4, y: 2026 },
    { date: "2026-12-31", q: 4, y: 2026 },
  ])("$date → Q$q $y", ({ date, q, y }) => {
    const { quarter, year } = quarterOf(new Date(date));
    expect(quarter).toBe(q);
    expect(year).toBe(y);
  });
});

describe("quarterEndDate", () => {
  it.each([
    { y: 2026, q: 1, expected: "2026-03-31" },
    { y: 2026, q: 2, expected: "2026-06-30" },
    { y: 2026, q: 3, expected: "2026-09-30" },
    { y: 2026, q: 4, expected: "2026-12-31" },
  ])("Q$q $y eindigt op $expected", ({ y, q, expected }) => {
    const end = quarterEndDate(y, q);
    expect(end.toISOString().slice(0, 10)).toBe(expected);
  });
});

describe("isInReminderWindow", () => {
  it("triggert in de laatste 7 dagen van het kwartaal", () => {
    // 7 dagen vóór einde Q1 2026 (31 maart) = 24 maart
    expect(isInReminderWindow(new Date("2026-03-25T12:00:00Z"))).toBe(true);
    expect(isInReminderWindow(new Date("2026-03-31T23:59:00Z"))).toBe(true);
  });

  it("triggert niet buiten het window", () => {
    // 8 dagen voor einde Q1 = 23 maart
    expect(isInReminderWindow(new Date("2026-03-23T12:00:00Z"))).toBe(false);
    // Begin kwartaal
    expect(isInReminderWindow(new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });

  it("triggert ook voor Q2/Q3/Q4", () => {
    expect(isInReminderWindow(new Date("2026-06-27T12:00:00Z"))).toBe(true); // Q2
    expect(isInReminderWindow(new Date("2026-09-28T12:00:00Z"))).toBe(true); // Q3
    expect(isInReminderWindow(new Date("2026-12-29T12:00:00Z"))).toBe(true); // Q4
  });
});

describe("planVatReminders", () => {
  const candidates = [{ userId: "u1" }, { userId: "u2" }];

  it("geeft lege lijst buiten het window", () => {
    const plan = planVatReminders(candidates, new Date("2026-01-15"));
    expect(plan.reminders).toHaveLength(0);
  });

  it("herinnert alle kandidaten in het window", () => {
    const plan = planVatReminders(candidates, new Date("2026-03-27"));
    expect(plan.reminders).toHaveLength(2);
    expect(plan.reminders[0]?.userId).toBe("u1");
    expect(plan.reminders[0]?.quarter).toBe(1);
    expect(plan.reminders[0]?.year).toBe(2026);
  });

  it("genereert stabiele, unieke dedupeKeys per gebruiker per kwartaal", () => {
    const plan = planVatReminders(candidates, new Date("2026-03-27"));
    const keys = plan.reminders.map((r) => r.dedupeKey);
    expect(keys).toContain("vat-reminder-u1-2026-Q1");
    expect(keys).toContain("vat-reminder-u2-2026-Q1");
    // Dezelfde input → zelfde keys (idempotentie-anker)
    const plan2 = planVatReminders(candidates, new Date("2026-03-28"));
    expect(plan2.reminders.map((r) => r.dedupeKey)).toEqual(keys);
  });

  it("geeft lege lijst als er geen kandidaten zijn", () => {
    const plan = planVatReminders([], new Date("2026-03-27"));
    expect(plan.reminders).toHaveLength(0);
  });
});
