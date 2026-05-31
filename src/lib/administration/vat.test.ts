import { describe, expect, it } from "vitest";
import { computeVat, hourlySubtotalCents, creditVat } from "@/lib/administration/vat";

describe("computeVat", () => {
  it("rekent 21% over een subtotaal (standaard hoog)", () => {
    const b = computeVat(100_00, "STANDARD_HIGH");
    expect(b.vatRateBps).toBe(2100);
    expect(b.vatCents).toBe(21_00);
    expect(b.totalCents).toBe(121_00);
  });

  it("rekent 9% (verlaagd)", () => {
    const b = computeVat(200_00, "STANDARD_LOW");
    expect(b.vatCents).toBe(18_00);
    expect(b.totalCents).toBe(218_00);
  });

  it("verlegd en vrijgesteld leveren 0 BTW op, totaal = subtotaal", () => {
    for (const regime of ["REVERSE_CHARGE", "EXEMPT", "ZERO"] as const) {
      const b = computeVat(150_00, regime);
      expect(b.vatCents).toBe(0);
      expect(b.totalCents).toBe(150_00);
    }
  });

  it("rondt commercieel af op hele centen", () => {
    // 33,33 × 21% = 6,9993 → 7,00 (699.93 cent → 700)
    const b = computeVat(33_33, "STANDARD_HIGH");
    expect(b.vatCents).toBe(700);
  });

  it("weigert een negatief of niet-integer subtotaal", () => {
    expect(() => computeVat(-1, "STANDARD_HIGH")).toThrow();
    expect(() => computeVat(10.5, "STANDARD_HIGH")).toThrow();
  });
});

describe("hourlySubtotalCents", () => {
  it("uren × uurtarief in centen", () => {
    expect(hourlySubtotalCents(8, 75_00)).toBe(600_00);
  });
  it("ondersteunt kwartieren en rondt op hele centen", () => {
    expect(hourlySubtotalCents(7.25, 80_00)).toBe(580_00);
  });
});

describe("creditVat", () => {
  it("spiegelt de breakdown naar negatief (creditfactuur)", () => {
    const original = computeVat(100_00, "STANDARD_HIGH");
    const credited = creditVat(original);
    expect(credited.subtotalCents).toBe(-100_00);
    expect(credited.vatCents).toBe(-21_00);
    expect(credited.totalCents).toBe(-121_00);
  });
});
