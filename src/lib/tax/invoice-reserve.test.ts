import { describe, it, expect } from "vitest";
import { invoiceReserveHint, shouldShowInvoiceReserve } from "@/lib/tax/invoice-reserve";
import { INCOME_RESERVE_DEFAULT_BPS } from "@/lib/tax/config";

describe("invoiceReserveHint", () => {
  it("houdt de volledige btw apart en past de vuistregel toe op de netto-omzet", () => {
    // Netto €1.000, btw €210 (21%). Vuistregel 35% over de netto-omzet = €350.
    const hint = invoiceReserveHint({ subtotalCents: 100000, vatCents: 21000 });
    expect(hint.vatReserveCents).toBe(21000);
    expect(hint.incomeReserveCents).toBe(Math.round((100000 * INCOME_RESERVE_DEFAULT_BPS) / 10000));
    expect(hint.incomeReserveCents).toBe(35000);
    expect(hint.totalReserveCents).toBe(21000 + 35000);
    expect(hint.incomeRateBps).toBe(INCOME_RESERVE_DEFAULT_BPS);
  });

  it("respecteert een expliciete voet", () => {
    const hint = invoiceReserveHint({ subtotalCents: 200000, vatCents: 0, incomeRateBps: 4000 });
    expect(hint.incomeReserveCents).toBe(80000); // 40% van €2.000
    expect(hint.vatReserveCents).toBe(0);
    expect(hint.totalReserveCents).toBe(80000);
  });

  it("kapt negatieve invoer af op nul", () => {
    const hint = invoiceReserveHint({ subtotalCents: -5000, vatCents: -100 });
    expect(hint.vatReserveCents).toBe(0);
    expect(hint.incomeReserveCents).toBe(0);
    expect(hint.totalReserveCents).toBe(0);
  });

  it("rondt af op hele centen", () => {
    const hint = invoiceReserveHint({ subtotalCents: 33333, vatCents: 7 });
    expect(Number.isInteger(hint.incomeReserveCents)).toBe(true);
    expect(hint.incomeReserveCents).toBe(Math.round((33333 * INCOME_RESERVE_DEFAULT_BPS) / 10000));
  });
});

describe("shouldShowInvoiceReserve", () => {
  const base = {
    isFreelancerOwner: true,
    subtotalCents: 100000,
    vatCents: 21000,
    status: "SENT",
    lifecycleStatus: "SUBMITTED" as string | null,
  };

  it("toont voor de crediteur bij een geldige uitsplitsing", () => {
    expect(shouldShowInvoiceReserve(base)).toBe(true);
  });

  it("verbergt voor de opdrachtgever", () => {
    expect(shouldShowInvoiceReserve({ ...base, isFreelancerOwner: false })).toBe(false);
  });

  it("verbergt zonder bekende uitsplitsing (legacy-factuur)", () => {
    expect(shouldShowInvoiceReserve({ ...base, subtotalCents: null })).toBe(false);
    expect(shouldShowInvoiceReserve({ ...base, vatCents: null })).toBe(false);
  });

  it("verbergt bij nul- of negatieve netto-omzet", () => {
    expect(shouldShowInvoiceReserve({ ...base, subtotalCents: 0 })).toBe(false);
  });

  it("verbergt voor geannuleerde/teruggedraaide omzet", () => {
    expect(shouldShowInvoiceReserve({ ...base, status: "CANCELLED" })).toBe(false);
    expect(shouldShowInvoiceReserve({ ...base, lifecycleStatus: "CREDITED" })).toBe(false);
    expect(shouldShowInvoiceReserve({ ...base, lifecycleStatus: "REJECTED" })).toBe(false);
  });
});
