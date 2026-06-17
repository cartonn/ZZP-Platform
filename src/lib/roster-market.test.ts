// Unit-tests voor roster-market.ts (pure bucketing, geen I/O).
// Gebruik vaste UTC-datums zodat tests deterministisch zijn ongeacht de timezone.

import { describe, expect, it } from "vitest";
import {
  buildAgenda,
  buildRosterCalendar,
  filterRosterByMinMatch,
  ROSTER_STRONG_MATCH_MIN,
  type BookedCollaborationInput,
  type RosterCalendar,
  type RosterShiftInput,
} from "@/lib/roster-market";

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

describe("filterRosterByMinMatch", () => {
  const dayA = new Date(Date.UTC(2026, 5, 12));
  const dayB = new Date(Date.UTC(2026, 5, 13));

  function calendarWith(scores: Array<number | null>) {
    const shifts = scores.map((matchScore, i) =>
      makeShift({ startDate: i < 2 ? dayA : dayB, jobId: `job-${i}`, matchScore }),
    );
    return buildRosterCalendar(shifts, NOW);
  }

  it("houdt alleen diensten met matchScore ≥ drempel", () => {
    const calendar = calendarWith([90, 50, 70, 30]);
    const filtered = filterRosterByMinMatch(calendar, 70);
    expect(filtered.total).toBe(2);
    const ids = filtered.days.flatMap((d) => d.shifts.map((s) => s.jobId));
    expect(ids).toEqual(["job-0", "job-2"]); // 90 en 70 blijven, 50 en 30 vallen weg
  });

  it("diensten zonder score (null) vallen altijd weg", () => {
    const calendar = calendarWith([null, 80]);
    const filtered = filterRosterByMinMatch(calendar, ROSTER_STRONG_MATCH_MIN);
    expect(filtered.total).toBe(1);
    expect(filtered.days[0]!.shifts[0]!.matchScore).toBe(80);
  });

  it("laat lege dagen volledig weg", () => {
    const calendar = calendarWith([10, 20, 95]); // dag A heeft alleen lage scores
    const filtered = filterRosterByMinMatch(calendar, 70);
    expect(filtered.days).toHaveLength(1);
    expect(filtered.days[0]!.date.getTime()).toBe(Date.UTC(2026, 5, 13));
  });

  it("behoudt beyondHorizon ongewijzigd", () => {
    const beyond = new Date(Date.UTC(2026, 6, 5));
    const shifts = [
      makeShift({ startDate: dayA, jobId: "in", matchScore: 90 }),
      makeShift({ startDate: beyond, jobId: "out", matchScore: 95 }),
    ];
    const calendar = buildRosterCalendar(shifts, NOW);
    expect(calendar.beyondHorizon).toBe(1);
    const filtered = filterRosterByMinMatch(calendar, 70);
    expect(filtered.beyondHorizon).toBe(1);
  });

  it("grensgeval: exact op de drempel telt mee", () => {
    const calendar = calendarWith([70]);
    expect(filterRosterByMinMatch(calendar, 70).total).toBe(1);
    expect(filterRosterByMinMatch(calendar, 71).total).toBe(0);
  });

  it("muteert de invoer-kalender niet", () => {
    const calendar = calendarWith([90, 30]);
    const beforeTotal = calendar.total;
    const beforeDayCount = calendar.days.length;
    filterRosterByMinMatch(calendar, 70);
    expect(calendar.total).toBe(beforeTotal);
    expect(calendar.days).toHaveLength(beforeDayCount);
    expect(calendar.days[0]!.shifts).toHaveLength(2);
  });
});

describe("buildAgenda", () => {
  const EMPTY_CALENDAR: RosterCalendar = { days: [], total: 0, beyondHorizon: 0 };

  function makeCollab(
    overrides: Partial<BookedCollaborationInput> & { collaborationId: string },
  ): BookedCollaborationInput {
    return {
      jobTitle: "Verpleging",
      clientName: "Zorg BV",
      rate: 45,
      startDate: null,
      endDate: null,
      ...overrides,
    };
  }

  // Helper: vlak een agenda uit naar (datum-ms → collaborationIds van booked).
  function bookedByDay(agenda: ReturnType<typeof buildAgenda>) {
    return agenda.days.map((d) => ({
      ms: d.date.getTime(),
      ids: d.booked.map((b) => b.collaborationId),
    }));
  }

  it("weekdays-projectie plaatst alleen op de vastgelegde dagen met scheduled=true", () => {
    // Venster volledig open (loopt al, t/m horizon); alleen MON en WED.
    const collab = makeCollab({
      collaborationId: "c1",
      weekdays: ["MON", "WED"],
    });
    const agenda = buildAgenda(EMPTY_CALENDAR, [collab], NOW);
    // NOW = wo 2026-06-10. Verwachte MON/WED-dagen binnen [vandaag, +21]:
    // wo 10, ma 15, wo 17, ma 22, wo 24, ma 29, wo 1-jul (horizon).
    const expectedDays = [
      Date.UTC(2026, 5, 10), // wo
      Date.UTC(2026, 5, 15), // ma
      Date.UTC(2026, 5, 17), // wo
      Date.UTC(2026, 5, 22), // ma
      Date.UTC(2026, 5, 24), // wo
      Date.UTC(2026, 5, 29), // ma
      Date.UTC(2026, 6, 1), // wo (horizon)
    ];
    expect(agenda.days.map((d) => d.date.getTime())).toEqual(expectedDays);
    for (const day of agenda.days) {
      expect(day.booked).toHaveLength(1);
      expect(day.booked[0]!.scheduled).toBe(true);
      expect(["MON", "WED"]).toContain(day.weekday);
    }
    expect(agenda.bookedTotal).toBe(expectedDays.length);
  });

  it("zonder weekdays krijgt elke dag in het venster scheduled=false", () => {
    const collab = makeCollab({
      collaborationId: "c1",
      startDate: new Date(Date.UTC(2026, 5, 11)),
      endDate: new Date(Date.UTC(2026, 5, 13)),
    });
    const agenda = buildAgenda(EMPTY_CALENDAR, [collab], NOW);
    expect(agenda.days.map((d) => d.date.getTime())).toEqual([
      Date.UTC(2026, 5, 11),
      Date.UTC(2026, 5, 12),
      Date.UTC(2026, 5, 13),
    ]);
    for (const day of agenda.days) {
      expect(day.booked).toHaveLength(1);
      expect(day.booked[0]!.scheduled).toBe(false);
    }
    expect(agenda.bookedTotal).toBe(3);
  });

  it("open start (null) → vanaf vandaag; open eind (null) → t/m de horizon", () => {
    const collab = makeCollab({ collaborationId: "c1" }); // beide null
    const agenda = buildAgenda(EMPTY_CALENDAR, [collab], NOW);
    // Eerste dag = vandaag, laatste dag = horizon (2026-07-01).
    expect(agenda.days[0]!.date.getTime()).toBe(Date.UTC(2026, 5, 10));
    expect(agenda.days[agenda.days.length - 1]!.date.getTime()).toBe(Date.UTC(2026, 6, 1));
    expect(agenda.days).toHaveLength(22); // vandaag t/m horizon inclusief = 22 dagen
  });

  it("venster geklemd op de horizon: een lange samenwerking stopt op de horizon", () => {
    const collab = makeCollab({
      collaborationId: "c1",
      startDate: new Date(Date.UTC(2026, 5, 1)), // ruim vóór vandaag
      endDate: new Date(Date.UTC(2026, 11, 31)), // ruim ná de horizon
    });
    const agenda = buildAgenda(EMPTY_CALENDAR, [collab], NOW);
    // Geklemd: vandaag (2026-06-10) t/m horizon (2026-07-01).
    expect(agenda.days[0]!.date.getTime()).toBe(Date.UTC(2026, 5, 10));
    expect(agenda.days[agenda.days.length - 1]!.date.getTime()).toBe(Date.UTC(2026, 6, 1));
    // Geen dag ná de horizon.
    expect(agenda.days.every((d) => d.date.getTime() <= Date.UTC(2026, 6, 1))).toBe(true);
  });

  it("volledig in het verleden of volledig ná de horizon draagt niets bij", () => {
    const past = makeCollab({
      collaborationId: "past",
      startDate: new Date(Date.UTC(2026, 4, 1)),
      endDate: new Date(Date.UTC(2026, 5, 9)), // eindigt gisteren
    });
    const future = makeCollab({
      collaborationId: "future",
      startDate: new Date(Date.UTC(2026, 6, 2)), // begint ná horizon
      endDate: new Date(Date.UTC(2026, 7, 1)),
    });
    const agenda = buildAgenda(EMPTY_CALENDAR, [past, future], NOW);
    expect(agenda.days).toHaveLength(0);
    expect(agenda.bookedTotal).toBe(0);
  });

  it("merge: een dag met zowel open als booked; een dag met alleen booked verschijnt; oplopend", () => {
    const openDate = new Date(Date.UTC(2026, 5, 12));
    const openCalendar = buildRosterCalendar(
      [makeShift({ startDate: openDate, jobId: "open-1", matchScore: 80 })],
      NOW,
    );
    const collabSameDay = makeCollab({
      collaborationId: "c-same",
      startDate: openDate,
      endDate: openDate,
    });
    const collabBookedOnly = makeCollab({
      collaborationId: "c-only",
      startDate: new Date(Date.UTC(2026, 5, 14)),
      endDate: new Date(Date.UTC(2026, 5, 14)),
    });
    const agenda = buildAgenda(openCalendar, [collabSameDay, collabBookedOnly], NOW);

    const day12 = agenda.days.find((d) => d.date.getTime() === Date.UTC(2026, 5, 12))!;
    expect(day12.open.map((s) => s.jobId)).toEqual(["open-1"]);
    expect(day12.booked.map((b) => b.collaborationId)).toEqual(["c-same"]);

    const day14 = agenda.days.find((d) => d.date.getTime() === Date.UTC(2026, 5, 14))!;
    expect(day14.open).toHaveLength(0);
    expect(day14.booked.map((b) => b.collaborationId)).toEqual(["c-only"]);
    expect(day14.weekday).toBe("SUN"); // 2026-06-14 is een zondag
    expect(day14.isToday).toBe(false);

    // Oplopend gesorteerd.
    const times = agenda.days.map((d) => d.date.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("booked-sortering binnen een dag: clientName, dan jobTitle, dan collaborationId", () => {
    const d = new Date(Date.UTC(2026, 5, 12));
    const collabs = [
      makeCollab({
        collaborationId: "z",
        clientName: "Beta",
        jobTitle: "Taak",
        startDate: d,
        endDate: d,
      }),
      makeCollab({
        collaborationId: "a",
        clientName: "Beta",
        jobTitle: "Taak",
        startDate: d,
        endDate: d,
      }),
      makeCollab({
        collaborationId: "m",
        clientName: "Alfa",
        jobTitle: "Zorg",
        startDate: d,
        endDate: d,
      }),
      makeCollab({
        collaborationId: "n",
        clientName: "Alfa",
        jobTitle: "Admin",
        startDate: d,
        endDate: d,
      }),
    ];
    const agenda = buildAgenda(EMPTY_CALENDAR, collabs, NOW);
    const day = agenda.days.find((x) => x.date.getTime() === d.getTime())!;
    // Alfa/Admin, Alfa/Zorg, Beta/Taak(a), Beta/Taak(z)
    expect(day.booked.map((b) => b.collaborationId)).toEqual(["n", "m", "a", "z"]);
  });

  it("totalen: openTotal en beyondHorizon uit de open-kalender, bookedTotal als som", () => {
    const inRange = new Date(Date.UTC(2026, 5, 12));
    const beyond = new Date(Date.UTC(2026, 6, 5));
    const openCalendar = buildRosterCalendar(
      [
        makeShift({ startDate: inRange, jobId: "o1" }),
        makeShift({ startDate: inRange, jobId: "o2" }),
        makeShift({ startDate: beyond, jobId: "o-beyond" }),
      ],
      NOW,
    );
    expect(openCalendar.total).toBe(2);
    expect(openCalendar.beyondHorizon).toBe(1);

    const collab = makeCollab({
      collaborationId: "c1",
      startDate: new Date(Date.UTC(2026, 5, 11)),
      endDate: new Date(Date.UTC(2026, 5, 13)),
    });
    const agenda = buildAgenda(openCalendar, [collab], NOW);
    expect(agenda.openTotal).toBe(2);
    expect(agenda.beyondHorizon).toBe(1);
    expect(agenda.bookedTotal).toBe(3); // 11, 12, 13
  });

  it("kopieert collaboratie-velden naar de booked-entry", () => {
    const collab = makeCollab({
      collaborationId: "c1",
      jobTitle: "Nachtdienst",
      clientName: "Thuiszorg X",
      rate: null,
      startDate: new Date(Date.UTC(2026, 5, 11)),
      endDate: new Date(Date.UTC(2026, 5, 11)),
    });
    const agenda = buildAgenda(EMPTY_CALENDAR, [collab], NOW);
    const entry = agenda.days[0]!.booked[0]!;
    expect(entry).toEqual({
      collaborationId: "c1",
      jobTitle: "Nachtdienst",
      clientName: "Thuiszorg X",
      rate: null,
      scheduled: false,
    });
  });

  it("muteert geen enkele input (open-kalender en collaboraties blijven ongemoeid)", () => {
    const openDate = new Date(Date.UTC(2026, 5, 12));
    const openCalendar = buildRosterCalendar(
      [makeShift({ startDate: openDate, jobId: "open-1" })],
      NOW,
    );
    const beforeOpenDayCount = openCalendar.days.length;
    const beforeOpenShifts = openCalendar.days[0]!.shifts.length;

    const weekdays: ("MON" | "WED")[] = ["MON", "WED"];
    const collab = makeCollab({ collaborationId: "c1", weekdays });
    const collabs = [collab];
    const beforeCollabCount = collabs.length;

    buildAgenda(openCalendar, collabs, NOW);

    expect(openCalendar.days).toHaveLength(beforeOpenDayCount);
    expect(openCalendar.days[0]!.shifts).toHaveLength(beforeOpenShifts);
    expect(collabs).toHaveLength(beforeCollabCount);
    expect(collab.weekdays).toEqual(["MON", "WED"]); // weekdays-array onaangeroerd
  });

  it("non-mutatie: bookedByDay-helper observeert geen herordening van open shifts", () => {
    const openDate = new Date(Date.UTC(2026, 5, 12));
    const openCalendar = buildRosterCalendar(
      [
        makeShift({ startDate: openDate, jobId: "o1", matchScore: 90 }),
        makeShift({ startDate: openDate, jobId: "o2", matchScore: 50 }),
      ],
      NOW,
    );
    const agenda = buildAgenda(openCalendar, [], NOW);
    const day = agenda.days[0]!;
    // open overgenomen, niet hersorteerd (volgorde gelijk aan de bron-kalender).
    expect(day.open.map((s) => s.jobId)).toEqual(openCalendar.days[0]!.shifts.map((s) => s.jobId));
    expect(bookedByDay(agenda)).toEqual([{ ms: openDate.getTime(), ids: [] }]);
  });
});
