import { describe, expect, it } from "vitest";
import { reservationAdvice, availableToWithdrawCents } from "@/lib/tax/reservation";
import { estimateIncomeTax } from "@/lib/tax/income-tax";

describe("reservationAdvice", () => {
  it("reserveert 100% van een positief BTW-saldo + de IB/Zvw-schatting", () => {
    const input = {
      profitCents: 5000000,
      urencriteriumMet: true,
      currentVatBalanceCents: 210000,
    };
    const advice = reservationAdvice(input);
    const ib = estimateIncomeTax(input).totalCents;
    expect(advice.vatReserveCents).toBe(210000);
    expect(advice.incomeReserveCents).toBe(ib);
    expect(advice.totalReserveCents).toBe(210000 + ib);
  });

  it("negatief BTW-saldo (terug te ontvangen) → geen BTW-reservering", () => {
    const advice = reservationAdvice({
      profitCents: 5000000,
      urencriteriumMet: true,
      currentVatBalanceCents: -50000,
    });
    expect(advice.vatReserveCents).toBe(0);
  });

  it("reserveringspercentage is transparant en plausibel", () => {
    const advice = reservationAdvice({
      profitCents: 5000000,
      urencriteriumMet: true,
      currentVatBalanceCents: 0,
    });
    expect(advice.reserveRateBps).toBeGreaterThan(0);
    expect(advice.reserveRateBps).toBeLessThan(5000); // minder dan 50% van de winst
  });

  it("nul winst en nul BTW → niets reserveren", () => {
    const advice = reservationAdvice({
      profitCents: 0,
      urencriteriumMet: true,
      currentVatBalanceCents: 0,
    });
    expect(advice.totalReserveCents).toBe(0);
    expect(advice.reserveRateBps).toBe(0);
  });
});

describe("availableToWithdrawCents", () => {
  it("winst minus reservering, ondergrens nul", () => {
    const advice = reservationAdvice({
      profitCents: 5000000,
      urencriteriumMet: true,
      currentVatBalanceCents: 210000,
    });
    const beschikbaar = availableToWithdrawCents(5000000, advice);
    expect(beschikbaar).toBe(5000000 - advice.totalReserveCents);
    expect(beschikbaar).toBeGreaterThanOrEqual(0);
  });

  it("nooit negatief als reservering de winst overstijgt", () => {
    const advice = reservationAdvice({
      profitCents: 100000,
      urencriteriumMet: false,
      currentVatBalanceCents: 500000,
    });
    expect(availableToWithdrawCents(100000, advice)).toBe(0);
  });
});
