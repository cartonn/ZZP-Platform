import { describe, expect, it } from "vitest";
import { startOfIsoWeek, weekOverview, type WeekCollaborationInput } from "@/lib/week-overview";

const DAY = 86_400_000;

function collab(overrides: Partial<WeekCollaborationInput> = {}): WeekCollaborationInput {
  return {
    collaborationId: "c1",
    clientId: "client-1",
    clientName: "Alpha NV",
    jobTitle: "Verpleegkundige",
    startDate: null,
    endDate: null,
    rate: 9500,
    ...overrides,
  };
}

describe("startOfIsoWeek", () => {
  it("geeft de maandag 00:00:00.000 UTC", () => {
    const monday = startOfIsoWeek(new Date("2026-06-03T12:34:56.789Z")); // een woensdag
    expect(monday.getUTCDay()).toBe(1); // maandag
    expect(monday.getUTCHours()).toBe(0);
    expect(monday.getUTCMinutes()).toBe(0);
    expect(monday.getUTCMilliseconds()).toBe(0);
  });

  it("is idempotent op een maandag", () => {
    const monday = startOfIsoWeek(new Date("2026-06-03T00:00:00Z"));
    expect(startOfIsoWeek(monday).getTime()).toBe(monday.getTime());
  });

  it("rekent zondag terug naar de maandag ervoor (ISO-week)", () => {
    // Zondag valt aan het einde van de ISO-week.
    const sunday = new Date("2026-06-07T10:00:00Z");
    const monday = startOfIsoWeek(sunday);
    expect(monday.getUTCDay()).toBe(1);
    expect((sunday.getTime() - monday.getTime()) / DAY).toBeCloseTo(6 + 10 / 24, 5);
  });

  it("bevat de referentiedatum binnen [weekStart, weekStart+7d)", () => {
    const ref = new Date("2026-02-28T18:00:00Z");
    const ws = startOfIsoWeek(ref);
    expect(ref.getTime()).toBeGreaterThanOrEqual(ws.getTime());
    expect(ref.getTime()).toBeLessThan(ws.getTime() + 7 * DAY);
  });
});

describe("weekOverview", () => {
  const ref = new Date("2026-06-03T12:00:00Z");
  const ws = startOfIsoWeek(ref);
  const we = new Date(ws.getTime() + 7 * DAY - 1);

  it("zet weekgrenzen op maandag..zondag", () => {
    const { weekStart, weekEnd } = weekOverview([], ref);
    expect(weekStart.getTime()).toBe(ws.getTime());
    expect(weekEnd.getTime()).toBe(we.getTime());
  });

  it("classificeert de timing per samenwerking", () => {
    const result = weekOverview(
      [
        collab({
          collaborationId: "ongoing",
          startDate: new Date(ws.getTime() - 30 * DAY),
          endDate: new Date(ws.getTime() + 30 * DAY),
        }),
        collab({
          collaborationId: "starts",
          clientName: "Bravo BV",
          startDate: new Date(ws.getTime() + 1 * DAY),
          endDate: new Date(ws.getTime() + 60 * DAY),
        }),
        collab({
          collaborationId: "ends",
          clientName: "Charlie CV",
          startDate: new Date(ws.getTime() - 30 * DAY),
          endDate: new Date(ws.getTime() + 2 * DAY),
        }),
        collab({
          collaborationId: "both",
          clientName: "Delta DV",
          startDate: new Date(ws.getTime() + 1 * DAY),
          endDate: new Date(ws.getTime() + 3 * DAY),
        }),
        collab({ collaborationId: "open", clientName: "Echo EV", startDate: null, endDate: null }),
      ],
      ref,
    );
    const byId = Object.fromEntries(result.entries.map((e) => [e.collaborationId, e.timing]));
    expect(byId["ongoing"]).toBe("ongoing");
    expect(byId["starts"]).toBe("starts-this-week");
    expect(byId["ends"]).toBe("ends-this-week");
    expect(byId["both"]).toBe("starts-and-ends");
    expect(byId["open"]).toBe("ongoing");
  });

  it("sluit samenwerkingen buiten de week uit (toekomstig of al geëindigd)", () => {
    const result = weekOverview(
      [
        collab({ collaborationId: "future", startDate: new Date(we.getTime() + 5 * DAY) }),
        collab({ collaborationId: "past", endDate: new Date(ws.getTime() - 5 * DAY) }),
        collab({
          collaborationId: "now",
          startDate: new Date(ws.getTime() - DAY),
          endDate: new Date(we.getTime() + DAY),
        }),
      ],
      ref,
    );
    expect(result.entries.map((e) => e.collaborationId)).toEqual(["now"]);
  });

  it("telt verschillende opdrachtgevers", () => {
    const result = weekOverview(
      [
        collab({ collaborationId: "a1", clientId: "x", clientName: "Alpha" }),
        collab({ collaborationId: "a2", clientId: "x", clientName: "Alpha" }),
        collab({ collaborationId: "b1", clientId: "y", clientName: "Bravo" }),
      ],
      ref,
    );
    expect(result.clientCount).toBe(2);
    expect(result.entries).toHaveLength(3);
  });

  it("sorteert op opdrachtgever, dan startdatum, dan id", () => {
    const result = weekOverview(
      [
        collab({ collaborationId: "z", clientId: "z", clientName: "Zorg BV" }),
        collab({
          collaborationId: "a-late",
          clientId: "a",
          clientName: "Alpha NV",
          startDate: new Date(ws.getTime() + 1 * DAY),
        }),
        collab({
          collaborationId: "a-early",
          clientId: "a",
          clientName: "Alpha NV",
          startDate: new Date(ws.getTime() - 10 * DAY),
        }),
      ],
      ref,
    );
    expect(result.entries.map((e) => e.collaborationId)).toEqual(["a-early", "a-late", "z"]);
  });

  it("geeft een leeg overzicht zonder samenwerkingen", () => {
    const result = weekOverview([], ref);
    expect(result.entries).toEqual([]);
    expect(result.clientCount).toBe(0);
  });

  it("draagt het vastgelegde weekrooster (ADR-0004) mee naar de entry", () => {
    const result = weekOverview([collab({ weekdays: ["MON", "WED", "FRI"] })], ref);
    expect(result.entries[0]?.weekdays).toEqual(["MON", "WED", "FRI"]);
  });

  it("laat weekdays ongedefinieerd wanneer niet vastgelegd (terugval op timing)", () => {
    const result = weekOverview([collab()], ref);
    expect(result.entries[0]?.weekdays).toBeUndefined();
  });
});
