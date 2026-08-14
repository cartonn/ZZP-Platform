import { describe, expect, it } from "vitest";
import {
  buildExpenseTrend,
  toExpenseRows,
  expenseTrend,
  type ExpenseLikeRow,
} from "./expense-trend";

// Anker midden in de maand → geen maandgrens-/zomertijdrandjes (zoals de omzettrend-tests).
const now = new Date("2026-08-15T12:00:00Z");

function d(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

describe("toExpenseRows", () => {
  it("mapt netto centen naar het bedrag-veld", () => {
    const rows: ExpenseLikeRow[] = [
      { occurredAt: d("2026-08-01"), netCents: 1500 },
      { occurredAt: d("2026-07-10"), netCents: 900 },
    ];
    expect(toExpenseRows(rows)).toEqual([
      { occurredAt: d("2026-08-01"), totalCents: 1500 },
      { occurredAt: d("2026-07-10"), totalCents: 900 },
    ]);
  });
});

describe("buildExpenseTrend", () => {
  it("geeft een leeg venster (geen data) terug zonder uitgaven", () => {
    const trend = buildExpenseTrend([], now, 6);
    expect(trend.hasData).toBe(false);
    expect(trend.totalCents).toBe(0);
    expect(trend.currentCents).toBe(0);
    expect(trend.deltaPct).toBeNull();
    expect(trend.series).toHaveLength(6);
    // Alle maanden aanwezig, allemaal nul.
    expect(trend.series.every((m) => m.cents === 0)).toBe(true);
  });

  it("bucket per kalendermaand en telt bedragen binnen dezelfde maand op", () => {
    const trend = buildExpenseTrend(
      toExpenseRows([
        { occurredAt: d("2026-08-02"), netCents: 1000 },
        { occurredAt: d("2026-08-20"), netCents: 500 },
        { occurredAt: d("2026-07-05"), netCents: 800 },
      ]),
      now,
      6,
    );
    const aug = trend.series.find((m) => m.key === "2026-08");
    const jul = trend.series.find((m) => m.key === "2026-07");
    expect(aug?.cents).toBe(1500);
    expect(jul?.cents).toBe(800);
    expect(trend.totalCents).toBe(2300);
    expect(trend.currentCents).toBe(1500); // laatste maand = augustus
    expect(trend.hasData).toBe(true);
  });

  it("toont exact `months` maanden, van oud naar nieuw, eindigend op de maand van now", () => {
    const trend = buildExpenseTrend([], now, 3);
    expect(trend.series.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("laat uitgaven buiten het venster vallen", () => {
    const trend = buildExpenseTrend(
      toExpenseRows([
        { occurredAt: d("2026-01-15"), netCents: 9999 }, // ver buiten een 3-maands venster
        { occurredAt: d("2026-08-01"), netCents: 100 },
      ]),
      now,
      3,
    );
    expect(trend.totalCents).toBe(100);
  });

  it("berekent de maand-op-maand delta t.o.v. de vorige maand", () => {
    const trend = buildExpenseTrend(
      toExpenseRows([
        { occurredAt: d("2026-07-10"), netCents: 1000 },
        { occurredAt: d("2026-08-10"), netCents: 1500 },
      ]),
      now,
      6,
    );
    // (1500 - 1000) / 1000 = +50%
    expect(trend.deltaPct).toBe(50);
  });

  it("geeft null-delta zolang de lopende maand nog leeg is (geen misleidende -100%)", () => {
    const trend = buildExpenseTrend(
      toExpenseRows([{ occurredAt: d("2026-07-10"), netCents: 1000 }]),
      now,
      6,
    );
    expect(trend.deltaPct).toBeNull();
  });
});

describe("expenseTrend (convenience)", () => {
  it("combineert mappen + aggregeren in één stap", () => {
    const trend = expenseTrend([{ occurredAt: d("2026-08-01"), netCents: 2500 }], now, 6);
    expect(trend.hasData).toBe(true);
    expect(trend.currentCents).toBe(2500);
    expect(trend.totalCents).toBe(2500);
  });
});
