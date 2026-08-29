import { describe, it, expect } from "vitest";
import {
  MILEAGE_RATE_CENTS,
  MILEAGE_MAX_KM,
  mileageExpenseNetCents,
  parseExpenseKilometers,
  mileageRateLabel,
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
