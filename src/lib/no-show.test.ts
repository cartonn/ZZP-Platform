import { describe, expect, it } from "vitest";
import {
  NO_SHOW_LIMIT,
  noShowOccurredOnDayRange,
  noShowStanding,
  noShowStandingNotice,
} from "@/lib/no-show";

describe("noShowStanding", () => {
  it("zonder ongegronde no-shows is er niets aan de hand", () => {
    expect(noShowStanding(0)).toEqual({ unjustified: 0, remaining: NO_SHOW_LIMIT, atLimit: false });
  });

  it("telt af richting de grens", () => {
    expect(noShowStanding(1)).toEqual({ unjustified: 1, remaining: 2, atLimit: false });
    expect(noShowStanding(2)).toEqual({ unjustified: 2, remaining: 1, atLimit: false });
  });

  it("op de grens (3) is de uitschrijf-taak aan de orde", () => {
    expect(noShowStanding(NO_SHOW_LIMIT)).toEqual({
      unjustified: 3,
      remaining: 0,
      atLimit: true,
    });
  });

  it("boven de grens blijft atLimit waar en remaining 0", () => {
    expect(noShowStanding(5)).toEqual({ unjustified: 5, remaining: 0, atLimit: true });
  });

  it("negatieve invoer wordt op 0 geklemd", () => {
    expect(noShowStanding(-2)).toEqual({ unjustified: 0, remaining: 3, atLimit: false });
  });

  it("eigen grens overschrijft de default", () => {
    expect(noShowStanding(2, 2)).toEqual({ unjustified: 2, remaining: 0, atLimit: true });
  });
});

describe("noShowStandingNotice", () => {
  it("geeft niets terug zonder ongegronde no-shows (geen passief signaal)", () => {
    expect(noShowStandingNotice(0)).toBeNull();
    expect(noShowStandingNotice(-1)).toBeNull();
  });

  it("onder de grens: waarschuwing met resterend aantal tot uitschrijving", () => {
    const notice = noShowStandingNotice(1);
    expect(notice).not.toBeNull();
    expect(notice!.tone).toBe("warning");
    expect(notice!.atLimit).toBe(false);
    expect(notice!.remaining).toBe(2);
    expect(notice!.title).toContain("1 ongegronde no-show");
    expect(notice!.detail).toContain("Nog 2 meldingen");
  });

  it("enkelvoud-pluralisatie klopt bij nog één melding te gaan (2 van 3)", () => {
    const notice = noShowStandingNotice(2);
    expect(notice!.tone).toBe("warning");
    expect(notice!.title).toContain("2 ongegronde no-shows");
    expect(notice!.detail).toContain("Nog 1 melding vóór");
    expect(notice!.detail).not.toContain("1 meldingen");
  });

  it("op de grens: danger-toon, uitschrijving in beraad door een beheerder", () => {
    const notice = noShowStandingNotice(NO_SHOW_LIMIT);
    expect(notice!.tone).toBe("danger");
    expect(notice!.atLimit).toBe(true);
    expect(notice!.title).toBe("Grens ongegronde no-shows bereikt");
    expect(notice!.detail).toContain("beheerder");
  });

  it("boven de grens blijft danger (blijvende historie)", () => {
    expect(noShowStandingNotice(5)!.tone).toBe("danger");
  });

  it("respecteert een eigen grens", () => {
    expect(noShowStandingNotice(2, 2)!.tone).toBe("danger");
    expect(noShowStandingNotice(1, 2)!.tone).toBe("warning");
  });
});

describe("noShowOccurredOnDayRange", () => {
  it("kale datum (middernacht UTC): venster is die dag [00:00, +1 dag 00:00)", () => {
    const { gte, lt } = noShowOccurredOnDayRange(new Date("2026-03-15T00:00:00.000Z"));
    expect(gte.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2026-03-16T00:00:00.000Z");
  });

  it("datum mét tijdcomponent valt in hetzelfde dagvenster (dedup dekt geknutselde POST)", () => {
    const { gte, lt } = noShowOccurredOnDayRange(new Date("2026-03-15T13:37:42.500Z"));
    expect(gte.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2026-03-16T00:00:00.000Z");
  });

  it("laatste milliseconde van de dag valt nog in het venster, middernacht erna niet", () => {
    const { gte, lt } = noShowOccurredOnDayRange(new Date("2026-03-15T23:59:59.999Z"));
    const dayEndMs = new Date("2026-03-15T23:59:59.999Z").getTime();
    expect(dayEndMs).toBeGreaterThanOrEqual(gte.getTime());
    expect(dayEndMs).toBeLessThan(lt.getTime());
    expect(lt.getTime()).toBe(new Date("2026-03-16T00:00:00.000Z").getTime());
  });

  it("maandgrens rolt correct door naar de volgende maand", () => {
    const { gte, lt } = noShowOccurredOnDayRange(new Date("2026-01-31T08:00:00.000Z"));
    expect(gte.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});
