import { describe, expect, it } from "vitest";
import { computeOrt, ortSubtotalCents, ortRatesForSector, type OrtSegment } from "@/lib/ort";
import { DEFAULT_ORT_RATES_BPS, ORT_SECTOR_PROFILES, ORT_SECTORS } from "@/lib/config";

const RATE = 30_00; // €30/uur

describe("computeOrt", () => {
  it("NORMAL: geen toeslag", () => {
    const r = computeOrt([{ category: "NORMAL", hours: 8 }], RATE);
    expect(r.baseCents).toBe(240_00);
    expect(r.surchargeCents).toBe(0);
    expect(r.subtotalCents).toBe(240_00);
  });

  it("NIGHT: +49% toeslag op de basis", () => {
    const r = computeOrt([{ category: "NIGHT", hours: 8 }], RATE);
    expect(r.baseCents).toBe(240_00);
    expect(r.surchargeCents).toBe(117_60); // 49% van 240
    expect(r.subtotalCents).toBe(357_60);
    expect(r.lines[0]?.surchargeBps).toBe(DEFAULT_ORT_RATES_BPS.NIGHT);
  });

  it("gemengde dienst: basis + per-categorie toeslag, gesommeerd", () => {
    const segs: OrtSegment[] = [
      { category: "NORMAL", hours: 6 }, //   180,00 basis
      { category: "EVENING", hours: 2 }, //   60,00 basis + 22% = 13,20
      { category: "SUNDAY", hours: 4 }, //   120,00 basis + 72% = 86,40
    ];
    const r = computeOrt(segs, RATE);
    expect(r.baseCents).toBe(360_00);
    expect(r.surchargeCents).toBe(99_60); // 13,20 + 86,40
    expect(r.subtotalCents).toBe(459_60);
    expect(r.lines).toHaveLength(3);
  });

  it("ondersteunt kwartieren en rondt op hele centen", () => {
    const r = computeOrt([{ category: "NORMAL", hours: 7.25 }], 32_00);
    expect(r.subtotalCents).toBe(232_00);
  });

  it("rates zijn per CAO overschrijfbaar", () => {
    const r = computeOrt([{ category: "NIGHT", hours: 10 }], 20_00, { ...DEFAULT_ORT_RATES_BPS, NIGHT: 3000 });
    expect(r.surchargeCents).toBe(60_00); // 30% van 200
  });

  it("leeg: alles nul", () => {
    expect(computeOrt([], RATE)).toMatchObject({ baseCents: 0, surchargeCents: 0, subtotalCents: 0 });
  });

  it("weigert negatieve invoer", () => {
    expect(() => computeOrt([{ category: "NORMAL", hours: -1 }], RATE)).toThrow();
    expect(() => computeOrt([], -1)).toThrow();
  });
});

describe("ortSubtotalCents", () => {
  it("geeft het subtotaal voor de cascade (basis + toeslagen)", () => {
    expect(ortSubtotalCents([{ category: "NIGHT", hours: 8 }], RATE)).toBe(357_60);
  });
});

describe("ortRatesForSector — sector-/klantprofielen", () => {
  it("bekende sector geeft het bijbehorende profiel", () => {
    expect(ortRatesForSector("VVT")).toBe(ORT_SECTOR_PROFILES.VVT);
    expect(ortRatesForSector("GGZ")).toBe(ORT_SECTOR_PROFILES.GGZ);
    expect(ortRatesForSector("JEUGD")).toBe(ORT_SECTOR_PROFILES.JEUGD);
  });

  it("DEFAULT/onbekend/leeg valt terug op DEFAULT_ORT_RATES_BPS", () => {
    expect(ortRatesForSector("DEFAULT")).toBe(DEFAULT_ORT_RATES_BPS);
    expect(ortRatesForSector(null)).toBe(DEFAULT_ORT_RATES_BPS);
    expect(ortRatesForSector(undefined)).toBe(DEFAULT_ORT_RATES_BPS);
    expect(ortRatesForSector("ONZIN")).toBe(DEFAULT_ORT_RATES_BPS);
  });

  it("elk sectorprofiel dekt alle vijf categorieën met geldige bps", () => {
    for (const sector of ORT_SECTORS) {
      const rates = ortRatesForSector(sector);
      for (const cat of ["EVENING", "NIGHT", "SATURDAY", "SUNDAY", "HOLIDAY"] as const) {
        expect(rates[cat]).toBeGreaterThan(0);
        expect(Number.isInteger(rates[cat])).toBe(true);
      }
    }
  });

  it("sectorprofiel beïnvloedt het subtotaal van de cascade", () => {
    const segs: OrtSegment[] = [{ category: "SUNDAY", hours: 8 }];
    const vvt = ortSubtotalCents(segs, RATE, ortRatesForSector("VVT"));
    const def = ortSubtotalCents(segs, RATE, ortRatesForSector("DEFAULT"));
    // VVT zondag (+60%) is lager dan DEFAULT zondag (+72%).
    expect(vvt).toBeLessThan(def);
    expect(vvt).toBe(240_00 + Math.round((240_00 * ORT_SECTOR_PROFILES.VVT.SUNDAY) / 10000));
  });
});

describe("ORT-categorie validatie — alle categorieën", () => {
  it("SATURDAY: +52% toeslag op de basis", () => {
    const r = computeOrt([{ category: "SATURDAY", hours: 8 }], RATE);
    expect(r.baseCents).toBe(240_00);
    // 52% van 240,00 = 124,80
    expect(r.surchargeCents).toBe(124_80);
    expect(r.subtotalCents).toBe(364_80);
    expect(r.lines[0]?.surchargeBps).toBe(DEFAULT_ORT_RATES_BPS.SATURDAY);
  });

  it("HOLIDAY: +100% toeslag (verdubbeling van de basis)", () => {
    const r = computeOrt([{ category: "HOLIDAY", hours: 4 }], RATE);
    expect(r.baseCents).toBe(120_00);
    // 100% van 120,00 = 120,00
    expect(r.surchargeCents).toBe(120_00);
    expect(r.subtotalCents).toBe(240_00);
    expect(r.lines[0]?.surchargeBps).toBe(DEFAULT_ORT_RATES_BPS.HOLIDAY);
  });

  it("volledig gemengde dienst: alle vijf ORT-categorieën tegelijk", () => {
    // EVENING 1u + NIGHT 2u + SATURDAY 1u + SUNDAY 1u + HOLIDAY 0,5u × €30/uur
    const segs: OrtSegment[] = [
      { category: "EVENING", hours: 1 },
      { category: "NIGHT", hours: 2 },
      { category: "SATURDAY", hours: 1 },
      { category: "SUNDAY", hours: 1 },
      { category: "HOLIDAY", hours: 0.5 },
    ];
    const r = computeOrt(segs, RATE);
    // basis: (1+2+1+1+0,5)×30 = 5,5×30 = 165,00
    expect(r.baseCents).toBe(165_00);
    // toeslagen: 30×22% + 60×49% + 30×52% + 30×72% + 15×100%
    //           = 6,60  + 29,40  + 15,60  + 21,60  + 15,00  = 88,20
    expect(r.surchargeCents).toBe(88_20);
    expect(r.subtotalCents).toBe(253_20);
    expect(r.lines).toHaveLength(5);
  });
});
