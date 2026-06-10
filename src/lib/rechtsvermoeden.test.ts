import { describe, expect, it } from "vitest";
import {
  assessRateThreshold,
  rechtsvermoedenHint,
  RECHTSVERMOEDEN_DISCLAIMER,
} from "@/lib/rechtsvermoeden";
import { RECHTSVERMOEDEN_DREMPEL_CENTS } from "@/lib/config";

describe("assessRateThreshold", () => {
  it("geeft belowThreshold=true voor een tarief onder de drempel", () => {
    const r = assessRateThreshold(3000); // €30/uur
    expect(r.belowThreshold).toBe(true);
    expect(r.thresholdCents).toBe(RECHTSVERMOEDEN_DREMPEL_CENTS);
  });

  it("geeft belowThreshold=false voor een tarief precies op de drempel", () => {
    const r = assessRateThreshold(3800); // precies €38/uur
    expect(r.belowThreshold).toBe(false);
  });

  it("geeft belowThreshold=false voor een tarief boven de drempel", () => {
    const r = assessRateThreshold(5000); // €50/uur
    expect(r.belowThreshold).toBe(false);
  });

  it("geeft belowThreshold=false bij null-tarief (onbekend tarief = geen signaal)", () => {
    const r = assessRateThreshold(null);
    expect(r.belowThreshold).toBe(false);
  });

  it("geeft het drempel-bedrag altijd terug ongeacht de input", () => {
    expect(assessRateThreshold(0).thresholdCents).toBe(3800);
    expect(assessRateThreshold(null).thresholdCents).toBe(3800);
    expect(assessRateThreshold(10000).thresholdCents).toBe(3800);
  });

  it("grenswaarde: één cent onder de drempel = belowThreshold", () => {
    expect(assessRateThreshold(3799).belowThreshold).toBe(true);
  });

  it("grenswaarde: één cent boven de drempel = niet below", () => {
    expect(assessRateThreshold(3801).belowThreshold).toBe(false);
  });
});

describe("rechtsvermoedenHint", () => {
  it("bevat de drempelwaarde in de tekst", () => {
    expect(rechtsvermoedenHint()).toContain("€38");
  });

  it("bevat de term 'rechtsvermoeden'", () => {
    expect(rechtsvermoedenHint()).toMatch(/rechtsvermoeden/i);
  });

  it("bevat de disclaimertekst", () => {
    expect(rechtsvermoedenHint()).toMatch(/geen juridisch advies/i);
  });
});

describe("RECHTSVERMOEDEN_DISCLAIMER", () => {
  it("is een niet-lege string", () => {
    expect(RECHTSVERMOEDEN_DISCLAIMER.length).toBeGreaterThan(10);
  });
});
