import { describe, expect, it } from "vitest";
import { forecastInvoicePayout, PAYOUT_FORECAST_MIN_SAMPLE } from "@/lib/invoice-payment-forecast";

const d = (iso: string) => new Date(iso);

describe("forecastInvoicePayout", () => {
  it("projecteert het gemiddelde op de factuurdatum bij genoeg historie", () => {
    const f = forecastInvoicePayout({
      issuedAt: d("2026-06-01T00:00:00Z"),
      dueAt: d("2026-06-15T00:00:00Z"),
      avgDaysToPay: 18,
      sampleSize: 4,
    });
    expect(f).not.toBeNull();
    expect(f!.basis).toBe("history");
    expect(f!.confident).toBe(true);
    expect(f!.expectedAt.toISOString()).toBe("2026-06-19T00:00:00.000Z");
    // 19 jun valt 4 dagen na de vervaldag (15 jun).
    expect(f!.daysAfterDue).toBe(4);
  });

  it("valt terug op de vervaldatum zonder voldoende steekproef", () => {
    const f = forecastInvoicePayout({
      issuedAt: d("2026-06-01T00:00:00Z"),
      dueAt: d("2026-06-15T00:00:00Z"),
      avgDaysToPay: 10,
      sampleSize: PAYOUT_FORECAST_MIN_SAMPLE - 1,
    });
    expect(f!.basis).toBe("due");
    expect(f!.confident).toBe(false);
    expect(f!.expectedAt.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(f!.daysAfterDue).toBe(0);
  });

  it("valt terug op de vervaldatum als het gemiddelde ontbreekt", () => {
    const f = forecastInvoicePayout({
      issuedAt: d("2026-06-01T00:00:00Z"),
      dueAt: d("2026-06-20T00:00:00Z"),
      avgDaysToPay: null,
      sampleSize: 9,
    });
    expect(f!.basis).toBe("due");
    expect(f!.expectedAt.toISOString()).toBe("2026-06-20T00:00:00.000Z");
  });

  it("kan geen historie projecteren zonder factuurdatum, valt terug op vervaldatum", () => {
    const f = forecastInvoicePayout({
      issuedAt: null,
      dueAt: d("2026-06-20T00:00:00Z"),
      avgDaysToPay: 12,
      sampleSize: 5,
    });
    expect(f!.basis).toBe("due");
    expect(f!.expectedAt.toISOString()).toBe("2026-06-20T00:00:00.000Z");
  });

  it("geeft null wanneer er geen enkel anker is", () => {
    expect(
      forecastInvoicePayout({ issuedAt: null, dueAt: null, avgDaysToPay: 12, sampleSize: 5 }),
    ).toBeNull();
  });

  it("clampt een negatief gemiddelde (data-ruis) naar de factuurdatum", () => {
    const f = forecastInvoicePayout({
      issuedAt: d("2026-06-10T00:00:00Z"),
      dueAt: d("2026-06-24T00:00:00Z"),
      avgDaysToPay: -3,
      sampleSize: 5,
    });
    expect(f!.basis).toBe("history");
    expect(f!.expectedAt.toISOString()).toBe("2026-06-10T00:00:00.000Z");
    // 10 jun valt 14 dagen vóór de vervaldag.
    expect(f!.daysAfterDue).toBe(-14);
  });

  it("daysAfterDue is null zonder vervaldatum maar mét historie", () => {
    const f = forecastInvoicePayout({
      issuedAt: d("2026-06-01T00:00:00Z"),
      dueAt: null,
      avgDaysToPay: 20,
      sampleSize: 5,
    });
    expect(f!.basis).toBe("history");
    expect(f!.daysAfterDue).toBeNull();
    expect(f!.expectedAt.toISOString()).toBe("2026-06-21T00:00:00.000Z");
  });
});
