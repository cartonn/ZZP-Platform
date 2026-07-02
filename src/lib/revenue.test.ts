import { describe, expect, it } from "vitest";
import { monthlyRevenue, monthDeltaPct } from "./revenue";

const now = new Date("2026-06-09T10:00:00Z");

describe("monthlyRevenue", () => {
  it("groepeert bedragen per kalendermaand, oud naar nieuw", () => {
    const series = monthlyRevenue(
      [
        { occurredAt: new Date("2026-06-01T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-20T08:00:00Z"), totalCents: 50_00 },
        { occurredAt: new Date("2026-05-15T08:00:00Z"), totalCents: 200_00 },
      ],
      now,
      3,
    );
    expect(series.map((m) => m.key)).toEqual(["2026-04", "2026-05", "2026-06"]);
    expect(series.map((m) => m.cents)).toEqual([0, 200_00, 150_00]);
  });

  it("vult ontbrekende maanden met nul", () => {
    const series = monthlyRevenue([], now, 6);
    expect(series).toHaveLength(6);
    expect(series.every((m) => m.cents === 0)).toBe(true);
    expect(series[0]?.key).toEqual("2026-01");
  });

  it("overbrugt een jaargrens correct", () => {
    const series = monthlyRevenue(
      [{ occurredAt: new Date("2025-12-31T20:00:00Z"), totalCents: 75_00 }],
      new Date("2026-02-10T10:00:00Z"),
      4,
    );
    expect(series.map((m) => m.key)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    // 31 dec 20:00Z = 31 dec 21:00 Amsterdam — telt in december.
    expect(series[1]?.cents).toBe(75_00);
  });

  it("rekent in Europe/Amsterdam: een UTC-avond kan in de volgende maand vallen", () => {
    // 31 mei 23:30Z = 1 juni 01:30 Amsterdam (zomertijd) → telt in juni.
    const series = monthlyRevenue(
      [{ occurredAt: new Date("2026-05-31T23:30:00Z"), totalCents: 10_00 }],
      now,
      2,
    );
    expect(series[1]?.key).toBe("2026-06");
    expect(series[1]?.cents).toBe(10_00);
  });

  it("levert NL-maandlabels", () => {
    const series = monthlyRevenue([], now, 2);
    expect(series.map((m) => m.label)).toEqual(["mei", "jun"]);
  });
});

describe("monthDeltaPct", () => {
  it("berekent de verandering t.o.v. de vorige maand", () => {
    const series = monthlyRevenue(
      [
        { occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-05T08:00:00Z"), totalCents: 112_00 },
      ],
      now,
      6,
    );
    expect(monthDeltaPct(series)).toBe(12);
  });

  it("geeft null zonder vergelijkbare basis", () => {
    expect(monthDeltaPct(monthlyRevenue([], now, 6))).toBeNull();
    expect(monthDeltaPct([])).toBeNull();
  });

  it("onderdrukt de trend (null) zolang de lopende maand nog leeg is", () => {
    // Vorige maand (mei) gevuld, lopende maand (juni) nog 0 → geen misleidend "-100%".
    const series = monthlyRevenue(
      [{ occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 100_00 }],
      now,
      6,
    );
    expect(series.at(-1)?.cents).toBe(0);
    expect(monthDeltaPct(series)).toBeNull();
  });
});
