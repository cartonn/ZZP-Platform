import { describe, expect, it } from "vitest";
import { jobRateFitChip } from "./job-rate-fit";

describe("jobRateFitChip", () => {
  it("geeft null zonder eigen tarief", () => {
    expect(jobRateFitChip(null, 40, 80)).toBeNull();
    expect(jobRateFitChip(undefined, 40, 80)).toBeNull();
  });

  it("geeft null bij een niet-positief eigen tarief", () => {
    expect(jobRateFitChip(0, 40, 80)).toBeNull();
    expect(jobRateFitChip(-10, 40, 80)).toBeNull();
  });

  it("geeft null wanneer de opdracht geen budgetgrenzen heeft", () => {
    expect(jobRateFitChip(60, null, null)).toBeNull();
    expect(jobRateFitChip(60, undefined, undefined)).toBeNull();
  });

  it("geeft null wanneer het eigen tarief binnen het budget valt", () => {
    expect(jobRateFitChip(60, 40, 80)).toBeNull();
    // grenzen inclusief: precies op de bodem of het plafond = binnen
    expect(jobRateFitChip(40, 40, 80)).toBeNull();
    expect(jobRateFitChip(80, 40, 80)).toBeNull();
  });

  it("waarschuwt wanneer het budgetplafond onder het eigen tarief ligt", () => {
    expect(jobRateFitChip(90, 40, 80)).toEqual({ label: "Onder je tarief", tone: "warning" });
    // alleen een plafond bekend
    expect(jobRateFitChip(90, null, 80)).toEqual({ label: "Onder je tarief", tone: "warning" });
  });

  it("markeert een kans wanneer de budgetbodem boven het eigen tarief ligt", () => {
    expect(jobRateFitChip(30, 40, 80)).toEqual({ label: "Boven je tarief", tone: "good" });
    // alleen een bodem bekend
    expect(jobRateFitChip(30, 40, null)).toEqual({ label: "Boven je tarief", tone: "good" });
  });

  it("laat het plafond (warning) vóór de bodem gaan bij een omgekeerde grensvolgorde", () => {
    // rateMin > rateMax (defensief): tarief 100 ligt boven beide → de 'betaalt minder'-waarschuwing wint
    expect(jobRateFitChip(100, 90, 80)).toEqual({ label: "Onder je tarief", tone: "warning" });
  });

  it("geeft geen chip wanneer alleen een plafond bekend is en het tarief eronder valt", () => {
    // plafond 80, tarief 50 → binnen (geen ondergrens die 'boven je tarief' zou triggeren)
    expect(jobRateFitChip(50, null, 80)).toBeNull();
  });
});
