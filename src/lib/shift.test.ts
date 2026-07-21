// Unit tests voor de ORT dienst-segmentatiemotor (shift.ts).
//
// Configuratie-feiten (uit config.ts — hardcoded hier zodat de tests deterministisch zijn):
//   eveningStartHour : 18   → avondtoeslag vanaf 18:00
//   nightStartHour   : 22   → nachttoeslag vanaf 22:00
//   nightEndHour     : 6    → nacht loopt door t/m 05:59 (h < 6)
//   Nacht-conditie   : h >= 22 || h < 6
//   Avond-conditie   : h >= 18 (en niet in nacht)
//   NORMAL           : 06:00–17:59 op doordeweekse niet-feestdagen
//
// Prioriteitvolgorde (hoogste bps wint bij meerdere toepasselijke categorieën):
//   HOLIDAY (10000) > SUNDAY (7200) > SATURDAY (5200) > NIGHT (4900) > EVENING (2200) > NORMAL (0)
//
// Pasen 2026 (Meeus/Jones/Butcher, zelfde algoritme als shift.ts): 5 april 2026.
// Pasen 2025 (idem): 20 april 2025.

import { describe, expect, it } from "vitest";
import { segmentShift, segmentShifts, dutchHolidays, MAX_SHIFT_HOURS } from "@/lib/shift";
import { DEFAULT_ORT_RATES_BPS, ORT_SECTOR_PROFILES } from "@/lib/config";

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

/** Som van alle uren in de segmenten (afgerond op 2 decimalen). */
function totalHours(segs: { hours: number }[]): number {
  return Math.round(segs.reduce((s, x) => s + x.hours, 0) * 100) / 100;
}

/** Uren voor een categorie, 0 als de categorie ontbreekt. */
function hoursFor(segs: { category: string; hours: number }[], cat: string): number {
  return segs.find((s) => s.category === cat)?.hours ?? 0;
}

// ---------------------------------------------------------------------------
// dutchHolidays — vaste feestdagen
// ---------------------------------------------------------------------------

describe("dutchHolidays — vaste feestdagen 2025", () => {
  const h = dutchHolidays(2025);

  it("bevat de vaste feestdagen", () => {
    expect(h.has("2025-01-01")).toBe(true); // Nieuwjaar
    expect(h.has("2025-12-25")).toBe(true); // 1e Kerstdag
    expect(h.has("2025-12-26")).toBe(true); // 2e Kerstdag
    expect(h.has("2025-05-05")).toBe(true); // Bevrijdingsdag
  });

  it("bevat Nieuwjaarsdag (1 januari)", () => {
    expect(h.has("2025-01-01")).toBe(true);
  });

  it("bevat Eerste Kerstdag (25 december)", () => {
    expect(h.has("2025-12-25")).toBe(true);
  });

  it("bevat Tweede Kerstdag (26 december)", () => {
    expect(h.has("2025-12-26")).toBe(true);
  });

  it("bevat Bevrijdingsdag (5 mei)", () => {
    expect(h.has("2025-05-05")).toBe(true);
  });
});

describe("dutchHolidays — Pasen 2025 en afgeleide feestdagen (Pasen = 20 april 2025)", () => {
  const h = dutchHolidays(2025);

  it("berekent Pasen en afgeleiden correct (2025: 20 april)", () => {
    expect(h.has("2025-04-20")).toBe(true); // 1e Paasdag
    expect(h.has("2025-04-21")).toBe(true); // 2e Paasdag
    expect(h.has("2025-04-18")).toBe(true); // Goede Vrijdag
    expect(h.has("2025-05-29")).toBe(true); // Hemelvaart (Pasen +39)
    expect(h.has("2025-06-09")).toBe(true); // 2e Pinksterdag (Pasen +50)
  });

  it("bevat Eerste Paasdag (20 april 2025)", () => {
    expect(h.has("2025-04-20")).toBe(true);
  });

  it("bevat Tweede Paasdag / Pinkstermaandag (offset +1 = 21 april 2025)", () => {
    expect(h.has("2025-04-21")).toBe(true);
  });

  it("bevat Goede Vrijdag (offset -2 = 18 april 2025)", () => {
    expect(h.has("2025-04-18")).toBe(true);
  });

  it("bevat Hemelvaartsdag (offset +39 = 29 mei 2025)", () => {
    expect(h.has("2025-05-29")).toBe(true);
  });

  it("bevat Eerste Pinksterdag (offset +49 = 8 juni 2025)", () => {
    expect(h.has("2025-06-08")).toBe(true);
  });

  it("bevat Tweede Pinksterdag (offset +50 = 9 juni 2025)", () => {
    expect(h.has("2025-06-09")).toBe(true);
  });
});

describe("dutchHolidays — Pasen 2026 en afgeleide feestdagen (Pasen = 5 april 2026)", () => {
  // Easter 2026 berekend met Meeus/Jones/Butcher: maand=4, dag=5 → 5 april 2026.
  const h = dutchHolidays(2026);

  it("bevat Eerste Paasdag (5 april 2026)", () => {
    expect(h.has("2026-04-05")).toBe(true);
  });

  it("bevat Tweede Paasdag (offset +1 = 6 april 2026)", () => {
    expect(h.has("2026-04-06")).toBe(true);
  });

  it("bevat Goede Vrijdag (offset -2 = 3 april 2026)", () => {
    expect(h.has("2026-04-03")).toBe(true);
  });

  it("bevat Hemelvaartsdag (offset +39 = 14 mei 2026)", () => {
    expect(h.has("2026-05-14")).toBe(true);
  });

  it("bevat Eerste Pinksterdag (offset +49 = 24 mei 2026)", () => {
    expect(h.has("2026-05-24")).toBe(true);
  });

  it("bevat Tweede Pinksterdag / Pinkstermaandag (offset +50 = 25 mei 2026)", () => {
    expect(h.has("2026-05-25")).toBe(true);
  });
});

describe("dutchHolidays — Koningsdag verschuiving", () => {
  it("Koningsdag schuift naar 26 april als 27 april op zondag valt (2025)", () => {
    // 27 april 2025 is een zondag → Koningsdag op 26 april.
    const h = dutchHolidays(2025);
    expect(h.has("2025-04-26")).toBe(true);
    expect(h.has("2025-04-27")).toBe(false);
  });

  it("Koningsdag blijft op 27 april als het geen zondag is (2026 = maandag)", () => {
    // 27 april 2026 is een maandag → geen verschuiving.
    const h = dutchHolidays(2026);
    expect(h.has("2026-04-27")).toBe(true);
    expect(h.has("2026-04-26")).toBe(false);
  });
});

describe("dutchHolidays — formaat en type", () => {
  it("retourneert een Set-instantie", () => {
    expect(dutchHolidays(2026) instanceof Set).toBe(true);
  });

  it("sleutels zijn in het formaat YYYY-MM-DD", () => {
    for (const key of dutchHolidays(2026)) {
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// segmentShift — invoervalidatie
// ---------------------------------------------------------------------------

describe("segmentShift — ongeldige invoer", () => {
  it("weigert eind ≤ begin en ongeldige datums", () => {
    expect(() => segmentShift(new Date(2025, 5, 9, 17, 0), new Date(2025, 5, 9, 9, 0))).toThrow();
    expect(() => segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 9, 0))).toThrow();
    expect(() => segmentShift(new Date("x"), new Date(2025, 5, 9, 9, 0))).toThrow();
  });

  it("gooit een fout als einde gelijk is aan begin (duur = 0)", () => {
    const t = new Date(2026, 0, 12, 9, 0);
    expect(() => segmentShift(t, t)).toThrow();
  });

  it("gooit een fout als einde vóór begin ligt", () => {
    expect(() => segmentShift(new Date(2026, 0, 12, 10, 0), new Date(2026, 0, 12, 8, 0))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// segmentShift — één categorie (gouden pad)
// ---------------------------------------------------------------------------

describe("segmentShift — volledig binnen één categorie", () => {
  it("reguliere dagdienst → alles NORMAL", () => {
    // maandag 9 jun 2025, 09:00–17:00
    const segs = segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 17, 0));
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ category: "NORMAL", hours: 8 });
  });

  it("maandag 22:30–23:30 → alleen NIGHT (1 uur, h >= 22)", () => {
    // h=22 en h=23 vallen beide in nacht (>= 22)
    const segs = segmentShift(new Date(2026, 0, 12, 22, 30), new Date(2026, 0, 12, 23, 30));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "NIGHT")).toBeCloseTo(1, 2);
    expect(segs.every((s) => s.category === "NIGHT")).toBe(true);
  });

  it("maandag 00:30–05:30 → alleen NIGHT (5 uur, h < 6)", () => {
    // h=0..5 vallen in nacht (h < 6)
    const segs = segmentShift(new Date(2026, 0, 12, 0, 30), new Date(2026, 0, 12, 5, 30));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "NIGHT")).toBeCloseTo(5, 2);
    expect(segs.every((s) => s.category === "NIGHT")).toBe(true);
  });

  it("maandag 19:00–21:30 → alleen EVENING (2,5 uur, 18 <= h < 22)", () => {
    // h=19, 20, 21 → avond (>= 18 en < 22)
    const segs = segmentShift(new Date(2026, 0, 12, 19), new Date(2026, 0, 12, 21, 30));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "EVENING")).toBeCloseTo(2.5, 2);
    expect(segs.every((s) => s.category === "EVENING")).toBe(true);
  });

  it("nachtdienst over middernacht → NIGHT", () => {
    // maandag 22:00 → dinsdag 06:00 = 8 uur nacht
    const segs = segmentShift(new Date(2025, 5, 9, 22, 0), new Date(2025, 5, 10, 6, 0));
    expect(hoursFor(segs, "NIGHT")).toBe(8);
    expect(totalHours(segs)).toBe(8);
  });

  it("zaterdagdienst overdag → SATURDAY", () => {
    // zaterdag 14 jun 2025, 09:00–17:00
    const segs = segmentShift(new Date(2025, 5, 14, 9, 0), new Date(2025, 5, 14, 17, 0));
    expect(hoursFor(segs, "SATURDAY")).toBe(8);
  });

  it("zaterdag 10:00–12:00 → alleen SATURDAY (2 uur, doordeweeks overdag)", () => {
    // Zaterdag 10 jan 2026 overdag — SATURDAY wint
    const segs = segmentShift(new Date(2026, 0, 10, 10), new Date(2026, 0, 10, 12));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "SATURDAY")).toBeCloseTo(2, 2);
    expect(segs.every((s) => s.category === "SATURDAY")).toBe(true);
  });

  it("zondag 11:00–13:00 → alleen SUNDAY (2 uur)", () => {
    // Zondag 11 jan 2026 overdag — SUNDAY wint
    const segs = segmentShift(new Date(2026, 0, 11, 11), new Date(2026, 0, 11, 13));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "SUNDAY")).toBeCloseTo(2, 2);
    expect(segs.every((s) => s.category === "SUNDAY")).toBe(true);
  });

  it("feestdag overdag → HOLIDAY wanneer feestdagenset wordt meegegeven", () => {
    // 25 dec 2026 is Eerste Kerstdag; mét feestdagenset → HOLIDAY
    const holidays = dutchHolidays(2026);
    const segs = segmentShift(new Date(2026, 11, 25, 10), new Date(2026, 11, 25, 12), {
      holidays,
    });
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "HOLIDAY")).toBeCloseTo(2, 2);
    expect(segs.every((s) => s.category === "HOLIDAY")).toBe(true);
  });

  it("kwartierresolutie: half uur telt mee", () => {
    const segs = segmentShift(new Date(2025, 5, 9, 9, 0), new Date(2025, 5, 9, 9, 30));
    expect(totalHours(segs)).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// segmentShift — categorieprioriteit (hoogste toeslag wint)
// ---------------------------------------------------------------------------

describe("segmentShift — prioriteit: hoogste toeslag wint", () => {
  it("avonddienst → EVENING tot 22:00, daarna NIGHT", () => {
    // maandag 18:00–23:00 = 4u avond + 1u nacht
    const segs = segmentShift(new Date(2025, 5, 9, 18, 0), new Date(2025, 5, 9, 23, 0));
    expect(hoursFor(segs, "EVENING")).toBe(4);
    expect(hoursFor(segs, "NIGHT")).toBe(1);
  });

  it("zondag wint van avond (SUNDAY 7200 bps > EVENING 2200 bps)", () => {
    // zondag 15 jun 2025, 18:00–22:00 — zondag (+72%) > avond (+22%)
    const segs = segmentShift(new Date(2025, 5, 15, 18, 0), new Date(2025, 5, 15, 22, 0));
    expect(hoursFor(segs, "SUNDAY")).toBe(4);
    expect(hoursFor(segs, "EVENING")).toBe(0);
  });

  it("feestdag wint van nacht (HOLIDAY 10000 bps > NIGHT 4900 bps)", () => {
    // 1e Kerstdag 2025 (do) 00:00–06:00 — feestdag (+100%) > nacht (+49%)
    const holidays = dutchHolidays(2025);
    const segs = segmentShift(new Date(2025, 11, 25, 0, 0), new Date(2025, 11, 25, 6, 0), {
      holidays,
    });
    expect(hoursFor(segs, "HOLIDAY")).toBe(6);
    expect(hoursFor(segs, "NIGHT")).toBe(0);
  });

  it("zaterdagnacht (23:00) → SATURDAY (5200 bps) wint van NIGHT (4900 bps)", () => {
    // Zaterdag 10 jan 2026, 23:00–00:00
    const segs = segmentShift(new Date(2026, 0, 10, 23), new Date(2026, 0, 11, 0));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "SATURDAY")).toBeCloseTo(1, 2);
    expect(segs.every((s) => s.category === "SATURDAY")).toBe(true);
  });

  it("zondagnacht (01:00) → SUNDAY (7200 bps) wint van NIGHT (4900 bps)", () => {
    // Zondag 11 jan 2026, 01:00–02:00
    const segs = segmentShift(new Date(2026, 0, 11, 1), new Date(2026, 0, 11, 2));
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "SUNDAY")).toBeCloseTo(1, 2);
    expect(segs.every((s) => s.category === "SUNDAY")).toBe(true);
  });

  it("feestdag op doordeweekse avond → HOLIDAY wint van EVENING", () => {
    // 1 jan 2026 is donderdag (Nieuwjaarsdag), 19:00–20:00 → avond én feestdag → HOLIDAY
    const holidays = dutchHolidays(2026);
    const segs = segmentShift(new Date(2026, 0, 1, 19), new Date(2026, 0, 1, 20), { holidays });
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "HOLIDAY")).toBeCloseTo(1, 2);
    expect(segs.every((s) => s.category === "HOLIDAY")).toBe(true);
  });

  it("feestdag op doordeweekse nacht → HOLIDAY wint van NIGHT", () => {
    // 1 jan 2026 is donderdag, 23:00–00:00 → nacht én feestdag → HOLIDAY
    const holidays = dutchHolidays(2026);
    const segs = segmentShift(new Date(2026, 0, 1, 23), new Date(2026, 0, 2, 0), { holidays });
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "HOLIDAY")).toBeCloseTo(1, 2);
    expect(segs.every((s) => s.category === "HOLIDAY")).toBe(true);
  });

  it("precedentie volgt het sectorprofiel: andere rates kunnen anders kiezen", () => {
    // zaterdagnacht: vergelijk SATURDAY vs NIGHT per profiel.
    const segs = segmentShift(new Date(2025, 5, 14, 22, 0), new Date(2025, 5, 15, 0, 0), {
      rates: ORT_SECTOR_PROFILES.VVT,
    });
    // VVT: zaterdag +49% > nacht +44% → SATURDAY wint
    expect(hoursFor(segs, "SATURDAY")).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// segmentShift — grenzen tussen categorieën
// ---------------------------------------------------------------------------

describe("segmentShift — grensovergangen", () => {
  it("gemengde dienst dag→avond (NORMAL 2u + EVENING 2u)", () => {
    // maandag 16:00–20:00 = 2u NORMAL + 2u EVENING
    const segs = segmentShift(new Date(2025, 5, 9, 16, 0), new Date(2025, 5, 9, 20, 0));
    expect(hoursFor(segs, "NORMAL")).toBe(2);
    expect(hoursFor(segs, "EVENING")).toBe(2);
  });

  it("avond→nacht overgang (21:00–23:00): EVENING 1 uur + NIGHT 1 uur", () => {
    // 21:00–21:59 (h=21): avond (18 <= h < 22)
    // 22:00–22:59 (h=22): nacht (h >= 22)
    const segs = segmentShift(new Date(2026, 0, 12, 21), new Date(2026, 0, 12, 23));
    const total = totalHours(segs);
    expect(total).toBeCloseTo(2, 2);
    expect(hoursFor(segs, "EVENING")).toBeCloseTo(1, 2);
    expect(hoursFor(segs, "NIGHT")).toBeCloseTo(1, 2);
  });

  it("nacht→NORMAL overgang (05:30–06:30): NIGHT 0,5 uur + NORMAL 0,5 uur", () => {
    // 05:30–05:59 (h=5): nacht (h < 6)
    // 06:00–06:29 (h=6): NORMAL (niet >= 22, niet < 6, niet >= 18)
    const segs = segmentShift(new Date(2026, 0, 12, 5, 30), new Date(2026, 0, 12, 6, 30));
    expect(totalHours(segs)).toBeCloseTo(1, 2);
    expect(hoursFor(segs, "NIGHT")).toBeCloseTo(0.5, 2);
    expect(hoursFor(segs, "NORMAL")).toBeCloseTo(0.5, 2);
  });

  it("NORMAL→avond overgang (17:00–19:00): NORMAL 1 uur + EVENING 1 uur", () => {
    // 17:00–17:59 (h=17): NORMAL (< 18)
    // 18:00–18:59 (h=18): avond (>= 18)
    const segs = segmentShift(new Date(2026, 0, 12, 17), new Date(2026, 0, 12, 19));
    expect(totalHours(segs)).toBeCloseTo(2, 2);
    expect(hoursFor(segs, "NORMAL")).toBeCloseTo(1, 2);
    expect(hoursFor(segs, "EVENING")).toBeCloseTo(1, 2);
  });

  it("middernacht zaterdag→zondag: SATURDAY segment gevolgd door SUNDAY segment", () => {
    // Zat 10 jan 2026, 23:00 → Zon 11 jan 2026, 01:00
    // 23:00–23:59: SATURDAY (5200) wint van NIGHT (4900)
    // 00:00–00:59: SUNDAY (7200) wint van NIGHT (4900)
    const segs = segmentShift(new Date(2026, 0, 10, 23), new Date(2026, 0, 11, 1));
    expect(totalHours(segs)).toBeCloseTo(2, 2);
    expect(hoursFor(segs, "SATURDAY")).toBeCloseTo(1, 2);
    expect(hoursFor(segs, "SUNDAY")).toBeCloseTo(1, 2);
  });

  it("dienst over middernacht zaterdag→zondag pakt SUNDAY op (nacht-overgang)", () => {
    // za 22:00–00:00 = SATURDAY (+52% > nacht +49% in DEFAULT) → 2u
    // zo 00:00–06:00 = SUNDAY (+72%) → 6u
    const segs = segmentShift(new Date(2025, 5, 14, 22, 0), new Date(2025, 5, 15, 6, 0));
    expect(hoursFor(segs, "SATURDAY")).toBe(2);
    expect(hoursFor(segs, "SUNDAY")).toBe(6);
    expect(totalHours(segs)).toBe(8);
  });

  it("doordeweekse dienst over middernacht: EVENING + NIGHT + NORMAL", () => {
    // Ma 12 jan 2026, 21:00 → Di 13 jan 2026, 07:00
    // 21:00–21:59: EVENING (1 uur)
    // 22:00–05:59: NIGHT (8 uur)
    // 06:00–06:59: NORMAL (1 uur)
    // Totaal = 10 uur
    const segs = segmentShift(new Date(2026, 0, 12, 21), new Date(2026, 0, 13, 7));
    expect(totalHours(segs)).toBeCloseTo(10, 2);
    expect(hoursFor(segs, "EVENING")).toBeCloseTo(1, 2);
    expect(hoursFor(segs, "NIGHT")).toBeCloseTo(8, 2);
    expect(hoursFor(segs, "NORMAL")).toBeCloseTo(1, 2);
  });

  it("som van segment-uren = duur van de dienst (vrijdag naar zaterdag)", () => {
    // vrijdag 18:00 → zaterdag 02:00 = 8 uur, gespreid over avond/nacht/zaterdag
    const segs = segmentShift(new Date(2025, 5, 13, 18, 0), new Date(2025, 5, 14, 2, 0), {
      rates: DEFAULT_ORT_RATES_BPS,
    });
    expect(totalHours(segs)).toBe(8);
  });

  it("uren tellen op tot de totale dienstduur (90 minuten dienst)", () => {
    // Ma 12 jan 2026, 18:30–20:00 = 90 min = 1,5 uur (alles avond)
    const segs = segmentShift(new Date(2026, 0, 12, 18, 30), new Date(2026, 0, 12, 20));
    expect(totalHours(segs)).toBeCloseTo(1.5, 2);
  });
});

// ---------------------------------------------------------------------------
// segmentShift — stapgrootte (stepMinutes)
// ---------------------------------------------------------------------------

describe("segmentShift — aangepaste stapgrootte", () => {
  it("stapgrootte 1 minuut geeft hetzelfde totaal als de default (15 min)", () => {
    const start = new Date(2026, 0, 12, 21);
    const end = new Date(2026, 0, 12, 23);
    const segs15 = segmentShift(start, end);
    const segs1 = segmentShift(start, end, { stepMinutes: 1 });
    expect(totalHours(segs15)).toBeCloseTo(totalHours(segs1), 1);
  });
});

// ---------------------------------------------------------------------------
// segmentShifts — meerdere diensten optellen
// ---------------------------------------------------------------------------

describe("segmentShifts — meerdere diensten aggregeren", () => {
  it("lege lijst → geen segmenten", () => {
    expect(segmentShifts([])).toEqual([]);
  });

  it("telt gelijke categorieën over diensten op", () => {
    const segs = segmentShifts([
      { start: new Date(2025, 5, 9, 9, 0), end: new Date(2025, 5, 9, 17, 0) }, // ma 8u NORMAL
      { start: new Date(2025, 5, 10, 9, 0), end: new Date(2025, 5, 10, 17, 0) }, // di 8u NORMAL
    ]);
    expect(segs).toHaveLength(1);
    expect(hoursFor(segs, "NORMAL")).toBe(16);
  });

  it("twee identieke dagdiensten geven het dubbele aantal uren", () => {
    const shift = { start: new Date(2026, 0, 12, 9), end: new Date(2026, 0, 12, 11) };
    const segs = segmentShifts([shift, shift]);
    expect(hoursFor(segs, "NORMAL")).toBeCloseTo(4, 2);
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

  it("sommeert NORMAL en HOLIDAY correct over twee diensten", () => {
    const holidays = dutchHolidays(2026);
    // Dienst 1: ma 10–12 (2 uur NORMAL)
    // Dienst 2: Eerste Kerstdag 10–12 (2 uur HOLIDAY)
    const shifts = [
      { start: new Date(2026, 0, 12, 10), end: new Date(2026, 0, 12, 12) },
      { start: new Date(2026, 11, 25, 10), end: new Date(2026, 11, 25, 12) },
    ];
    const segs = segmentShifts(shifts, { holidays });
    expect(hoursFor(segs, "NORMAL")).toBeCloseTo(2, 2);
    expect(hoursFor(segs, "HOLIDAY")).toBeCloseTo(2, 2);
  });

  it("totale uren over alle segmenten is gelijk aan de som van alle dienstduren", () => {
    const shifts = [
      { start: new Date(2026, 0, 12, 9), end: new Date(2026, 0, 12, 17) }, // 8 uur
      { start: new Date(2026, 0, 12, 21), end: new Date(2026, 0, 12, 23) }, // 2 uur (avond + nacht)
    ];
    const segs = segmentShifts(shifts);
    expect(totalHours(segs)).toBeCloseTo(10, 2);
  });
});

// ---------------------------------------------------------------------------
// Duurgrens — bescherming tegen onbegrensde doorloop-lus (DoS-hardening)
// ---------------------------------------------------------------------------

describe("segmentShift — harde duurgrens (MAX_SHIFT_HOURS)", () => {
  it("weigert een dienst met een absurde eindtijd i.p.v. de event-loop te blokkeren", () => {
    // Zonder de grens zou dit ~10⁸+ iteraties draaien. Met de grens keert het meteen terug via throw.
    const start = new Date("2000-01-01T00:00:00");
    const end = new Date("9999-12-31T23:59:00");
    const before = Date.now();
    expect(() => segmentShift(start, end)).toThrow(/langer dan/i);
    // Moet vrijwel onmiddellijk falen (geen O(duur)-lus): ruime marge tegen flakiness.
    expect(Date.now() - before).toBeLessThan(1000);
  });

  it("weigert een dienst net boven MAX_SHIFT_HOURS", () => {
    const start = new Date("2026-01-01T00:00:00");
    const end = new Date(start.getTime() + (MAX_SHIFT_HOURS + 1) * 3_600_000);
    expect(() => segmentShift(start, end)).toThrow(/langer dan/i);
  });

  it("staat een dienst precies op MAX_SHIFT_HOURS toe", () => {
    const start = new Date("2026-01-01T00:00:00");
    const end = new Date(start.getTime() + MAX_SHIFT_HOURS * 3_600_000);
    const segs = segmentShift(start, end);
    expect(totalHours(segs)).toBeCloseTo(MAX_SHIFT_HOURS, 0);
  });

  it("segmentShifts propageert de duurgrens per dienst", () => {
    const shifts = [
      { start: new Date("2026-01-01T09:00:00"), end: new Date("9999-01-01T00:00:00") },
    ];
    expect(() => segmentShifts(shifts)).toThrow(/langer dan/i);
  });
});
