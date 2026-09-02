import { describe, it, expect } from "vitest";
import {
  buildRosterTimeline,
  TIMELINE_HORIZON_DAYS,
  CELL_STATES,
  CELL_META,
  type TimelineMemberInput,
  type TimelineWindowInput,
} from "@/lib/franchise/roster-timeline";

// Vaste "now": maandag 2 maart 2026, 10:00 UTC. Zo zijn alle dag-sleutels deterministisch.
const NOW = new Date("2026-03-02T10:00:00Z");

const d = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

const win = (start: string, end: string, type = "UNAVAILABLE"): TimelineWindowInput => ({
  startDate: d(start),
  endDate: d(end),
  type,
});

const member = (
  id: string,
  name: string,
  overrides: Partial<Pick<TimelineMemberInput, "windows" | "placementEnds">> = {},
): TimelineMemberInput => ({
  id,
  name,
  windows: overrides.windows ?? [],
  placementEnds: overrides.placementEnds ?? [],
});

// De horizon vanaf NOW: 2026-03-02 t/m 2026-03-15 (14 dagen).
const cellState = (m: TimelineMemberInput, iso: string, now = NOW): string | undefined => {
  const { rows } = buildRosterTimeline([m], now);
  return rows[0].cells.find((c) => c.iso === iso)?.state;
};

describe("buildRosterTimeline — horizon", () => {
  it("bouwt standaard TIMELINE_HORIZON_DAYS (14) opeenvolgende dagen", () => {
    const { days } = buildRosterTimeline([], NOW);
    expect(TIMELINE_HORIZON_DAYS).toBe(14);
    expect(days).toHaveLength(14);
  });

  it("respecteert een expliciete horizon", () => {
    const { days } = buildRosterTimeline([], NOW, 7);
    expect(days).toHaveLength(7);
  });

  it("start op de UTC-dag van now (inclusief vandaag) met opeenvolgende dagen", () => {
    const { days } = buildRosterTimeline([], NOW);
    expect(days[0].iso).toBe("2026-03-02");
    const expected = [
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ];
    expect(days.map((x) => x.iso)).toEqual(expected);
  });

  it("elke iso is yyyy-mm-dd en date is UTC-middernacht", () => {
    const { days } = buildRosterTimeline([], NOW);
    for (const day of days) {
      expect(day.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.date.toISOString()).toBe(`${day.iso}T00:00:00.000Z`);
      expect(day.iso).toBe(day.date.toISOString().slice(0, 10));
    }
  });

  it("markeert alleen zaterdag/zondag (UTC) als weekend", () => {
    const { days } = buildRosterTimeline([], NOW);
    const weekendIsos = days.filter((x) => x.weekend).map((x) => x.iso);
    // 03-07 za, 03-08 zo, 03-14 za, 03-15 zo
    expect(weekendIsos).toEqual(["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"]);
    for (const day of days) {
      const dow = day.date.getUTCDay();
      expect(day.weekend).toBe(dow === 0 || dow === 6);
    }
  });
});

describe("buildRosterTimeline — leeg roster", () => {
  it("geeft geen rijen, alle perDayAvailable op nul, maar wel dagen", () => {
    const { days, rows, perDayAvailable } = buildRosterTimeline([], NOW);
    expect(rows).toEqual([]);
    expect(days).toHaveLength(14);
    expect(perDayAvailable).toHaveLength(14);
    expect(perDayAvailable.every((n) => n === 0)).toBe(true);
  });
});

describe("buildRosterTimeline — beschikbaarheid zonder signalen", () => {
  it("zonder vensters en zonder plaatsingen is elke cel AVAILABLE", () => {
    const { rows } = buildRosterTimeline([member("m1", "Anna")], NOW);
    const row = rows[0];
    expect(row.cells).toHaveLength(14);
    expect(row.cells.every((c) => c.state === "AVAILABLE")).toBe(true);
    expect(row.availableDays).toBe(14);
  });
});

describe("buildRosterTimeline — plaatsingen", () => {
  it("open einde (null) bezet de hele horizon → alle cellen PLACED", () => {
    const m = member("m1", "Anna", { placementEnds: [null] });
    const { rows } = buildRosterTimeline([m], NOW);
    const row = rows[0];
    expect(row.cells.every((c) => c.state === "PLACED")).toBe(true);
    expect(row.availableDays).toBe(0);
  });

  it("einddatum midden in de horizon → PLACED t/m einddag (inclusief), daarna AVAILABLE", () => {
    const m = member("m1", "Anna", { placementEnds: [d("2026-03-05")] });
    expect(cellState(m, "2026-03-02")).toBe("PLACED");
    expect(cellState(m, "2026-03-05")).toBe("PLACED"); // inclusief einddag
    expect(cellState(m, "2026-03-06")).toBe("AVAILABLE");
    const { rows } = buildRosterTimeline([m], NOW);
    expect(rows[0].availableDays).toBe(14 - 4); // 03-02..03-05 bezet
  });

  it("een einddatum in het verleden bezet geen enkele horizon-dag", () => {
    const m = member("m1", "Anna", { placementEnds: [d("2026-02-20")] });
    const { rows } = buildRosterTimeline([m], NOW);
    expect(rows[0].cells.every((c) => c.state === "AVAILABLE")).toBe(true);
    expect(rows[0].availableDays).toBe(14);
  });
});

describe("buildRosterTimeline — vensters", () => {
  it("UNAVAILABLE-venster maakt de gedekte dagen UNAVAILABLE", () => {
    const m = member("m1", "Anna", { windows: [win("2026-03-03", "2026-03-04", "UNAVAILABLE")] });
    expect(cellState(m, "2026-03-02")).toBe("AVAILABLE");
    expect(cellState(m, "2026-03-03")).toBe("UNAVAILABLE");
    expect(cellState(m, "2026-03-04")).toBe("UNAVAILABLE");
    expect(cellState(m, "2026-03-05")).toBe("AVAILABLE");
  });

  it("LIMITED-venster maakt de gedekte dagen LIMITED", () => {
    const m = member("m1", "Anna", { windows: [win("2026-03-03", "2026-03-04", "LIMITED")] });
    expect(cellState(m, "2026-03-03")).toBe("LIMITED");
    expect(cellState(m, "2026-03-04")).toBe("LIMITED");
    expect(cellState(m, "2026-03-05")).toBe("AVAILABLE");
  });

  it("een venster volledig buiten de horizon heeft geen effect", () => {
    const past = member("m1", "Anna", {
      windows: [win("2026-02-01", "2026-02-10", "UNAVAILABLE")],
    });
    const future = member("m2", "Bea", {
      windows: [win("2026-04-01", "2026-04-10", "UNAVAILABLE")],
    });
    for (const m of [past, future]) {
      const { rows } = buildRosterTimeline([m], NOW);
      expect(rows[0].cells.every((c) => c.state === "AVAILABLE")).toBe(true);
    }
  });

  it("een AVAILABLE-type venster laat de cellen AVAILABLE", () => {
    const m = member("m1", "Anna", { windows: [win("2026-03-03", "2026-03-05", "AVAILABLE")] });
    const { rows } = buildRosterTimeline([m], NOW);
    expect(rows[0].cells.every((c) => c.state === "AVAILABLE")).toBe(true);
  });
});

describe("buildRosterTimeline — precedentie", () => {
  it("PLACED wint van een overlappend UNAVAILABLE-venster op dezelfde dag", () => {
    const m = member("m1", "Anna", {
      placementEnds: [d("2026-03-05")],
      windows: [win("2026-03-03", "2026-03-08", "UNAVAILABLE")],
    });
    expect(cellState(m, "2026-03-04")).toBe("PLACED"); // beide → PLACED wint
    expect(cellState(m, "2026-03-06")).toBe("UNAVAILABLE"); // na plaatsing → venster telt
  });

  it("UNAVAILABLE wint van LIMITED bij overlappende vensters op dezelfde dag", () => {
    const m = member("m1", "Anna", {
      windows: [
        win("2026-03-03", "2026-03-05", "LIMITED"),
        win("2026-03-04", "2026-03-04", "UNAVAILABLE"),
      ],
    });
    expect(cellState(m, "2026-03-03")).toBe("LIMITED");
    expect(cellState(m, "2026-03-04")).toBe("UNAVAILABLE"); // zwaarste wint
    expect(cellState(m, "2026-03-05")).toBe("LIMITED");
  });

  it("een venster met einde < begin wordt genegeerd", () => {
    const m = member("m1", "Anna", { windows: [win("2026-03-08", "2026-03-03", "UNAVAILABLE")] });
    const { rows } = buildRosterTimeline([m], NOW);
    expect(rows[0].cells.every((c) => c.state === "AVAILABLE")).toBe(true);
  });

  it("een onbekend venster-type wordt genegeerd (blijft beschikbaar)", () => {
    const m = member("m1", "Anna", { windows: [win("2026-03-03", "2026-03-05", "ONZIN")] });
    const { rows } = buildRosterTimeline([m], NOW);
    expect(rows[0].cells.every((c) => c.state === "AVAILABLE")).toBe(true);
  });
});

describe("buildRosterTimeline — perDayAvailable", () => {
  it("telt per dag de rijen waarvan de cel AVAILABLE is", () => {
    const members = [
      // vrij op alles behalve 03-03 (UNAVAILABLE)
      member("m1", "Anna", { windows: [win("2026-03-03", "2026-03-03", "UNAVAILABLE")] }),
      // ingezet t/m 03-04
      member("m2", "Bea", { placementEnds: [d("2026-03-04")] }),
      // volledig vrij
      member("m3", "Cor"),
    ];
    const { days, rows, perDayAvailable } = buildRosterTimeline(members, NOW);
    expect(perDayAvailable).toHaveLength(14);
    days.forEach((day, i) => {
      const expected = rows.filter(
        (r) => r.cells.find((c) => c.iso === day.iso)?.state === "AVAILABLE",
      ).length;
      expect(perDayAvailable[i]).toBe(expected);
    });
    // 03-02: m1 vrij, m2 ingezet, m3 vrij → 2
    expect(perDayAvailable[0]).toBe(2);
    // 03-03: m1 afwezig, m2 ingezet, m3 vrij → 1
    expect(perDayAvailable[1]).toBe(1);
    // 03-05: iedereen vrij → 3
    expect(perDayAvailable[3]).toBe(3);
  });
});

describe("buildRosterTimeline — sortering", () => {
  it("sorteert op availableDays DESC, dan naam asc (nl), dan id", () => {
    const members = [
      // minst inzetbaar: hele horizon bezet
      member("z", "Zeb", { placementEnds: [null] }),
      // gelijk aantal vrije dagen + gelijke naam → id beslist
      member("b2", "Dup", { placementEnds: [d("2026-03-03")] }),
      member("b1", "Dup", { placementEnds: [d("2026-03-03")] }),
      // meest inzetbaar
      member("a", "Anna"),
    ];
    const { rows } = buildRosterTimeline(members, NOW);
    expect(rows.map((r) => r.id)).toEqual(["a", "b1", "b2", "z"]);
    // availableDays niet-stijgend
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].availableDays).toBeGreaterThanOrEqual(rows[i].availableDays);
    }
    // Anna volledig vrij, Zeb nul
    expect(rows[0].availableDays).toBe(14);
    expect(rows[3].availableDays).toBe(0);
  });

  it("bij gelijke availableDays beslist de naam (nl) vóór het id", () => {
    const members = [member("id-1", "Bram"), member("id-2", "Anna")];
    const { rows } = buildRosterTimeline(members, NOW);
    expect(rows.map((r) => r.name)).toEqual(["Anna", "Bram"]);
  });
});

describe("CELL_META", () => {
  it("heeft een entry voor elke CELL_STATES met niet-lege label en short", () => {
    for (const state of CELL_STATES) {
      const meta = CELL_META[state];
      expect(meta).toBeDefined();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.short.length).toBeGreaterThan(0);
    }
    expect(Object.keys(CELL_META).sort()).toEqual([...CELL_STATES].sort());
  });
});
