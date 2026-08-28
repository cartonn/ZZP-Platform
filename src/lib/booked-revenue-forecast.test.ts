import { describe, expect, it } from "vitest";

import { type Weekday } from "@/lib/enums";
import {
  buildBookedRevenueForecast,
  type BookedCollaborationInput,
} from "@/lib/booked-revenue-forecast";

// Alle tests gebruiken een VASTE `now` zodat elke berekening deterministisch en met de hand na te
// rekenen is. Datums worden met lokale componenten (`new Date(y, m, d)`) gebouwd, net als de bron —
// zo blijven ze onafhankelijk van tijdzone-parsing van ISO-strings.
//
// Ankerdag: maandag 14 september 2026, 10:30 lokaal.
//   di 15, wo 16, do 17, vr 18, za 19, zo 20, ma 21, di 22, wo 23, do 24, vr 25, za 26, zo 27,
//   ma 28, di 29, wo 30 | do 1 okt, vr 2 okt, za 3 okt ...
const NOW = new Date(2026, 8, 14, 10, 30, 0);

const WORK_HOURS_PER_DAY = 8;

/** Dagwaarde in centen bij een gegeven uurtarief (rate × 8 uur × 100 ct). */
function dayCents(rate: number): number {
  return Math.round(rate * WORK_HOURS_PER_DAY * 100);
}

/** Kleine factory zodat de tests leesbaar blijven; overschrijf alleen wat relevant is. */
function collab(overrides: Partial<BookedCollaborationInput> = {}): BookedCollaborationInput {
  return {
    rate: 100,
    startDate: null,
    endDate: null,
    weekdays: [],
    counterpartyName: "Opdrachtgever BV",
    jobTitle: "Verpleegkundige",
    ...overrides,
  };
}

const MON_WED_FRI: Weekday[] = ["MON", "WED", "FRI"];
const MON_FRI: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI"];

describe("buildBookedRevenueForecast", () => {
  it("levert nullen/leeg/null bij lege input", () => {
    const result = buildBookedRevenueForecast([], NOW);
    expect(result.totalBookedCents).toBe(0);
    expect(result.months).toEqual([]);
    expect(result.runwayUntil).toBeNull();
    expect(result.runwayDays).toBeNull();
    expect(result.contributingCount).toBe(0);
    expect(result.openEndedCount).toBe(0);
  });

  it("rekent één samenwerking met expliciete weekdagen exact uit (handmatig telbaar venster)", () => {
    // Venster ma 14 t/m vr 18 sep, patroon MA/WO/VR → 3 geplande dagen: 14, 16, 18.
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: MON_WED_FRI,
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(3 * dayCents(100)); // 3 × 80.000 = 240.000
    expect(result.totalBookedCents).toBe(240_000);
    expect(result.months).toEqual([{ key: "2026-09", label: "september 2026", cents: 240_000 }]);
    expect(result.contributingCount).toBe(1);
    expect(result.openEndedCount).toBe(0);
    expect(result.runwayUntil).toEqual(new Date(2026, 8, 18));
    expect(result.runwayDays).toBe(4);
  });

  it("verdeelt de waarde over de juiste maand-emmers rond een maandgrens", () => {
    // Venster ma 14 sep t/m vr 2 okt, patroon MA–VR.
    // September-weekdagen: 14,15,16,17,18, 21,22,23,24,25, 28,29,30 = 13 dagen.
    // Oktober-weekdagen: 1, 2 = 2 dagen.
    const rate = 50;
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 9, 2),
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );

    expect(result.months).toEqual([
      { key: "2026-09", label: "september 2026", cents: 13 * dayCents(rate) },
      { key: "2026-10", label: "oktober 2026", cents: 2 * dayCents(rate) },
    ]);
    // Oplopend gesorteerd op key.
    expect(result.months.map((m) => m.key)).toEqual(["2026-09", "2026-10"]);
    // Maand-emmers sommeren tot het totaal.
    const summed = result.months.reduce((acc, m) => acc + m.cents, 0);
    expect(summed).toBe(result.totalBookedCents);
    expect(result.totalBookedCents).toBe(15 * dayCents(rate));
    expect(result.contributingCount).toBe(1);
  });

  it("valt terug op ma–vr wanneer weekdays leeg is", () => {
    // Venster ma 14 t/m vr 18 sep, lege weekdays → default MA–VR → 5 dagen (14,15,16,17,18).
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 10,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: [],
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(5 * dayCents(10));
    expect(result.contributingCount).toBe(1);
    expect(result.months).toHaveLength(1);
    expect(result.months[0]?.cents).toBe(5 * dayCents(10));
  });

  it("slaat een samenwerking zonder tarief (rate == null) volledig over", () => {
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: null,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(0);
    expect(result.contributingCount).toBe(0);
    expect(result.openEndedCount).toBe(0);
    expect(result.runwayUntil).toBeNull();
    expect(result.months).toEqual([]);
  });

  it("slaat een niet-positief tarief (0 en negatief) over", () => {
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 0,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: MON_FRI,
        }),
        collab({
          rate: -75,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(0);
    expect(result.contributingCount).toBe(0);
    expect(result.openEndedCount).toBe(0);
    expect(result.runwayUntil).toBeNull();
  });

  it("telt een doorlopende samenwerking (endDate == null, rate > 0) als open-ended zonder waarde", () => {
    const result = buildBookedRevenueForecast(
      [collab({ rate: 90, startDate: new Date(2026, 8, 14), endDate: null, weekdays: MON_FRI })],
      NOW,
    );

    expect(result.openEndedCount).toBe(1);
    expect(result.totalBookedCents).toBe(0);
    expect(result.contributingCount).toBe(0);
    expect(result.runwayUntil).toBeNull();
    expect(result.runwayDays).toBeNull();
    expect(result.months).toEqual([]);
  });

  it("slaat een samenwerking met een einddatum volledig in het verleden over", () => {
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 1),
          endDate: new Date(2026, 8, 10), // 10 sep, vóór de ankerdag 14 sep
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(0);
    expect(result.contributingCount).toBe(0);
    expect(result.openEndedCount).toBe(0);
    expect(result.runwayUntil).toBeNull();
  });

  it("laat het venster op de toekomstige startdatum beginnen, niet vandaag", () => {
    // startDate ma 21 sep (na de ankerdag), endDate vr 25 sep → venster 21..25 = 5 weekdagen.
    const future = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 21),
          endDate: new Date(2026, 8, 25),
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );
    // Zelfde samenwerking maar startend vandaag zou 14..25 beslaan (méér dagen).
    const fromToday = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 25),
          weekdays: MON_FRI,
        }),
      ],
      NOW,
    );

    expect(future.totalBookedCents).toBe(5 * dayCents(100));
    expect(future.totalBookedCents).toBeLessThan(fromToday.totalBookedCents);
    expect(future.runwayUntil).toEqual(new Date(2026, 8, 25));
    expect(future.runwayDays).toBe(11);
  });

  it("laat het venster vandaag beginnen wanneer startDate null is en endDate in de toekomst ligt", () => {
    // startDate null, endDate vr 18 sep → venster vandaag (14) t/m 18 = 5 weekdagen.
    const result = buildBookedRevenueForecast(
      [collab({ rate: 100, startDate: null, endDate: new Date(2026, 8, 18), weekdays: MON_FRI })],
      NOW,
    );

    expect(result.totalBookedCents).toBe(5 * dayCents(100));
    expect(result.contributingCount).toBe(1);
    expect(result.runwayUntil).toEqual(new Date(2026, 8, 18));
    expect(result.runwayDays).toBe(4);
  });

  it("zet runwayUntil op de verste einddatum en runwayDays op het kalenderverschil", () => {
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18), // dichterbij
          weekdays: MON_FRI,
        }),
        collab({
          rate: 80,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 30), // verder weg
          weekdays: MON_FRI,
          counterpartyName: "Tweede Opdrachtgever",
        }),
      ],
      NOW,
    );

    expect(result.contributingCount).toBe(2);
    expect(result.runwayUntil).toEqual(new Date(2026, 8, 30));
    expect(result.runwayDays).toBe(16);
    // Totaal = som van beide bijdragen; maand-emmers sommeren tot het totaal.
    const summed = result.months.reduce((acc, m) => acc + m.cents, 0);
    expect(summed).toBe(result.totalBookedCents);
  });

  it("telt een samenwerking zonder geplande dag in het venster niet mee en zet geen runway", () => {
    // Patroon alleen ZA, venster ma 14 t/m vr 18 sep bevat geen zaterdag → 0 geplande dagen.
    const result = buildBookedRevenueForecast(
      [
        collab({
          rate: 100,
          startDate: new Date(2026, 8, 14),
          endDate: new Date(2026, 8, 18),
          weekdays: ["SAT"],
        }),
      ],
      NOW,
    );

    expect(result.totalBookedCents).toBe(0);
    expect(result.contributingCount).toBe(0);
    expect(result.runwayUntil).toBeNull();
    expect(result.runwayDays).toBeNull();
    expect(result.months).toEqual([]);
  });

  it("plafonneert het venster op MAX_HORIZON_DAYS maar houdt runwayUntil op de échte verre einddatum", () => {
    // Einddatum ~3 jaar vooruit (14 sep 2029). Het dag-voor-dag-venster wordt op 730 dagen afgekapt,
    // maar runwayUntil blijft de werkelijke einddatum tonen.
    const farEnd = new Date(2029, 8, 14);
    const result = buildBookedRevenueForecast(
      [collab({ rate: 100, startDate: new Date(2026, 8, 14), endDate: farEnd, weekdays: MON_FRI })],
      NOW,
    );

    expect(result.totalBookedCents).toBeGreaterThan(0);
    expect(result.contributingCount).toBe(1);
    // runwayUntil = de echte einddatum, niet de geplafonneerde horizon (730 dagen).
    expect(result.runwayUntil).toEqual(farEnd);
    expect(result.runwayDays).toBe(1096);
    expect(result.runwayDays!).toBeGreaterThan(730);
    // De maand-emmers sommeren nog altijd exact tot het (geplafonneerde) totaal.
    const summed = result.months.reduce((acc, m) => acc + m.cents, 0);
    expect(summed).toBe(result.totalBookedCents);
  });

  it("aggregeert een gemengde portfolio (bijdragend + open-ended + overgeslagen) correct", () => {
    const contributing = collab({
      rate: 100,
      startDate: new Date(2026, 8, 14),
      endDate: new Date(2026, 8, 18),
      weekdays: MON_WED_FRI, // 14, 16, 18 → 3 dagen
      counterpartyName: "Bijdragend BV",
    });
    const openEnded = collab({
      rate: 120,
      startDate: new Date(2026, 8, 14),
      endDate: null,
      weekdays: MON_FRI,
      counterpartyName: "Doorlopend BV",
    });
    const skippedNull = collab({
      rate: null,
      startDate: new Date(2026, 8, 14),
      endDate: new Date(2026, 8, 30),
      weekdays: MON_FRI,
      counterpartyName: "Zonder Tarief BV",
    });

    const result = buildBookedRevenueForecast([contributing, openEnded, skippedNull], NOW);

    expect(result.contributingCount).toBe(1);
    expect(result.openEndedCount).toBe(1);
    expect(result.totalBookedCents).toBe(3 * dayCents(100));
    expect(result.runwayUntil).toEqual(new Date(2026, 8, 18));
    expect(result.runwayDays).toBe(4);
    const summed = result.months.reduce((acc, m) => acc + m.cents, 0);
    expect(summed).toBe(result.totalBookedCents);
  });
});
