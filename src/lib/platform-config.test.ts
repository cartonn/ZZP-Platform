import { describe, expect, it } from "vitest";
import { DBA_THRESHOLDS } from "@/lib/config";
import { z } from "zod";

// ---------------------------------------------------------------------------
// getDbaThresholds — test the fallback logic without a real database connection.
// We test the pure mapping logic by verifying that:
//   - when cfg is null (no row), static defaults are returned
//   - when cfg contains values, those values are returned
// ---------------------------------------------------------------------------

// Reproduce the mapping function in isolation (pure logic extraction).
function mapCfgToThresholds(
  cfg: {
    dbaMinDurationMonths: number;
    dbaStrongDurationMonths: number;
    dbaRevenueConcentrationPct: number;
  } | null,
) {
  return {
    durationSignalMonths: cfg?.dbaMinDurationMonths ?? DBA_THRESHOLDS.durationSignalMonths,
    durationStrongSignalMonths:
      cfg?.dbaStrongDurationMonths ?? DBA_THRESHOLDS.durationStrongSignalMonths,
    revenueConcentrationPct:
      cfg?.dbaRevenueConcentrationPct ?? DBA_THRESHOLDS.revenueConcentrationPct,
  };
}

describe("mapCfgToThresholds (getDbaThresholds mapping logic)", () => {
  it("valt terug op statische standaarden als er geen configuratierij is", () => {
    const result = mapCfgToThresholds(null);
    expect(result.durationSignalMonths).toBe(DBA_THRESHOLDS.durationSignalMonths);
    expect(result.durationStrongSignalMonths).toBe(DBA_THRESHOLDS.durationStrongSignalMonths);
    expect(result.revenueConcentrationPct).toBe(DBA_THRESHOLDS.revenueConcentrationPct);
  });

  it("gebruikt de databasewaarden als de configuratierij bestaat", () => {
    const cfg = {
      dbaMinDurationMonths: 3,
      dbaStrongDurationMonths: 9,
      dbaRevenueConcentrationPct: 70,
    };
    const result = mapCfgToThresholds(cfg);
    expect(result.durationSignalMonths).toBe(3);
    expect(result.durationStrongSignalMonths).toBe(9);
    expect(result.revenueConcentrationPct).toBe(70);
  });

  it("de statische standaarden zijn de verwachte basiswaarden", () => {
    expect(DBA_THRESHOLDS.durationSignalMonths).toBe(6);
    expect(DBA_THRESHOLDS.durationStrongSignalMonths).toBe(12);
    expect(DBA_THRESHOLDS.revenueConcentrationPct).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// Zod-validatie voor de server action (dbaThresholdsSchema)
// Reproduce the schema inline to test boundary conditions.
// ---------------------------------------------------------------------------

const dbaThresholdsSchema = z.object({
  durationSignalMonths: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1 maand.")
    .max(60, "Maximaal 60 maanden."),
  durationStrongSignalMonths: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1 maand.")
    .max(60, "Maximaal 60 maanden."),
  revenueConcentrationPct: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1%.")
    .max(100, "Maximaal 100%."),
});

describe("dbaThresholdsSchema validatie", () => {
  it("accepteert geldige waarden binnen de grenzen", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 6,
      durationStrongSignalMonths: 12,
      revenueConcentrationPct: 80,
    });
    expect(result.success).toBe(true);
  });

  it("accepteert grenswaarden (1, 60, 100)", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 1,
      durationStrongSignalMonths: 60,
      revenueConcentrationPct: 100,
    });
    expect(result.success).toBe(true);
  });

  it("weigert durationSignalMonths = 0 (te laag)", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 0,
      durationStrongSignalMonths: 12,
      revenueConcentrationPct: 80,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.durationSignalMonths).toBeDefined();
    }
  });

  it("weigert durationStrongSignalMonths = 61 (te hoog)", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 6,
      durationStrongSignalMonths: 61,
      revenueConcentrationPct: 80,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.durationStrongSignalMonths).toBeDefined();
    }
  });

  it("weigert revenueConcentrationPct = 0 (te laag)", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 6,
      durationStrongSignalMonths: 12,
      revenueConcentrationPct: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.revenueConcentrationPct).toBeDefined();
    }
  });

  it("weigert revenueConcentrationPct = 101 (te hoog)", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 6,
      durationStrongSignalMonths: 12,
      revenueConcentrationPct: 101,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.revenueConcentrationPct).toBeDefined();
    }
  });

  it("weigert niet-gehele getallen", () => {
    const result = dbaThresholdsSchema.safeParse({
      durationSignalMonths: 6.5,
      durationStrongSignalMonths: 12,
      revenueConcentrationPct: 80,
    });
    expect(result.success).toBe(false);
  });
});
