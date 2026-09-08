import { describe, it, expect } from "vitest";
import { MANUAL_ORT_FIELDS, manualOrtSegments } from "@/lib/manual-ort";
import { type OrtSegmentCategory } from "@/lib/ort";

describe("MANUAL_ORT_FIELDS", () => {
  it("heeft 6 velden in canonieke volgorde met de juiste veldnamen", () => {
    expect(MANUAL_ORT_FIELDS.map((f) => f.category)).toEqual([
      "NORMAL",
      "EVENING",
      "NIGHT",
      "SATURDAY",
      "SUNDAY",
      "HOLIDAY",
    ]);
    expect(MANUAL_ORT_FIELDS.map((f) => f.field)).toEqual([
      "ort_normal",
      "ort_evening",
      "ort_night",
      "ort_saturday",
      "ort_sunday",
      "ort_holiday",
    ]);
  });

  it("geeft elk veld een niet-lege NL-label", () => {
    for (const f of MANUAL_ORT_FIELDS) {
      expect(typeof f.label).toBe("string");
      expect(f.label.length).toBeGreaterThan(0);
    }
    expect(MANUAL_ORT_FIELDS.map((f) => f.label)).toEqual([
      "Regulier",
      "Avond",
      "Nacht",
      "Zaterdag",
      "Zondag",
      "Feestdag",
    ]);
  });
});

describe("manualOrtSegments", () => {
  it("lege invoer geeft een lege array", () => {
    expect(manualOrtSegments({})).toEqual([]);
  });

  it("filtert 0, negatief, NaN en Infinity weg en houdt uren > 0 in canonieke volgorde", () => {
    const segments = manualOrtSegments({
      NIGHT: 4,
      NORMAL: 8,
      EVENING: 0,
      SATURDAY: -2,
      SUNDAY: NaN,
      HOLIDAY: Infinity,
    });
    expect(segments).toEqual([
      { category: "NORMAL", hours: 8 },
      { category: "NIGHT", hours: 4 },
    ]);
  });

  it("behoudt kwartier-uren (fracties)", () => {
    expect(manualOrtSegments({ NORMAL: 7.25 })).toEqual([{ category: "NORMAL", hours: 7.25 }]);
  });

  it("volledige invoer levert segmenten in canonieke volgorde", () => {
    const input: Partial<Record<OrtSegmentCategory, number>> = {
      NORMAL: 8,
      EVENING: 2,
      NIGHT: 3,
      SATURDAY: 4,
      SUNDAY: 5,
      HOLIDAY: 6,
    };
    expect(manualOrtSegments(input)).toEqual([
      { category: "NORMAL", hours: 8 },
      { category: "EVENING", hours: 2 },
      { category: "NIGHT", hours: 3 },
      { category: "SATURDAY", hours: 4 },
      { category: "SUNDAY", hours: 5 },
      { category: "HOLIDAY", hours: 6 },
    ]);
  });
});
