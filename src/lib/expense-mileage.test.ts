import { describe, it, expect } from "vitest";
import {
  MILEAGE_RATE_CENTS,
  MILEAGE_MAX_KM,
  mileageExpenseNetCents,
  parseExpenseKilometers,
  mileageRateLabel,
  summarizeMileage,
  mileageTripLog,
  type MileageLike,
} from "@/lib/expense-mileage";

describe("mileageExpenseNetCents", () => {
  it("rekent het vaste tarief per kilometer", () => {
    expect(mileageExpenseNetCents(1)).toBe(MILEAGE_RATE_CENTS);
    expect(mileageExpenseNetCents(10)).toBe(10 * MILEAGE_RATE_CENTS);
    expect(mileageExpenseNetCents(42)).toBe(42 * MILEAGE_RATE_CENTS);
  });

  it("levert altijd een geheel centenbedrag", () => {
    expect(Number.isInteger(mileageExpenseNetCents(7))).toBe(true);
    expect(mileageExpenseNetCents(3)).toBe(3 * MILEAGE_RATE_CENTS);
  });

  it("levert 0 bij niet-positieve, niet-eindige of te grote invoer", () => {
    expect(mileageExpenseNetCents(0)).toBe(0);
    expect(mileageExpenseNetCents(-5)).toBe(0);
    expect(mileageExpenseNetCents(Number.NaN)).toBe(0);
    expect(mileageExpenseNetCents(Number.POSITIVE_INFINITY)).toBe(0);
    expect(mileageExpenseNetCents(MILEAGE_MAX_KM + 1)).toBe(0);
  });

  it("accepteert de bovengrens zelf", () => {
    expect(mileageExpenseNetCents(MILEAGE_MAX_KM)).toBe(MILEAGE_MAX_KM * MILEAGE_RATE_CENTS);
  });
});

describe("parseExpenseKilometers", () => {
  it("accepteert een positief geheel getal", () => {
    expect(parseExpenseKilometers("42")).toBe(42);
    expect(parseExpenseKilometers("  7  ")).toBe(7);
    expect(parseExpenseKilometers(String(MILEAGE_MAX_KM))).toBe(MILEAGE_MAX_KM);
  });

  it("weigert leeg, nul, negatief, decimaal, tekst en te groot", () => {
    expect(parseExpenseKilometers("")).toBeNull();
    expect(parseExpenseKilometers("0")).toBeNull();
    expect(parseExpenseKilometers("-3")).toBeNull();
    expect(parseExpenseKilometers("4,5")).toBeNull();
    expect(parseExpenseKilometers("4.5")).toBeNull();
    expect(parseExpenseKilometers("veel")).toBeNull();
    expect(parseExpenseKilometers(String(MILEAGE_MAX_KM + 1))).toBeNull();
  });
});

describe("mileageRateLabel", () => {
  it("toont het tarief in NL-notatie", () => {
    expect(mileageRateLabel()).toBe("0,23");
  });
});

function expense(over: Partial<MileageLike> = {}): MileageLike {
  return {
    occurredAt: new Date("2026-05-10T00:00:00.000Z"),
    description: "Rit",
    kilometers: null,
    ...over,
  };
}

describe("summarizeMileage", () => {
  it("telt alleen ritten met een geldig km-aantal en leidt de aftrek canoniek af", () => {
    const rows: MileageLike[] = [
      expense({ kilometers: 42 }),
      expense({ kilometers: 8 }),
      expense({ kilometers: null }), // geen rit → telt niet
      expense({ kilometers: 0 }), // nul → telt niet
    ];
    const summary = summarizeMileage(rows);
    expect(summary.tripCount).toBe(2);
    expect(summary.totalKm).toBe(50);
    expect(summary.totalNetCents).toBe(50 * MILEAGE_RATE_CENTS);
  });

  it("negeert ongeldige of te grote km-waarden (spiegelt de invoer-validatie)", () => {
    const rows: MileageLike[] = [
      expense({ kilometers: 10 }),
      expense({ kilometers: MILEAGE_MAX_KM + 1 }), // boven de grens
      expense({ kilometers: 4.5 }), // niet-heel
      expense({ kilometers: -3 }), // negatief
      expense({ kilometers: Number.NaN }),
    ];
    const summary = summarizeMileage(rows);
    expect(summary.tripCount).toBe(1);
    expect(summary.totalKm).toBe(10);
    expect(summary.totalNetCents).toBe(10 * MILEAGE_RATE_CENTS);
  });

  it("filtert op kalenderjaar (UTC)", () => {
    const rows: MileageLike[] = [
      expense({ kilometers: 20, occurredAt: new Date("2026-02-01T00:00:00.000Z") }),
      expense({ kilometers: 30, occurredAt: new Date("2025-12-31T23:00:00.000Z") }),
    ];
    const summary = summarizeMileage(rows, { year: 2026 });
    expect(summary.tripCount).toBe(1);
    expect(summary.totalKm).toBe(20);
  });

  it("levert nulwaarden bij een lege of ritloze lijst", () => {
    expect(summarizeMileage([])).toEqual({ tripCount: 0, totalKm: 0, totalNetCents: 0 });
    expect(summarizeMileage([expense({ kilometers: null })])).toEqual({
      tripCount: 0,
      totalKm: 0,
      totalNetCents: 0,
    });
  });

  it("accepteert de bovengrens zelf", () => {
    const summary = summarizeMileage([expense({ kilometers: MILEAGE_MAX_KM })]);
    expect(summary.totalKm).toBe(MILEAGE_MAX_KM);
    expect(summary.totalNetCents).toBe(MILEAGE_MAX_KM * MILEAGE_RATE_CENTS);
  });
});

describe("mileageTripLog", () => {
  it("levert één regel per geldige rit, recentste eerst, met canonieke aftrek", () => {
    const rows: MileageLike[] = [
      expense({
        description: "Oud",
        kilometers: 10,
        occurredAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      expense({
        description: "Nieuw",
        kilometers: 5,
        occurredAt: new Date("2026-03-01T00:00:00.000Z"),
      }),
      expense({ description: "Geen rit", kilometers: null }),
    ];
    const log = mileageTripLog(rows);
    expect(log.map((t) => t.description)).toEqual(["Nieuw", "Oud"]);
    expect(log[0]).toMatchObject({ kilometers: 5, netCents: 5 * MILEAGE_RATE_CENTS });
  });

  it("tiebreakt stabiel op omschrijving bij dezelfde datum", () => {
    const at = new Date("2026-04-04T00:00:00.000Z");
    const log = mileageTripLog([
      expense({ description: "Bravo", kilometers: 1, occurredAt: at }),
      expense({ description: "Alfa", kilometers: 2, occurredAt: at }),
    ]);
    expect(log.map((t) => t.description)).toEqual(["Alfa", "Bravo"]);
  });

  it("filtert op kalenderjaar en negeert ongeldige km", () => {
    const log = mileageTripLog(
      [
        expense({ kilometers: 20, occurredAt: new Date("2026-06-01T00:00:00.000Z") }),
        expense({ kilometers: 30, occurredAt: new Date("2025-06-01T00:00:00.000Z") }),
        expense({ kilometers: 0, occurredAt: new Date("2026-06-02T00:00:00.000Z") }),
      ],
      { year: 2026 },
    );
    expect(log).toHaveLength(1);
    expect(log[0]?.kilometers).toBe(20);
  });
});
