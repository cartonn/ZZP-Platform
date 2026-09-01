import { describe, expect, it } from "vitest";

import {
  amsterdamCivilDayMs,
  amsterdamCivilDayStart,
  fiscalMonthOf,
  fiscalQuarterOf,
  fiscalYearOf,
  quarterStartInstant,
  yearStartInstant,
} from "@/lib/administration/fiscal-calendar";

describe("fiscalYearOf / fiscalMonthOf / fiscalQuarterOf — Europe/Amsterdam", () => {
  it("classificeert een midden-in-de-dag boeking op de burgerlijke datum", () => {
    const d = new Date("2026-05-07T09:12:00.000Z");
    expect(fiscalYearOf(d)).toBe(2026);
    expect(fiscalMonthOf(d)).toBe(4); // mei (0-indexed)
    expect(fiscalQuarterOf(d)).toBe(2);
  });

  it("rekent 31 dec 23:00 UTC (CET) tot 1 jan van het volgende jaar (NL-tijd)", () => {
    // 31 dec 23:00 UTC = 1 jan 00:00 Amsterdam (wintertijd, +1).
    const d = new Date("2025-12-31T23:00:00.000Z");
    expect(fiscalYearOf(d)).toBe(2026);
    expect(fiscalMonthOf(d)).toBe(0); // januari
    expect(fiscalQuarterOf(d)).toBe(1);
  });

  it("laat 31 dec 22:00 UTC nog in het oude jaar vallen", () => {
    // 31 dec 22:00 UTC = 31 dec 23:00 Amsterdam (wintertijd, +1).
    const d = new Date("2025-12-31T22:00:00.000Z");
    expect(fiscalYearOf(d)).toBe(2025);
    expect(fiscalQuarterOf(d)).toBe(4);
  });

  it("schuift de kwartaalgrens Q2→Q3 mee met de zomertijd (+2)", () => {
    // 30 jun 22:00 UTC = 1 jul 00:00 Amsterdam (zomertijd, +2) → Q3.
    expect(fiscalQuarterOf(new Date("2026-06-30T22:00:00.000Z"))).toBe(3);
    // 30 jun 21:59 UTC = 30 jun 23:59 Amsterdam → nog Q2.
    expect(fiscalQuarterOf(new Date("2026-06-30T21:59:00.000Z"))).toBe(2);
  });
});

describe("quarterStartInstant / yearStartInstant", () => {
  it("geeft de UTC-instant van burgerlijke middernacht NL — wintertijd (+1)", () => {
    expect(quarterStartInstant(2026, 1)).toEqual(new Date("2025-12-31T23:00:00.000Z")); // 1 jan
    expect(yearStartInstant(2026)).toEqual(new Date("2025-12-31T23:00:00.000Z"));
  });

  it("geeft de UTC-instant van burgerlijke middernacht NL — zomertijd (+2)", () => {
    expect(quarterStartInstant(2026, 2)).toEqual(new Date("2026-03-31T22:00:00.000Z")); // 1 apr
    expect(quarterStartInstant(2026, 3)).toEqual(new Date("2026-06-30T22:00:00.000Z")); // 1 jul
    expect(quarterStartInstant(2026, 4)).toEqual(new Date("2026-09-30T22:00:00.000Z")); // 1 okt
  });

  it("een instant valt in exact het kwartaal waarvan de grenzen hem omsluiten (self-consistent)", () => {
    for (let q = 1 as 1 | 2 | 3 | 4; q <= 4; q = (q + 1) as 1 | 2 | 3 | 4) {
      const start = quarterStartInstant(2026, q);
      const next =
        q === 4
          ? quarterStartInstant(2027, 1)
          : quarterStartInstant(2026, (q + 1) as 1 | 2 | 3 | 4);
      expect(fiscalQuarterOf(start)).toBe(q);
      expect(fiscalYearOf(start)).toBe(2026);
      // één ms vóór de volgende grens hoort nog bij dit kwartaal
      expect(fiscalQuarterOf(new Date(next.getTime() - 1))).toBe(q);
    }
  });
});

describe("amsterdamCivilDayStart / amsterdamCivilDayMs", () => {
  it("normaliseert een instant naar de UTC-middernacht-epoch van de NL-kalenderdag", () => {
    // 1 jan 00:30 NL (31 dec 23:30 UTC) → dag = 1 jan 2026.
    expect(amsterdamCivilDayMs(new Date("2025-12-31T23:30:00.000Z"))).toBe(Date.UTC(2026, 0, 1));
    // 31 dec 23:30 NL (31 dec 22:30 UTC) → dag = 31 dec 2025.
    expect(amsterdamCivilDayMs(new Date("2025-12-31T22:30:00.000Z"))).toBe(Date.UTC(2025, 11, 31));
  });

  it("amsterdamCivilDayStart is midden op de dag stabiel (idempotent qua dag)", () => {
    const start = amsterdamCivilDayStart(2026, 7, 15); // 15 jul 2026
    expect(amsterdamCivilDayMs(start)).toBe(Date.UTC(2026, 6, 15));
  });
});
