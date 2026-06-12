import { describe, it, expect } from "vitest";
import {
  firstWeeklyOccurrence,
  collaborationScheduleEvents,
  type ScheduleCollaboration,
} from "@/lib/calendar/schedule";

// ---------------------------------------------------------------------------
// firstWeeklyOccurrence
// ---------------------------------------------------------------------------

describe("firstWeeklyOccurrence", () => {
  // 2024-06-03 is een maandag (getUTCDay() === 1)
  const monday = new Date("2024-06-03T00:00:00Z");
  // 2024-06-05 is een woensdag
  const wednesday = new Date("2024-06-05T00:00:00Z");
  // 2024-06-08 is een zaterdag
  const saturday = new Date("2024-06-08T00:00:00Z");

  it("geeft `from` zelf terug als zijn weekdag in `days` zit", () => {
    const result = firstWeeklyOccurrence(monday, ["MON"]);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(monday.getTime());
  });

  it("geeft de volgende overeenkomende dag terug als `from` er niet in zit", () => {
    // van maandag, zoek woensdag → 2024-06-05
    const result = firstWeeklyOccurrence(monday, ["WED"]);
    expect(result).not.toBeNull();
    expect(result!.toISOString().slice(0, 10)).toBe("2024-06-05");
  });

  it("zoekt meerdere kandidaten in één keer (kortste afstand)", () => {
    // van woensdag, zoek maandag of vrijdag; vrijdag (2 dagen) is dichter dan maandag (5 dagen)
    const result = firstWeeklyOccurrence(wednesday, ["MON", "FRI"]);
    expect(result).not.toBeNull();
    expect(result!.toISOString().slice(0, 10)).toBe("2024-06-07"); // vrijdag
  });

  it("slaat over naar het weekend en volgende week", () => {
    // van zaterdag, zoek maandag → 2024-06-10 (2 dagen verder)
    const result = firstWeeklyOccurrence(saturday, ["MON"]);
    expect(result).not.toBeNull();
    expect(result!.toISOString().slice(0, 10)).toBe("2024-06-10");
  });

  it("geeft null terug wanneer `days` leeg is", () => {
    expect(firstWeeklyOccurrence(monday, [])).toBeNull();
  });

  it("muteert `from` niet", () => {
    const original = monday.getTime();
    firstWeeklyOccurrence(monday, ["FRI"]);
    expect(monday.getTime()).toBe(original);
  });

  it("werkt over een weekgrens heen (zondag → maandag)", () => {
    // 2024-06-09 is een zondag; zoek maandag → 2024-06-10
    const sunday = new Date("2024-06-09T00:00:00Z");
    const result = firstWeeklyOccurrence(sunday, ["MON"]);
    expect(result).not.toBeNull();
    expect(result!.toISOString().slice(0, 10)).toBe("2024-06-10");
  });
});

// ---------------------------------------------------------------------------
// collaborationScheduleEvents
// ---------------------------------------------------------------------------

describe("collaborationScheduleEvents", () => {
  const base: ScheduleCollaboration = {
    id: "abc123",
    jobTitle: "Developer",
    counterpartyName: "Acme BV",
    status: "ACTIVE",
    startDate: new Date("2024-06-03T00:00:00Z"), // maandag
    endDate: new Date("2024-08-30T00:00:00Z"),
    weekdays: ["MON", "WED", "FRI"],
  };

  it("filtert samenwerkingen met status !== ACTIVE eruit", () => {
    const result = collaborationScheduleEvents([
      { ...base, status: "PROPOSED" },
      { ...base, status: "COMPLETED" },
      { ...base, status: "CANCELLED" },
    ]);
    expect(result).toHaveLength(0);
  });

  it("filtert samenwerkingen zonder weekdagen eruit", () => {
    const result = collaborationScheduleEvents([{ ...base, weekdays: [] }]);
    expect(result).toHaveLength(0);
  });

  it("filtert samenwerkingen zonder startdatum eruit", () => {
    const result = collaborationScheduleEvents([{ ...base, startDate: null }]);
    expect(result).toHaveLength(0);
  });

  it("converteert een geldige ACTIVE samenwerking naar een IcsEvent", () => {
    const [event] = collaborationScheduleEvents([base]);
    expect(event).toBeDefined();
    expect(event!.uid).toBe("collab-abc123@zzp-platform");
    expect(event!.allDay).toBe(true);
  });

  it("stelt de summary in als '<jobTitle> — <counterpartyName>' wanneer counterpartyName aanwezig is", () => {
    const [event] = collaborationScheduleEvents([base]);
    expect(event!.summary).toBe("Developer — Acme BV");
    // em dash U+2014
    expect(event!.summary).toContain("—");
  });

  it("stelt de summary in als alleen jobTitle wanneer counterpartyName leeg is", () => {
    const [event] = collaborationScheduleEvents([{ ...base, counterpartyName: "" }]);
    expect(event!.summary).toBe("Developer");
  });

  it("stelt recurrenceDays in op de weekdagen van de samenwerking", () => {
    const [event] = collaborationScheduleEvents([base]);
    expect(event!.recurrenceDays).toEqual(["MON", "WED", "FRI"]);
  });

  it("stelt until in op endDate wanneer aanwezig", () => {
    const [event] = collaborationScheduleEvents([base]);
    expect(event!.until).toBe(base.endDate);
  });

  it("stelt until in op undefined wanneer endDate null is", () => {
    const [event] = collaborationScheduleEvents([{ ...base, endDate: null }]);
    expect(event!.until).toBeUndefined();
  });

  it("stelt description in als 'Werkdagen: <geformatteerde dagen>.'", () => {
    const [event] = collaborationScheduleEvents([base]);
    // formatWeekdays(["MON","WED","FRI"]) = "ma, wo, vr"
    expect(event!.description).toBe("Werkdagen: ma, wo, vr.");
  });

  it("berekent start als de eerste overeenkomende dag op/na startDate", () => {
    // startDate is maandag; weekdays bevat maandag → start === startDate zelf
    const [event] = collaborationScheduleEvents([base]);
    expect(event!.start.getTime()).toBe(base.startDate!.getTime());
  });

  it("berekent start als de volgende overeenkomende dag wanneer startDate geen match is", () => {
    // startDate is maandag; zoek alleen vrijdag → start = 2024-06-07
    const [event] = collaborationScheduleEvents([{ ...base, weekdays: ["FRI"] }]);
    expect(event!.start.toISOString().slice(0, 10)).toBe("2024-06-07");
  });

  it("bewaart de invoervolgorde bij meerdere samenwerkingen", () => {
    const c1: ScheduleCollaboration = { ...base, id: "first", jobTitle: "Eerste" };
    const c2: ScheduleCollaboration = { ...base, id: "second", jobTitle: "Tweede" };
    const c3: ScheduleCollaboration = { ...base, id: "third", jobTitle: "Derde" };
    const result = collaborationScheduleEvents([c1, c2, c3]);
    expect(result).toHaveLength(3);
    expect(result[0]!.uid).toBe("collab-first@zzp-platform");
    expect(result[1]!.uid).toBe("collab-second@zzp-platform");
    expect(result[2]!.uid).toBe("collab-third@zzp-platform");
  });

  it("filtert niet-ACTIVE samenwerkingen eruit maar behoudt de rest in volgorde", () => {
    const c1: ScheduleCollaboration = { ...base, id: "a1" };
    const c2: ScheduleCollaboration = { ...base, id: "a2", status: "CANCELLED" };
    const c3: ScheduleCollaboration = { ...base, id: "a3" };
    const result = collaborationScheduleEvents([c1, c2, c3]);
    expect(result).toHaveLength(2);
    expect(result[0]!.uid).toBe("collab-a1@zzp-platform");
    expect(result[1]!.uid).toBe("collab-a3@zzp-platform");
  });
});
