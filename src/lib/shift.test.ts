import { describe, expect, it } from "vitest";
import { segmentShift, segmentShifts, dutchHolidays } from "@/lib/shift";
import { DEFAULT_ORT_RATES_BPS, ORT_SECTOR_PROFILES } from "@/lib/config";

/** Hulp: som van alle uren in de segmenten. */
function totalHours(segs: { hours: number }[]): number {
  return Math.round(segs.reduce((s, x) => s + x.hours, 0) * 100) / 100;
}
/** Hulp: uren voor een categorie. */
function hoursFor(segs: { category: string; hours: number }[], cat: string): number {
  return segs.find((s) => s.category === cat)?.hours ?? 0;
}

describe("segmentShift", () => {
  it("reguliere dagdienst → alles NORMAL", () => {
    // maandag 9 jun 2025, 09:00–17:00
    const segs = segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 17, 0));
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ category: "NORMAL", hours: 8 });
  });

  it("nachtdienst over middernacht → NIGHT", () => {
    // maandag 22:00 → dinsdag 06:00 = 8 uur nacht
    const segs = segmentShift(new Date(2025, 5, 9, 22, 0), new Date(2025, 5, 10, 6, 0));
    expect(hoursFor(segs, "NIGHT")).toBe(8);
    expect(totalHours(segs)).toBe(8);
  });

  it("avonddienst → EVENING tot 22:00, daarna NIGHT", () => {
    // maandag 18:00–23:00 = 4u avond + 1u nacht
    const segs = segmentShift(new Date(2025, 5, 9, 18, 0), new Date(2025, 5, 9, 23, 0));
    expect(hoursFor(segs, "EVENING")).toBe(4);
    expect(hoursFor(segs, "NIGHT")).toBe(1);
  });

  it("gemengde dienst dag→avond", () => {
    // maandag 16:00–20:00 = 2u NORMAL + 2u EVENING
    const segs = segmentShift(new Date(2025, 5, 9, 16, 0), new Date(2025, 5, 9, 20, 0));
    expect(hoursFor(segs, "NORMAL")).toBe(2);
    expect(hoursFor(segs, "EVENING")).toBe(2);
  });

  it("zaterdagdienst overdag → SATURDAY", () => {
    // zaterdag 14 jun 2025, 09:00–17:00
    const segs = segmentShift(new Date(2025, 5, 14, 9, 0), new Date(2025, 5, 14, 17, 0));
    expect(hoursFor(segs, "SATURDAY")).toBe(8);
  });

  it("zondag wint van avond (hoogste toeslag)", () => {
    // zondag 15 jun 2025, 18:00–22:00 — zondag (+72%) > avond (+22%)
    const segs = segmentShift(new Date(2025, 5, 15, 18, 0), new Date(2025, 5, 15, 22, 0));
    expect(hoursFor(segs, "SUNDAY")).toBe(4);
    expect(hoursFor(segs, "EVENING")).toBe(0);
  });

  it("feestdag wint van nacht (hoogste toeslag)", () => {
    // 1e Kerstdag 2025 (do) 00:00–06:00 — feestdag (+100%) > nacht (+49%)
    const holidays = dutchHolidays(2025);
    const segs = segmentShift(new Date(2025, 11, 25, 0, 0), new Date(2025, 11, 25, 6, 0), {
      holidays,
    });
    expect(hoursFor(segs, "HOLIDAY")).toBe(6);
    expect(hoursFor(segs, "NIGHT")).toBe(0);
  });

  it("precedentie volgt het sectorprofiel: andere rates kunnen anders kiezen", () => {
    // zaterdagnacht: vergelijk SATURDAY vs NIGHT per profiel.
    const segs = segmentShift(new Date(2025, 5, 14, 22, 0), new Date(2025, 5, 15, 0, 0), {
      rates: ORT_SECTOR_PROFILES.VVT,
    });
    // VVT: zaterdag +49% > nacht +44% → SATURDAY wint
    expect(hoursFor(segs, "SATURDAY")).toBe(2);
  });

  it("kwartierresolutie: half uur telt mee", () => {
    const segs = segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 9, 30));
    expect(totalHours(segs)).toBe(0.5);
  });

  it("weigert eind ≤ begin en ongeldige datums", () => {
    expect(() => segmentShift(new Date(2025, 5, 9, 17, 0), new Date(2025, 5, 9, 9, 0))).toThrow();
    expect(() => segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 9, 0))).toThrow();
    expect(() => segmentShift(new Date("x"), new Date(2025, 5, 9, 9, 0))).toThrow();
  });

  it("som van segment-uren = duur van de dienst", () => {
    // vrijdag 18:00 → zaterdag 02:00 = 8 uur, gespreid over avond/nacht/zaterdag
    const segs = segmentShift(new Date(2025, 5, 13, 18, 0), new Date(2025, 5, 14, 2, 0), {
      rates: DEFAULT_ORT_RATES_BPS,
    });
    expect(totalHours(segs)).toBe(8);
  });
});

describe("segmentShifts — meerdere diensten aggregeren", () => {
  it("telt gelijke categorieën over diensten op", () => {
    const segs = segmentShifts([
      { start: new Date(2025, 5, 9, 9, 0), end: new Date(2025, 5, 9, 17, 0) }, // ma 8u NORMAL
      { start: new Date(2025, 5, 10, 9, 0), end: new Date(2025, 5, 10, 17, 0) }, // di 8u NORMAL
    ]);
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "NORMAL")).toBe(16);
  });

  it("combineert verschillende categorieën uit verschillende diensten", () => {
    const segs = segmentShifts([
      { start: new Date(2025, 5, 9, 9, 0), end: new Date(2025, 5, 9, 17, 0) }, //  ma 8u NORMAL
      { start: new Date(2025, 5, 14, 22, 0), end: new Date(2025, 5, 15, 6, 0) }, // za-nacht
    ]);
    expect(hoursFor(segs, "NORMAL")).toBe(8);
    // za 22:00–00:00 = zaterdag (+52% > nacht +49% in DEFAULT) → 2u; 00:00–06:00 zo +72% → 6u
    expect(hoursFor(segs, "SATURDAY")).toBe(2);
    expect(hoursFor(segs, "SUNDAY")).toBe(6);
    expect(totalHours(segs)).toBe(16);
  });

  it("lege lijst → geen segmenten", () => {
    expect(segmentShifts([])).toEqual([]);
  });
});

describe("dutchHolidays", () => {
  it("bevat de vaste feestdagen", () => {
    const h = dutchHolidays(2025);
    expect(h.has("2025-01-01")).toBe(true); // Nieuwjaar
    expect(h.has("2025-12-25")).toBe(true); // 1e Kerstdag
    expect(h.has("2025-12-26")).toBe(true); // 2e Kerstdag
    expect(h.has("2025-05-05")).toBe(true); // Bevrijdingsdag
  });

  it("berekent Pasen en afgeleiden correct (2025: 20 april)", () => {
    const h = dutchHolidays(2025);
    expect(h.has("2025-04-20")).toBe(true); // 1e Paasdag
    expect(h.has("2025-04-21")).toBe(true); // 2e Paasdag
    expect(h.has("2025-04-18")).toBe(true); // Goede Vrijdag
    expect(h.has("2025-05-29")).toBe(true); // Hemelvaart (Pasen +39)
    expect(h.has("2025-06-09")).toBe(true); // 2e Pinksterdag (Pasen +50)
  });

  it("Koningsdag schuift naar 26 april als 27 april op zondag valt (2025)", () => {
    // 27 april 2025 is een zondag → Koningsdag op 26 april.
    const h = dutchHolidays(2025);
    expect(h.has("2025-04-26")).toBe(true);
    expect(h.has("2025-04-27")).toBe(false);
  });
});
