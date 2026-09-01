import { describe, expect, it } from "vitest";
import { KOR_THRESHOLD_CENTS } from "@/lib/tax/config";
import { type KorProjection } from "@/lib/tax/kor-projection";
import { korThresholdView } from "@/lib/tax/kor-threshold-view";

function projection(overrides: Partial<KorProjection>): KorProjection {
  return {
    status: "under",
    revenueCents: 0,
    thresholdCents: KOR_THRESHOLD_CENTS,
    usedFraction: 0,
    projectedAnnualCents: null,
    projectedCrossMonth: null,
    projectedCrossMonthLabel: null,
    remainingHeadroomCents: KOR_THRESHOLD_CENTS,
    ...overrides,
  };
}

describe("korThresholdView", () => {
  it("toont 'ruim binnen' als neutraal met resterende ruimte", () => {
    const view = korThresholdView(
      projection({ revenueCents: 500000, usedFraction: 0.25, remainingHeadroomCents: 1500000 }),
      false,
    );
    expect(view.tone).toBe("neutral");
    expect(view.fractionPct).toBe(25);
    expect(view.statusLabel).toBe("Ruim binnen de grens");
    expect(view.detail).toContain("€ 15.000");
  });

  it("markeert 'in zicht' als waarschuwing wanneer approaching, met kruis-maand", () => {
    const view = korThresholdView(
      projection({
        status: "projected_over",
        revenueCents: 1700000,
        usedFraction: 0.85,
        remainingHeadroomCents: 300000,
        projectedCrossMonth: 11,
        projectedCrossMonthLabel: "november",
      }),
      true,
    );
    expect(view.tone).toBe("warning");
    expect(view.fractionPct).toBe(85);
    expect(view.headline).toContain("nadert");
    expect(view.detail).toContain("november");
  });

  it("waarschuwt bij projected_over ook onder 80% (vroegtijdig tempo-signaal)", () => {
    const view = korThresholdView(
      projection({
        status: "projected_over",
        revenueCents: 1400000,
        usedFraction: 0.7,
        remainingHeadroomCents: 600000,
        projectedCrossMonth: 12,
        projectedCrossMonthLabel: "december",
      }),
      false,
    );
    expect(view.tone).toBe("warning");
    expect(view.statusLabel).toBe("Tempo kruist de grens");
    expect(view.detail).toContain("december");
  });

  it("toont 'gepasseerd' als danger en kapt de meter op 100%", () => {
    const view = korThresholdView(
      projection({
        status: "over",
        revenueCents: 2500000,
        usedFraction: 1.25,
        remainingHeadroomCents: 0,
      }),
      false,
    );
    expect(view.tone).toBe("danger");
    expect(view.fractionPct).toBe(100);
    expect(view.headline).toContain("gepasseerd");
  });

  it("valt terug op neutraal wanneer projected_over zonder kruis-maand en niet approaching", () => {
    const view = korThresholdView(
      projection({ status: "projected_over", revenueCents: 100000, usedFraction: 0.05 }),
      false,
    );
    expect(view.tone).toBe("neutral");
  });
});
