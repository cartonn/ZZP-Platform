import { describe, expect, it } from "vitest";

import {
  CONCENTRATION_DANGER_BPS,
  CONCENTRATION_WARNING_BPS,
  summarizeRevenueConcentration,
} from "./tenant-concentration";

const c = (name: string, revenuePaidCents: number) => ({ name, revenuePaidCents });

describe("summarizeRevenueConcentration", () => {
  it("geeft null bij minder dan twee betalende opdrachtgevers", () => {
    expect(summarizeRevenueConcentration([])).toBeNull();
    expect(summarizeRevenueConcentration([c("Alpha", 1000)])).toBeNull();
    // tweede opdrachtgever zonder omzet telt niet mee → nog steeds één betalend
    expect(summarizeRevenueConcentration([c("Alpha", 1000), c("Beta", 0)])).toBeNull();
  });

  it("geeft null wanneer het totaal nul is", () => {
    expect(summarizeRevenueConcentration([c("Alpha", 0), c("Beta", 0)])).toBeNull();
  });

  it("berekent top-aandeel en totaal correct", () => {
    const result = summarizeRevenueConcentration([c("Alpha", 7000), c("Beta", 3000)]);
    expect(result).not.toBeNull();
    expect(result!.totalCents).toBe(10000);
    expect(result!.activeClients).toBe(2);
    expect(result!.topName).toBe("Alpha");
    expect(result!.topShareBps).toBe(7000); // 70%
  });

  it("kiest de grootste opdrachtgever ongeacht invoervolgorde", () => {
    const result = summarizeRevenueConcentration([
      c("Klein", 1000),
      c("Groot", 9000),
      c("Midden", 5000),
    ]);
    expect(result!.topName).toBe("Groot");
    expect(result!.topShareBps).toBe(6000); // 9000 / 15000 = 60%
  });

  it("telt het aantal opdrachtgevers dat samen ≥ 80% vormt", () => {
    // 50/30/15/5 → cumulatief 50, 80 (≥80% bij de tweede)
    const result = summarizeRevenueConcentration([
      c("A", 5000),
      c("B", 3000),
      c("C", 1500),
      c("D", 500),
    ]);
    expect(result!.clientsForMajority).toBe(2);
  });

  it("vraagt alle opdrachtgevers wanneer het volume gelijk verdeeld is", () => {
    const result = summarizeRevenueConcentration([
      c("A", 2500),
      c("B", 2500),
      c("C", 2500),
      c("D", 2500),
    ]);
    // 25/50/75/100 → pas bij de vierde ≥ 80%
    expect(result!.clientsForMajority).toBe(4);
    expect(result!.topShareBps).toBe(2500);
  });

  it("classificeert de toon op het top-aandeel", () => {
    const danger = summarizeRevenueConcentration([c("A", 6000), c("B", 4000)]);
    expect(danger!.topShareBps).toBeGreaterThanOrEqual(CONCENTRATION_DANGER_BPS);
    expect(danger!.tone).toBe("danger");

    const warning = summarizeRevenueConcentration([c("A", 5000), c("B", 5000), c("C", 2000)]);
    // 5000 / 12000 ≈ 4167 bps → warning
    expect(warning!.topShareBps).toBeGreaterThanOrEqual(CONCENTRATION_WARNING_BPS);
    expect(warning!.topShareBps).toBeLessThan(CONCENTRATION_DANGER_BPS);
    expect(warning!.tone).toBe("warning");

    const spread = summarizeRevenueConcentration([
      c("A", 3000),
      c("B", 3000),
      c("C", 3000),
      c("D", 1000),
    ]);
    // 3000 / 10000 = 3000 bps → default
    expect(spread!.tone).toBe("default");
  });

  it("negeert opdrachtgevers zonder betaalde omzet in het totaal", () => {
    const result = summarizeRevenueConcentration([c("A", 8000), c("B", 2000), c("Leeg", 0)]);
    expect(result!.totalCents).toBe(10000);
    expect(result!.activeClients).toBe(2);
    expect(result!.topShareBps).toBe(8000);
  });
});
