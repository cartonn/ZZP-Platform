import { describe, expect, it } from "vitest";
import { buildMileageLine, centsToEuroInput, MILEAGE_MAX_KM, MILEAGE_MIN_KM } from "./mileage";
import { MILEAGE_RATE_CENTS } from "./config";

describe("buildMileageLine", () => {
  it("berekent het bedrag als kilometers × tarief", () => {
    const result = buildMileageLine({ kilometers: 84, ratePerKmCents: MILEAGE_RATE_CENTS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.line.amountCents).toBe(84 * 23);
    expect(result.line.kilometers).toBe(84);
    expect(result.line.ratePerKmCents).toBe(23);
  });

  it("schrijft een zelf-uitleggende NL-omschrijving met tarief per km", () => {
    const result = buildMileageLine({ kilometers: 12, ratePerKmCents: 23 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.line.description).toBe("Reiskosten — 12 km × € 0,23/km");
  });

  it("accepteert de grenzen van het kilometerbereik", () => {
    expect(buildMileageLine({ kilometers: MILEAGE_MIN_KM, ratePerKmCents: 23 }).ok).toBe(true);
    expect(buildMileageLine({ kilometers: MILEAGE_MAX_KM, ratePerKmCents: 23 }).ok).toBe(true);
  });

  it("staat een tarief van 0 toe (bedrag 0)", () => {
    const result = buildMileageLine({ kilometers: 10, ratePerKmCents: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.line.amountCents).toBe(0);
  });

  it("weigert 0 of negatieve kilometers", () => {
    expect(buildMileageLine({ kilometers: 0, ratePerKmCents: 23 }).ok).toBe(false);
    expect(buildMileageLine({ kilometers: -5, ratePerKmCents: 23 }).ok).toBe(false);
  });

  it("weigert niet-hele kilometers", () => {
    expect(buildMileageLine({ kilometers: 12.5, ratePerKmCents: 23 }).ok).toBe(false);
  });

  it("weigert kilometers boven het maximum", () => {
    expect(buildMileageLine({ kilometers: MILEAGE_MAX_KM + 1, ratePerKmCents: 23 }).ok).toBe(false);
  });

  it("weigert NaN/Infinity als invoer", () => {
    expect(buildMileageLine({ kilometers: NaN, ratePerKmCents: 23 }).ok).toBe(false);
    expect(buildMileageLine({ kilometers: 10, ratePerKmCents: Infinity }).ok).toBe(false);
  });

  it("weigert een niet-heel of negatief tarief", () => {
    expect(buildMileageLine({ kilometers: 10, ratePerKmCents: 22.5 }).ok).toBe(false);
    expect(buildMileageLine({ kilometers: 10, ratePerKmCents: -1 }).ok).toBe(false);
  });

  it("weigert een bedrag boven het int4-factuurplafond", () => {
    // km en tarief zitten elk binnen hun eigen grens, maar het product (1e13 cent) overschrijdt int4.
    const result = buildMileageLine({ kilometers: MILEAGE_MAX_KM, ratePerKmCents: 100_000_000 });
    expect(result.ok).toBe(false);
  });
});

describe("centsToEuroInput", () => {
  it("formatteert centen als een schone euro-decimaalstring", () => {
    expect(centsToEuroInput(23)).toBe("0.23");
    expect(centsToEuroInput(100)).toBe("1.00");
    expect(centsToEuroInput(1234)).toBe("12.34");
  });
});
