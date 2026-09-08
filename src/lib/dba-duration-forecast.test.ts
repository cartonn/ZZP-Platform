import { describe, it, expect } from "vitest";
import {
  forecastDbaDurationCrossing,
  dbaThresholdCrossingDate,
  describeDbaForecastLead,
  DBA_DURATION_FORECAST_LEAD_DAYS,
} from "@/lib/dba-duration-forecast";
import { type DbaThresholds } from "@/lib/platform-config";

const THRESHOLDS: DbaThresholds = {
  durationSignalMonths: 6,
  durationStrongSignalMonths: 12,
  revenueConcentrationPct: 80,
};

// Vaste klok op middernacht zodat daglengte-verschillen deterministisch zijn.
const NOW = new Date(2026, 5, 15); // 15 juni 2026, 00:00 lokaal

describe("dbaThresholdCrossingDate", () => {
  it("neemt dezelfde dag-van-de-maand in de doelmaand", () => {
    expect(dbaThresholdCrossingDate(new Date(2026, 0, 1), 6)).toEqual(new Date(2026, 6, 1));
    expect(dbaThresholdCrossingDate(new Date(2025, 6, 1), 12)).toEqual(new Date(2026, 6, 1));
  });

  it("schuift naar de 1e van de volgende maand als de startdag niet bestaat (31e → februari)", () => {
    // Start 31 aug 2025, +6 maanden → februari 2026 (28 dagen) → 1 maart 2026.
    expect(dbaThresholdCrossingDate(new Date(2025, 7, 31), 6)).toEqual(new Date(2026, 2, 1));
  });

  it("respecteert de dag-van-de-maand wanneer die wél bestaat", () => {
    expect(dbaThresholdCrossingDate(new Date(2026, 2, 15), 6)).toEqual(new Date(2026, 8, 15));
  });
});

describe("describeDbaForecastLead", () => {
  it("gebruikt vandaag/morgen voor de eerste dagen", () => {
    expect(describeDbaForecastLead(0)).toBe("vandaag");
    expect(describeDbaForecastLead(-3)).toBe("vandaag");
    expect(describeDbaForecastLead(1)).toBe("morgen");
  });
  it("telt in dagen onder de twee weken", () => {
    expect(describeDbaForecastLead(5)).toBe("over 5 dagen");
    expect(describeDbaForecastLead(13)).toBe("over 13 dagen");
  });
  it("telt in weken vanaf twee weken", () => {
    expect(describeDbaForecastLead(14)).toBe("over 2 weken");
    expect(describeDbaForecastLead(21)).toBe("over 3 weken");
    expect(describeDbaForecastLead(7)).toBe("over 7 dagen");
  });
});

describe("forecastDbaDurationCrossing", () => {
  it("geeft null zonder startdatum", () => {
    expect(forecastDbaDurationCrossing(null, NOW, THRESHOLDS)).toBeNull();
  });

  it("waarschuwt vóór de 6-maanden-drempel (verhoogd)", () => {
    // Start 1 jan 2026 → 6m-kruising op 1 juli 2026, 16 dagen vooruit.
    const f = forecastDbaDurationCrossing(new Date(2026, 0, 1), NOW, THRESHOLDS);
    expect(f).not.toBeNull();
    expect(f!.thresholdMonths).toBe(6);
    expect(f!.level).toBe("VERHOOGD");
    expect(f!.crossingDate).toEqual(new Date(2026, 6, 1));
    expect(f!.daysUntil).toBe(16);
    expect(f!.message).toContain("6 maanden");
    expect(f!.message).toContain("over 2 weken");
    expect(f!.message).toContain("verhoogd risicosignaal");
  });

  it("waarschuwt vóór de 12-maanden-drempel (hoog) wanneer de 6m al gepasseerd is", () => {
    // Start 1 juli 2025 → 11 maanden op 15 juni 2026; 12m-kruising op 1 juli 2026, 16 dagen vooruit.
    const f = forecastDbaDurationCrossing(new Date(2025, 6, 1), NOW, THRESHOLDS);
    expect(f).not.toBeNull();
    expect(f!.thresholdMonths).toBe(12);
    expect(f!.level).toBe("HOOG");
    expect(f!.daysUntil).toBe(16);
    expect(f!.message).toContain("12 maanden");
    expect(f!.message).toContain("hoog risicosignaal");
  });

  it("zwijgt wanneer de eerstvolgende drempel nog buiten het venster ligt", () => {
    // Precies op 6 maanden (1 dec 2025): 6m al bereikt, 12m-kruising pas over ~half jaar.
    expect(forecastDbaDurationCrossing(new Date(2025, 11, 1), NOW, THRESHOLDS)).toBeNull();
    // Verse samenwerking: 6m-kruising ver weg.
    expect(forecastDbaDurationCrossing(new Date(2026, 4, 1), NOW, THRESHOLDS)).toBeNull();
  });

  it("zwijgt wanneer alle drempels al gepasseerd zijn (reactief signaal dekt dit)", () => {
    expect(forecastDbaDurationCrossing(new Date(2025, 0, 1), NOW, THRESHOLDS)).toBeNull();
  });

  it("neemt de drempel precies op de venstergrens nog mee (<= leadDays)", () => {
    // Start 15 jan 2026 → 6m-kruising 15 juli 2026 = 30 dagen vooruit = precies de grens.
    const f = forecastDbaDurationCrossing(new Date(2026, 0, 15), NOW, THRESHOLDS);
    expect(f).not.toBeNull();
    expect(f!.daysUntil).toBe(DBA_DURATION_FORECAST_LEAD_DAYS);
  });

  it("respecteert een aangepast leadDays-venster", () => {
    // Kruising 16 dagen vooruit valt buiten een venster van 10 dagen.
    expect(forecastDbaDurationCrossing(new Date(2026, 0, 1), NOW, THRESHOLDS, 10)).toBeNull();
  });

  it("gebruikt aangepaste drempels", () => {
    const custom: DbaThresholds = {
      durationSignalMonths: 3,
      durationStrongSignalMonths: 9,
      revenueConcentrationPct: 80,
    };
    // Start 1 apr 2026 → 3m-kruising 1 juli 2026, 16 dagen vooruit.
    const f = forecastDbaDurationCrossing(new Date(2026, 3, 1), NOW, custom);
    expect(f).not.toBeNull();
    expect(f!.thresholdMonths).toBe(3);
    expect(f!.level).toBe("VERHOOGD");
  });

  it("dedupliceert gelijke drempelwaarden en houdt het hoogste niveau", () => {
    const equal: DbaThresholds = {
      durationSignalMonths: 6,
      durationStrongSignalMonths: 6,
      revenueConcentrationPct: 80,
    };
    const f = forecastDbaDurationCrossing(new Date(2026, 0, 1), NOW, equal);
    expect(f).not.toBeNull();
    expect(f!.thresholdMonths).toBe(6);
    expect(f!.level).toBe("HOOG");
  });
});
