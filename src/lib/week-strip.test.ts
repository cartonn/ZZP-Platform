import { describe, expect, it } from "vitest";

import { buildWeekStrip } from "./week-strip";
import { type WeekCollaborationEntry, type WeekOverview } from "./week-overview";

// ISO-week maandag 2026-06-08 (ma) t/m zondag 2026-06-14 (zo), alles in UTC.
const WEEK_START = new Date(Date.UTC(2026, 5, 8));
const WEEK_END = new Date(Date.UTC(2026, 5, 14, 23, 59, 59, 999));

function entry(over: Partial<WeekCollaborationEntry> = {}): WeekCollaborationEntry {
  return {
    collaborationId: "c1",
    clientId: "client-1",
    clientName: "Zorg A",
    jobTitle: "Verpleegkundige",
    startDate: null,
    endDate: null,
    rate: 8500,
    timing: "ongoing",
    ...over,
  };
}

function overview(entries: WeekCollaborationEntry[]): WeekOverview {
  return {
    weekStart: WEEK_START,
    weekEnd: WEEK_END,
    entries,
    clientCount: new Set(entries.map((e) => e.clientId)).size,
  };
}

describe("buildWeekStrip", () => {
  it("yields exactly seven days, monday through sunday", () => {
    const strip = buildWeekStrip(overview([]), WEEK_START);
    expect(strip.days).toHaveLength(7);
    expect(strip.days.map((d) => d.weekday)).toEqual([
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
      "SUN",
    ]);
    expect(strip.hasAny).toBe(false);
  });

  it("places an entry with an explicit roster on exactly those weekdays", () => {
    const strip = buildWeekStrip(overview([entry({ weekdays: ["MON", "WED"] })]), WEEK_START);
    const present = strip.days.filter((d) => d.entries.length > 0).map((d) => d.weekday);
    expect(present).toEqual(["MON", "WED"]);
    expect(strip.days[0]!.entries[0]!.scheduled).toBe(true);
    expect(strip.hasAny).toBe(true);
  });

  it("falls back to the active calendar days for an entry without a roster", () => {
    // Loopt wo (10) t/m vr (12): alleen WED/THU/FRI tellen mee.
    const strip = buildWeekStrip(
      overview([
        entry({
          startDate: new Date(Date.UTC(2026, 5, 10, 9, 0)),
          endDate: new Date(Date.UTC(2026, 5, 12, 17, 0)),
        }),
      ]),
      WEEK_START,
    );
    const present = strip.days.filter((d) => d.entries.length > 0).map((d) => d.weekday);
    expect(present).toEqual(["WED", "THU", "FRI"]);
    expect(strip.days[2]!.entries[0]!.scheduled).toBe(false);
  });

  it("spans the whole week for an open-ended entry without a roster", () => {
    const strip = buildWeekStrip(overview([entry()]), WEEK_START);
    expect(strip.days.every((d) => d.entries.length === 1)).toBe(true);
  });

  it("marks today based on the now argument", () => {
    const wednesday = new Date(Date.UTC(2026, 5, 10, 14, 30));
    const strip = buildWeekStrip(overview([]), wednesday);
    const today = strip.days.filter((d) => d.isToday);
    expect(today).toHaveLength(1);
    expect(today[0]!.weekday).toBe("WED");
  });

  it("marks no day as today when now falls outside the week", () => {
    const nextWeek = new Date(Date.UTC(2026, 5, 20));
    const strip = buildWeekStrip(overview([entry({ weekdays: ["MON"] })]), nextWeek);
    expect(strip.days.some((d) => d.isToday)).toBe(false);
  });

  it("keeps two collaborations on the same day side by side", () => {
    const strip = buildWeekStrip(
      overview([
        entry({ collaborationId: "a", clientId: "x", clientName: "Zorg A", weekdays: ["MON"] }),
        entry({ collaborationId: "b", clientId: "y", clientName: "Zorg B", weekdays: ["MON"] }),
      ]),
      WEEK_START,
    );
    expect(strip.days[0]!.entries.map((e) => e.collaborationId)).toEqual(["a", "b"]);
  });
});
