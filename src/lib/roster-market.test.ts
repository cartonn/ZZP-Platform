// Unit-tests voor roster-market.ts (pure bucketing, geen I/O).
// Gebruik vaste UTC-datums zodat tests deterministisch zijn ongeacht de timezone.

import { describe, expect, it } from "vitest";
import { buildRosterCalendar, type RosterShiftInput } from "@/lib/roster-market";

// Vaste "nu" voor alle tests: woensdag 2026-06-10 00:00:00 UTC
const NOW = new Date(Date.UTC(2026, 5, 10)); // maand is 0-indexed

function makeShift(overrides: Partial<RosterShiftInput> & { startDate: Date }): RosterShiftInput {
  return {
    jobId: "job-1",
    title: "Test shift",
    companyName: "Acme BV",
    rateMin: null,
    rateMax: null,
    location: null,
    workMode: "ONSITE",
    matchScore: null,
    alreadyApplied: false,
    ...overrides,
  };
}

describe("buildRosterCalendar", () => {
  it("lege invoer geeft lege kalender terug", () => {
    const result = buildRosterCalendar([], NOW);
    expect(result.days).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.beyondHorizon).toBe(0);
  });

  it("diensten vóór vandaag worden weggefilterd", () => {
    const yesterday = new Date(Date.UTC(2026, 5, 9)); // 2026-06-09
    const shift = makeShift({ startDate: yesterday, jobId: "past-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.beyondHorizon).toBe(0);
  });

  it("dienst precies op vandaag wordt WEL geplaatst (todayMs === dayMs)", () => {
    const shift = makeShift({ startDate: new Date(Date.UTC(2026, 5, 10)), jobId: "today-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days).toHaveLength(1);
    expect(result.days[0]!.isToday).toBe(true);
    expect(result.total).toBe(1);
  });

  it("dienst precies op de horizongrens (dag 21) wordt geplaatst", () => {
    // horizonMs = todayMs + 21 * 86400000 → 2026-07-01
    const onHorizon = new Date(Date.UTC(2026, 6, 1)); // 2026-07-01
    const shift = makeShift({ startDate: onHorizon, jobId: "horizon-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.beyondHorizon).toBe(0);
  });

  it("dienst 1 dag ná de horizon telt als beyondHorizon en staat NIET in days", () => {
    const afterHorizon = new Date(Date.UTC(2026, 6, 2)); // 2026-07-02
    const shift = makeShift({ startDate: afterHorizon, jobId: "beyond-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.beyondHorizon).toBe(1);
  });

  it("meerdere diensten op één dag gesorteerd op matchScore desc (null achteraan)", () => {
    const date = new Date(Date.UTC(2026, 5, 15));
    const shifts = [
      makeShift({ startDate: date, jobId: "a", title: "A", matchScore: null }),
      makeShift({ startDate: date, jobId: "b", title: "B", matchScore: 50 }),
      makeShift({ startDate: date, jobId: "c", title: "C", matchScore: 80 }),
      makeShift({ startDate: date, jobId: "d", title: "D", matchScore: 30 }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    expect(result.days).toHaveLength(1);
    const sortedIds = result.days[0]!.shifts.map((s) => s.jobId);
    // Verwacht: C(80), B(50), D(30), A(null)
    expect(sortedIds).toEqual(["c", "b", "d", "a"]);
  });

  it("tie-break op matchScore gelijk: startDate asc", () => {
    const date1 = new Date(Date.UTC(2026, 5, 15, 8, 0));
    const date2 = new Date(Date.UTC(2026, 5, 15, 10, 0));
    const shifts = [
      makeShift({ startDate: date2, jobId: "late", title: "Late", matchScore: 70 }),
      makeShift({ startDate: date1, jobId: "early", title: "Early", matchScore: 70 }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    expect(result.days[0]!.shifts.map((s) => s.jobId)).toEqual(["early", "late"]);
  });

  it("tie-break op matchScore en startDate gelijk: title asc", () => {
    const date = new Date(Date.UTC(2026, 5, 15, 9, 0));
    const shifts = [
      makeShift({ startDate: date, jobId: "z", title: "Zorg", matchScore: 60 }),
      makeShift({ startDate: date, jobId: "a", title: "Administratie", matchScore: 60 }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    expect(result.days[0]!.shifts.map((s) => s.jobId)).toEqual(["a", "z"]);
  });

  it("dagen oplopend gesorteerd op datum", () => {
    const d1 = new Date(Date.UTC(2026, 5, 20));
    const d2 = new Date(Date.UTC(2026, 5, 12));
    const d3 = new Date(Date.UTC(2026, 5, 15));
    const shifts = [
      makeShift({ startDate: d1, jobId: "j1" }),
      makeShift({ startDate: d2, jobId: "j2" }),
      makeShift({ startDate: d3, jobId: "j3" }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    const dates = result.days.map((d) => d.date.getTime());
    expect(dates).toEqual([d2.getTime(), d3.getTime(), d1.getTime()]);
  });

  it("isToday correct gemarkeerd alleen op vandaag", () => {
    const today = new Date(Date.UTC(2026, 5, 10));
    const tomorrow = new Date(Date.UTC(2026, 5, 11));
    const shifts = [
      makeShift({ startDate: today, jobId: "today" }),
      makeShift({ startDate: tomorrow, jobId: "tomorrow" }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    const todayDay = result.days.find((d) => d.isToday);
    const tomorrowDay = result.days.find((d) => !d.isToday);
    expect(todayDay?.shifts[0]?.jobId).toBe("today");
    expect(tomorrowDay?.shifts[0]?.jobId).toBe("tomorrow");
  });

  it("weekday-mapping correct voor zondag (getUTCDay()=0 → SUN)", () => {
    // 2026-06-14 is een zondag
    const sunday = new Date(Date.UTC(2026, 5, 14));
    expect(sunday.getUTCDay()).toBe(0); // verificeer dat het echt een zondag is
    const shift = makeShift({ startDate: sunday, jobId: "sunday-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days[0]!.weekday).toBe("SUN");
  });

  it("weekday-mapping correct voor maandag (getUTCDay()=1 → MON)", () => {
    // 2026-06-15 is een maandag
    const monday = new Date(Date.UTC(2026, 5, 15));
    expect(monday.getUTCDay()).toBe(1); // verificeer dat het echt een maandag is
    const shift = makeShift({ startDate: monday, jobId: "monday-job" });
    const result = buildRosterCalendar([shift], NOW);
    expect(result.days[0]!.weekday).toBe("MON");
  });

  it("non-mutatie: de originele input-array wordt niet aangepast", () => {
    const date = new Date(Date.UTC(2026, 5, 15));
    const shifts = [
      makeShift({ startDate: date, jobId: "x", matchScore: 30 }),
      makeShift({ startDate: date, jobId: "y", matchScore: 90 }),
    ];
    const originalOrder = shifts.map((s) => s.jobId);
    buildRosterCalendar(shifts, NOW);
    // De input-array moet onveranderd zijn (niet gesorteerd door de functie)
    expect(shifts.map((s) => s.jobId)).toEqual(originalOrder);
  });

  it("total en beyondHorizon tellingen correct bij gemengde invoer", () => {
    const inRange1 = new Date(Date.UTC(2026, 5, 12));
    const inRange2 = new Date(Date.UTC(2026, 5, 20));
    const past = new Date(Date.UTC(2026, 5, 9));
    const beyond = new Date(Date.UTC(2026, 6, 5));
    const shifts = [
      makeShift({ startDate: inRange1, jobId: "r1" }),
      makeShift({ startDate: inRange2, jobId: "r2" }),
      makeShift({ startDate: past, jobId: "p1" }),
      makeShift({ startDate: beyond, jobId: "b1" }),
      makeShift({ startDate: beyond, jobId: "b2" }),
    ];
    const result = buildRosterCalendar(shifts, NOW);
    expect(result.total).toBe(2);
    expect(result.beyondHorizon).toBe(2);
    expect(result.days).toHaveLength(2);
  });
});
