import { describe, expect, it } from "vitest";
import { korThresholdProjection, KOR_PROJECTION_MIN_DAY } from "@/lib/tax/kor-projection";
import { KOR_THRESHOLD_CENTS } from "@/lib/tax/config";

describe("korThresholdProjection", () => {
  it("status 'over' zodra de jaaromzet de grens al passeerde", () => {
    const p = korThresholdProjection({
      revenueCents: KOR_THRESHOLD_CENTS + 500_00,
      now: new Date("2026-09-01T12:00:00Z"),
    });
    expect(p.status).toBe("over");
    expect(p.remainingHeadroomCents).toBe(0);
    expect(p.projectedCrossMonth).toBeNull();
    expect(p.usedFraction).toBeGreaterThan(1);
  });

  it("projecteert een kruising dit jaar bij een hoog tempo ('projected_over' + maand)", () => {
    // €12.000 op dag ~135 (15 mei) → jaarbasis ≈ €32.000 → kruist de €20.000-grens ná mei.
    const p = korThresholdProjection({
      revenueCents: 1_200_000,
      now: new Date("2026-05-15T12:00:00Z"),
    });
    expect(p.status).toBe("projected_over");
    expect(p.projectedCrossMonth).not.toBeNull();
    expect(p.projectedCrossMonth).toBeGreaterThan(5); // ná de huidige maand (mei)
    expect(p.projectedCrossMonthLabel).toBeTruthy();
    expect(p.projectedAnnualCents).toBeGreaterThan(KOR_THRESHOLD_CENTS);
    expect(p.remainingHeadroomCents).toBe(KOR_THRESHOLD_CENTS - 1_200_000);
  });

  it("status 'under' bij een laag tempo dat de grens dit jaar niet kruist", () => {
    // €3.000 op dag ~135 → jaarbasis ≈ €8.100 → ruim onder de grens.
    const p = korThresholdProjection({
      revenueCents: 300_000,
      now: new Date("2026-05-15T12:00:00Z"),
    });
    expect(p.status).toBe("under");
    expect(p.projectedCrossMonth).toBeNull();
    expect(p.projectedAnnualCents).toBeLessThan(KOR_THRESHOLD_CENTS);
  });

  it("projecteert niet te vroeg in het jaar (ruis-drempel) — valt terug op de statische band", () => {
    // Dag 10 (vóór de drempel): zelfs met €5.000 geen tempo-projectie.
    const p = korThresholdProjection({
      revenueCents: 500_000,
      now: new Date("2026-01-10T12:00:00Z"),
    });
    expect(p.projectedCrossMonth).toBeNull();
    expect(p.projectedAnnualCents).toBeNull();
    expect(p.status).toBe("under");
  });

  it("≥80% van de grens maar laat in het jaar (geen kruising meer) → 'approaching'", () => {
    // €17.000 (85%) op 20 december → resterende ~11 dagen tempo kruist de grens niet meer.
    const p = korThresholdProjection({
      revenueCents: 1_700_000,
      now: new Date("2026-12-20T12:00:00Z"),
    });
    expect(p.usedFraction).toBeGreaterThanOrEqual(0.8);
    expect(p.status).toBe("approaching");
    expect(p.projectedCrossMonth).toBeNull();
  });

  it("geen omzet → 'under' zonder projectie", () => {
    const p = korThresholdProjection({
      revenueCents: 0,
      now: new Date("2026-06-01T12:00:00Z"),
    });
    expect(p.status).toBe("under");
    expect(p.projectedAnnualCents).toBeNull();
    expect(p.remainingHeadroomCents).toBe(KOR_THRESHOLD_CENTS);
  });

  it("respecteert een overschreven grens (thresholdCents)", () => {
    const p = korThresholdProjection({
      revenueCents: 600_000,
      now: new Date("2026-05-15T12:00:00Z"),
      thresholdCents: 1_000_000, // €10.000
    });
    expect(p.thresholdCents).toBe(1_000_000);
    expect(p.status).toBe("projected_over");
  });

  it("de ruis-drempel is een positief aantal dagen", () => {
    expect(KOR_PROJECTION_MIN_DAY).toBeGreaterThan(0);
  });
});
