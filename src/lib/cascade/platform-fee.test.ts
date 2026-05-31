import { describe, expect, it } from "vitest";
import { computePlatformFee, feeSubtotalCents } from "@/lib/cascade/platform-fee";
import { summarizeByParty, isBalanced } from "@/lib/administration/ledger";
import { type PlatformFeeConfig } from "@/lib/config";

const OFF: PlatformFeeConfig = {
  enabled: false,
  percentageBps: 0,
  fixedCents: 0,
  payer: "CLIENT",
  trigger: "AFTER_PAYMENT",
  vatRegime: "STANDARD_HIGH",
};
const PCT: PlatformFeeConfig = { ...OFF, enabled: true, percentageBps: 500 }; // 5%
const FIXED: PlatformFeeConfig = { ...OFF, enabled: true, fixedCents: 50_00 };

describe("feeSubtotalCents", () => {
  it("percentage van de opdrachtwaarde", () => {
    expect(feeSubtotalCents(1000_00, PCT)).toBe(50_00); // 5% van 1000
  });
  it("vast bedrag heeft voorrang", () => {
    expect(feeSubtotalCents(1000_00, FIXED)).toBe(50_00);
  });
  it("0 als niets is geconfigureerd", () => {
    expect(feeSubtotalCents(1000_00, OFF)).toBe(0);
  });
});

describe("computePlatformFee", () => {
  it("default UIT (Besluit 4): geen fee, geen boekingen", () => {
    const r = computePlatformFee(1000_00); // gebruikt PLATFORM_FEE (uit)
    expect(r.applicable).toBe(false);
    expect(r.totalCents).toBe(0);
    expect(r.postings).toHaveLength(0);
  });

  it("ingeschakeld: 5% fee + 21% BTW, betaler = opdrachtgever", () => {
    const r = computePlatformFee(1000_00, PCT);
    expect(r.applicable).toBe(true);
    expect(r.payer).toBe("CLIENT");
    expect(r.subtotalCents).toBe(50_00);
    expect(r.vatCents).toBe(10_50); // 21% van 50
    expect(r.totalCents).toBe(60_50);
  });

  it("boekingen: platform omzet + af te dragen BTW; opdrachtgever kosten + voorbelasting", () => {
    const r = computePlatformFee(1000_00, PCT);
    const s = summarizeByParty(r.postings);
    expect(s.PLATFORM.OMZET).toBe(-50_00); // credit-saldo = omzet
    expect(s.PLATFORM.BTW_AF_TE_DRAGEN).toBe(-10_50);
    expect(s.CLIENT.KOSTEN).toBe(50_00);
    expect(s.CLIENT.BTW_VOORBELASTING).toBe(10_50);
    // Boeking sluit per partij.
    expect(isBalanced(r.postings, "PLATFORM")).toBe(true);
    expect(isBalanced(r.postings, "CLIENT")).toBe(true);
  });

  it("gescheiden van de hoofdgeldstroom: de ZZP'er heeft geen fee-boeking (Besluit 1)", () => {
    const r = computePlatformFee(1000_00, PCT);
    expect(Object.keys(summarizeByParty(r.postings).FREELANCER)).toHaveLength(0);
  });
});
