import { describe, expect, it } from "vitest";
import {
  summarizeClientConcentration,
  CONCENTRATION_WATCH_PCT,
  CONCENTRATION_TOP_N,
  type ClientRevenue,
} from "./freelancer-client-concentration";

const c = (id: string, name: string, cents: number): ClientRevenue => ({
  clientUserId: id,
  clientName: name,
  cents,
});

const DBA = 80;

describe("summarizeClientConcentration", () => {
  it("geeft null zonder omzet", () => {
    expect(summarizeClientConcentration([], DBA)).toBeNull();
    expect(summarizeClientConcentration([c("a", "A", 0)], DBA)).toBeNull();
    // Alleen niet-positieve saldi tellen niet mee.
    expect(summarizeClientConcentration([c("a", "A", -100)], DBA)).toBeNull();
  });

  it("één betalende opdrachtgever = 100% = sterkste afhankelijkheid (bewust wél een signaal)", () => {
    const r = summarizeClientConcentration([c("a", "Zorg BV", 5000)], DBA);
    expect(r).not.toBeNull();
    expect(r!.top.sharePct).toBe(100);
    expect(r!.clientCount).toBe(1);
    expect(r!.crossesDbaThreshold).toBe(true);
    expect(r!.tone).toBe("concentrated");
  });

  it("berekent aandeel + totaal en sorteert aflopend, grootste ongeacht invoervolgorde", () => {
    const r = summarizeClientConcentration(
      [c("a", "A", 1000), c("b", "B", 3000), c("c", "C", 1000)],
      DBA,
    );
    expect(r!.totalCents).toBe(5000);
    expect(r!.clientCount).toBe(3);
    expect(r!.top.clientUserId).toBe("b");
    expect(r!.top.sharePct).toBe(60); // 3000/5000
    expect(r!.shares.map((s) => s.clientUserId)).toEqual(["b", "a", "c"]);
  });

  it("toon = good onder de watch-grens", () => {
    const r = summarizeClientConcentration([c("a", "A", 4000), c("b", "B", 6000)], DBA);
    expect(r!.top.sharePct).toBe(60);
    // 60 ≥ 50 (watch) maar < 80 (DBA)
    expect(r!.tone).toBe("watch");
    expect(r!.crossesDbaThreshold).toBe(false);
  });

  it("toon = good wanneer de grootste onder de watch-grens blijft", () => {
    const r = summarizeClientConcentration(
      [c("a", "A", 3000), c("b", "B", 4000), c("c", "C", 3000)],
      DBA,
    );
    expect(r!.top.sharePct).toBe(40); // < 50
    expect(r!.tone).toBe("good");
  });

  it("toon = concentrated zodra de grootste de DBA-drempel bereikt", () => {
    const r = summarizeClientConcentration([c("a", "A", 8000), c("b", "B", 2000)], DBA);
    expect(r!.top.sharePct).toBe(80);
    expect(r!.crossesDbaThreshold).toBe(true);
    expect(r!.tone).toBe("concentrated");
  });

  it("respecteert een afwijkende (admin-geconfigureerde) DBA-drempel", () => {
    const rows = [c("a", "A", 7000), c("b", "B", 3000)]; // top 70%
    expect(summarizeClientConcentration(rows, 80)!.crossesDbaThreshold).toBe(false);
    expect(summarizeClientConcentration(rows, 60)!.crossesDbaThreshold).toBe(true);
  });

  it("begrenst de lijst tot CONCENTRATION_TOP_N maar telt álle opdrachtgevers", () => {
    const rows = Array.from({ length: 7 }, (_, i) => c(`id${i}`, `Klant ${i}`, (i + 1) * 100));
    const r = summarizeClientConcentration(rows, DBA);
    expect(r!.clientCount).toBe(7);
    expect(r!.shares).toHaveLength(CONCENTRATION_TOP_N);
    // Aflopend: de grootste (700) eerst.
    expect(r!.shares[0]!.cents).toBe(700);
  });

  it("watch-grens constante blijft onder de standaard DBA-drempel", () => {
    expect(CONCENTRATION_WATCH_PCT).toBeLessThan(DBA);
  });
});
