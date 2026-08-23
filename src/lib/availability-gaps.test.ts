import { describe, it, expect } from "vitest";
import {
  findIdleCapacity,
  IDLE_HORIZON_DAYS,
  type CapacityWindowInput,
  type BookedCollabInput,
  type IdleCapacity,
} from "@/lib/availability-gaps";

// Middernacht-UTC-datum uit een ISO-dag (de opslagconventie van AvailabilityWindow/Collaboration).
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const now = d("2026-06-01"); // maandag

const avail = (start: string, end: string): CapacityWindowInput => ({
  startDate: d(start),
  endDate: d(end),
  type: "AVAILABLE",
});
const collab = (
  start: string | null,
  end: string | null,
  status: BookedCollabInput["status"] = "ACTIVE",
): BookedCollabInput => ({
  status,
  startDate: start ? d(start) : null,
  endDate: end ? d(end) : null,
});

// Vergelijkbaar model van de open periodes: [startISO, eindISO, dagen] per bereik.
const ranges = (r: IdleCapacity) =>
  r.openRanges.map((x) => [
    x.start.toISOString().slice(0, 10),
    x.end.toISOString().slice(0, 10),
    x.days,
  ]);

describe("findIdleCapacity", () => {
  it("geeft niets terug zonder inzetbare vensters", () => {
    const r = findIdleCapacity([], [], now);
    expect(r.hasAny).toBe(false);
    expect(r.openRanges).toEqual([]);
    expect(r.totalOpenDays).toBe(0);
  });

  it("telt een volledig vrij venster als open (inclusief begin- én einddag)", () => {
    const r = findIdleCapacity([avail("2026-06-02", "2026-06-06")], [], now);
    expect(r.hasAny).toBe(true);
    expect(ranges(r)).toEqual([["2026-06-02", "2026-06-06", 5]]);
    expect(r.totalOpenDays).toBe(5);
  });

  it("splitst een venster in twee open resten rond een boeking in het midden", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-15")],
      [collab("2026-06-06", "2026-06-10")],
      now,
    );
    expect(ranges(r)).toEqual([
      ["2026-06-02", "2026-06-05", 4],
      ["2026-06-11", "2026-06-15", 5],
    ]);
    expect(r.totalOpenDays).toBe(9);
  });

  it("geeft geen open dagen bij een volledig geboekt venster", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-06")],
      [collab("2026-06-01", "2026-06-10")],
      now,
    );
    expect(r.hasAny).toBe(false);
    expect(r.totalOpenDays).toBe(0);
  });

  it("laat een open-einde samenwerking doorlopen tot het einde van de horizon", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-08-31")],
      [collab("2026-06-10", null)],
      now,
    );
    // Alleen het stuk vóór de open-einde-boeking blijft over.
    expect(ranges(r)).toEqual([["2026-06-02", "2026-06-09", 8]]);
  });

  it("negeert een samenwerking zonder startdatum", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-06")],
      [collab(null, "2026-06-10")],
      now,
    );
    expect(r.totalOpenDays).toBe(5);
  });

  it("negeert UNAVAILABLE-vensters als capaciteit", () => {
    const r = findIdleCapacity(
      [
        { startDate: d("2026-06-02"), endDate: d("2026-06-06"), type: "UNAVAILABLE" },
        avail("2026-06-08", "2026-06-09"),
      ],
      [],
      now,
    );
    expect(ranges(r)).toEqual([["2026-06-08", "2026-06-09", 2]]);
    expect(r.totalOpenDays).toBe(2);
  });

  it("negeert COMPLETED/CANCELLED-samenwerkingen (geen boeking meer)", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-06")],
      [collab("2026-06-03", "2026-06-05", "COMPLETED")],
      now,
    );
    expect(r.totalOpenDays).toBe(5);
  });

  it("telt PROPOSED mee als voorlopige boeking", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-06")],
      [collab("2026-06-03", "2026-06-05", "PROPOSED")],
      now,
    );
    expect(ranges(r)).toEqual([
      ["2026-06-02", "2026-06-02", 1],
      ["2026-06-06", "2026-06-06", 1],
    ]);
    expect(r.totalOpenDays).toBe(2);
  });

  it("voegt aangrenzende inzetbare vensters samen tot één open bereik", () => {
    const r = findIdleCapacity(
      [avail("2026-06-02", "2026-06-05"), avail("2026-06-06", "2026-06-09")],
      [],
      now,
    );
    expect(ranges(r)).toEqual([["2026-06-02", "2026-06-09", 8]]);
  });

  it("klemt een venster op de horizon", () => {
    const r = findIdleCapacity([avail("2026-06-02", "2026-12-31")], [], now, 10);
    // lastDay = today + 10 = 2026-06-11
    expect(ranges(r)).toEqual([["2026-06-02", "2026-06-11", 10]]);
  });

  it("klemt een venster dat al deels in het verleden ligt op vandaag", () => {
    const r = findIdleCapacity([avail("2026-05-20", "2026-06-04")], [], now);
    expect(ranges(r)).toEqual([["2026-06-01", "2026-06-04", 4]]);
  });

  it("gebruikt standaard een horizon van 6 weken", () => {
    expect(IDLE_HORIZON_DAYS).toBe(42);
    const r = findIdleCapacity([avail("2026-06-02", "2026-12-31")], [], now);
    // lastDay = today + 42 = 2026-07-13
    expect(ranges(r)).toEqual([["2026-06-02", "2026-07-13", 42]]);
  });
});
