import { describe, expect, it } from "vitest";
import { summarizeOwnPaymentTiming, STANDARD_PAYMENT_TERM_DAYS } from "./own-payment-timing";
import { type PaymentRow } from "./payment-behavior";

const ISSUE = new Date("2026-06-01T12:00:00Z");

/**
 * Bouwt een betaalde factuurrij die exact `daysToPay` dagen na de factuurdatum is betaald, met een
 * vervaldatum `termDays` dagen na de factuurdatum. Zo is zowel de gemiddelde betaaltermijn als het
 * op-tijd-percentage deterministisch te sturen.
 */
function paidRow(daysToPay: number, termDays = 30): PaymentRow {
  const issuedAt = new Date(ISSUE);
  const dueAt = new Date(ISSUE.getTime() + termDays * 86_400_000);
  const paidAt = new Date(ISSUE.getTime() + daysToPay * 86_400_000);
  return { issuedAt, dueAt, paidAt };
}

describe("summarizeOwnPaymentTiming", () => {
  it("geeft null onder de steekproefdrempel (< 3 betaalde facturen)", () => {
    expect(summarizeOwnPaymentTiming([])).toBeNull();
    expect(summarizeOwnPaymentTiming([paidRow(10)])).toBeNull();
    expect(summarizeOwnPaymentTiming([paidRow(10), paidRow(12)])).toBeNull();
  });

  it("negeert nog-openstaande (onbetaalde) facturen in de steekproef", () => {
    const rows: PaymentRow[] = [
      paidRow(10),
      paidRow(12),
      { issuedAt: ISSUE, dueAt: new Date(ISSUE.getTime() + 30 * 86_400_000), paidAt: null },
    ];
    // Slechts 2 betaalde rijen → onder de drempel → null.
    expect(summarizeOwnPaymentTiming(rows)).toBeNull();
  });

  it("berekent de gemiddelde betaaltermijn en het op-tijd-percentage", () => {
    // 3 facturen: 8, 10, 12 dagen tot betaling → gemiddeld 10; alle ruim binnen 30 dagen → 100% op tijd.
    const result = summarizeOwnPaymentTiming([paidRow(8), paidRow(10), paidRow(12)]);
    expect(result).not.toBeNull();
    expect(result!.sampleSize).toBe(3);
    expect(result!.avgDaysToPay).toBe(10);
    expect(result!.onTimePct).toBe(100);
    expect(result!.tone).toBe("good");
  });

  it("classificeert 'faster' wanneer ruim onder de standaardtermijn betaald wordt", () => {
    const result = summarizeOwnPaymentTiming([paidRow(9), paidRow(10), paidRow(11)]);
    expect(result!.vsStandard).toBe("faster");
  });

  it("classificeert 'around' binnen de marge rond de standaardtermijn", () => {
    // Gemiddeld ~30 dagen (29/30/31) → binnen de 3-dagen-marge.
    const result = summarizeOwnPaymentTiming([paidRow(29, 45), paidRow(30, 45), paidRow(31, 45)]);
    expect(result!.avgDaysToPay).toBe(30);
    expect(result!.vsStandard).toBe("around");
  });

  it("classificeert 'slower' + warning-tone wanneer structureel traag betaald", () => {
    // Gemiddeld ~40 dagen, allemaal ná de 30-dagen-vervaldatum → traag én vaak te laat.
    const result = summarizeOwnPaymentTiming([paidRow(38), paidRow(40), paidRow(42)]);
    expect(result!.avgDaysToPay).toBeGreaterThan(STANDARD_PAYMENT_TERM_DAYS);
    expect(result!.vsStandard).toBe("slower");
    expect(result!.tone).toBe("warning");
    expect(result!.onTimePct).toBe(0);
  });

  it("levert onTimePct null als geen enkele betaalde factuur een vervaldatum heeft", () => {
    const rows: PaymentRow[] = [
      { issuedAt: ISSUE, dueAt: null, paidAt: new Date(ISSUE.getTime() + 10 * 86_400_000) },
      { issuedAt: ISSUE, dueAt: null, paidAt: new Date(ISSUE.getTime() + 12 * 86_400_000) },
      { issuedAt: ISSUE, dueAt: null, paidAt: new Date(ISSUE.getTime() + 14 * 86_400_000) },
    ];
    const result = summarizeOwnPaymentTiming(rows);
    expect(result).not.toBeNull();
    expect(result!.onTimePct).toBeNull();
    expect(result!.avgDaysToPay).toBe(12);
  });
});
