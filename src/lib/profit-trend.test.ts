import { describe, expect, it } from "vitest";
import { buildProfitTrend } from "@/lib/profit-trend";
import { type LedgerEntry } from "@/lib/administration/overview";

// Vast anker: 15 aug 2026, middag UTC — ver van maandgrenzen/zomertijdrandjes. Nooit `new Date()`
// zonder argument, zodat de reeks deterministisch is.
const NOW = new Date("2026-08-15T12:00:00Z");

// Met months=6 en NOW=aug 2026 loopt het venster van mrt t/m aug 2026 (oud→nieuw).
const WINDOW_KEYS = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

/** Datum midden op een dag (12:00 UTC = 14:00 Europe/Amsterdam) → valt gegarandeerd in `key`-maand. */
function dayIn(key: string, day = 10): Date {
  return new Date(`${key}-${String(day).padStart(2, "0")}T12:00:00Z`);
}

function entry(
  account: LedgerEntry["account"],
  debitCents: number,
  creditCents: number,
  occurredAt: Date,
  party: LedgerEntry["party"] = "FREELANCER",
): LedgerEntry {
  return { party, account, debitCents, creditCents, occurredAt };
}

/** De maand in de reeks met deze sleutel (fail-fast als hij er niet is). */
function monthByKey(trend: ReturnType<typeof buildProfitTrend>, key: string) {
  const m = trend.series.find((s) => s.key === key);
  if (!m) throw new Error(`maand ${key} niet in reeks`);
  return m;
}

describe("buildProfitTrend", () => {
  it("geeft een lege, nul-reeks terug zonder grootboekregels", () => {
    const trend = buildProfitTrend([], "FREELANCER", NOW, 6);

    expect(trend.series).toHaveLength(6);
    expect(trend.series.map((m) => m.key)).toEqual(WINDOW_KEYS);
    for (const m of trend.series) {
      expect(m.revenueCents).toBe(0);
      expect(m.costCents).toBe(0);
      expect(m.profitCents).toBe(0);
    }
    expect(trend.totalRevenueCents).toBe(0);
    expect(trend.totalCostCents).toBe(0);
    expect(trend.totalProfitCents).toBe(0);
    expect(trend.currentProfitCents).toBe(0);
    expect(trend.hasData).toBe(false);
    expect(trend.months).toBe(6);
  });

  it("boekt één OMZET-credit in de lopende maand als winst = omzet", () => {
    const entries = [entry("OMZET", 0, 100_000, dayIn("2026-08"))];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.revenueCents).toBe(100_000);
    expect(aug.costCents).toBe(0);
    expect(aug.profitCents).toBe(100_000);

    // Geen andere maand raakt gevuld.
    for (const m of trend.series.filter((s) => s.key !== "2026-08")) {
      expect(m.revenueCents).toBe(0);
      expect(m.costCents).toBe(0);
    }

    expect(trend.totalRevenueCents).toBe(100_000);
    expect(trend.totalCostCents).toBe(0);
    expect(trend.totalProfitCents).toBe(100_000);
    expect(trend.currentProfitCents).toBe(100_000);
    expect(trend.hasData).toBe(true);
  });

  it("combineert OMZET en KOSTEN in dezelfde maand tot winst = omzet − kosten", () => {
    const entries = [
      entry("OMZET", 0, 100_000, dayIn("2026-08")),
      entry("KOSTEN", 30_000, 0, dayIn("2026-08", 12)),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.revenueCents).toBe(100_000);
    expect(aug.costCents).toBe(30_000);
    expect(aug.profitCents).toBe(70_000);
    expect(trend.currentProfitCents).toBe(70_000);
  });

  it("levert een NEGATIEVE winst in een verliesmaand (kosten > omzet) — eerlijk, niet geklemd", () => {
    const entries = [
      entry("OMZET", 0, 20_000, dayIn("2026-08")),
      entry("KOSTEN", 55_000, 0, dayIn("2026-08", 12)),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.profitCents).toBe(-35_000);
    expect(aug.profitCents).toBeLessThan(0);
    expect(trend.currentProfitCents).toBe(-35_000);
    expect(trend.totalProfitCents).toBe(-35_000);
    expect(trend.hasData).toBe(true);
  });

  it("plaatst regels uit verschillende maanden in de juiste buckets (oud→nieuw) en telt totalen op", () => {
    const entries = [
      // mrt: omzet 40.000, kosten 10.000 → winst 30.000
      entry("OMZET", 0, 40_000, dayIn("2026-03")),
      entry("KOSTEN", 10_000, 0, dayIn("2026-03", 20)),
      // jun: omzet 60.000, geen kosten → winst 60.000
      entry("OMZET", 0, 60_000, dayIn("2026-06")),
      // aug: kosten 15.000, geen omzet → winst -15.000
      entry("KOSTEN", 15_000, 0, dayIn("2026-08")),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    expect(trend.series.map((m) => m.key)).toEqual(WINDOW_KEYS);
    expect(monthByKey(trend, "2026-03").profitCents).toBe(30_000);
    expect(monthByKey(trend, "2026-04").profitCents).toBe(0);
    expect(monthByKey(trend, "2026-05").profitCents).toBe(0);
    expect(monthByKey(trend, "2026-06").profitCents).toBe(60_000);
    expect(monthByKey(trend, "2026-07").profitCents).toBe(0);
    expect(monthByKey(trend, "2026-08").profitCents).toBe(-15_000);

    expect(trend.totalRevenueCents).toBe(100_000);
    expect(trend.totalCostCents).toBe(25_000);
    expect(trend.totalProfitCents).toBe(75_000);
    expect(trend.currentProfitCents).toBe(-15_000);
    expect(trend.hasData).toBe(true);
  });

  it("negeert regels van een andere partij (CLIENT) — alleen de gevraagde partij telt", () => {
    const entries = [
      entry("OMZET", 0, 50_000, dayIn("2026-08"), "FREELANCER"),
      entry("OMZET", 0, 999_000, dayIn("2026-08"), "CLIENT"),
      entry("KOSTEN", 777_000, 0, dayIn("2026-08"), "CLIENT"),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.revenueCents).toBe(50_000);
    expect(aug.costCents).toBe(0);
    expect(trend.totalRevenueCents).toBe(50_000);
    expect(trend.totalCostCents).toBe(0);
  });

  it("negeert DEBITEUREN/CREDITEUREN-regels — die raken omzet noch kosten", () => {
    const entries = [
      entry("OMZET", 0, 80_000, dayIn("2026-08")),
      entry("DEBITEUREN", 121_000, 0, dayIn("2026-08")),
      entry("CREDITEUREN", 0, 36_300, dayIn("2026-08")),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.revenueCents).toBe(80_000);
    expect(aug.costCents).toBe(0);
    expect(aug.profitCents).toBe(80_000);
    expect(trend.totalRevenueCents).toBe(80_000);
    expect(trend.totalCostCents).toBe(0);
  });

  it("nettoteert een OMZET-correctie (credit − debit) en een KOSTEN-correctie (debit − credit)", () => {
    const entries = [
      // OMZET: 100.000 credit met een 25.000 debit-creditnota → netto 75.000 omzet.
      entry("OMZET", 25_000, 100_000, dayIn("2026-08")),
      // KOSTEN: 40.000 debit met een 10.000 credit-correctie → netto 30.000 kosten.
      entry("KOSTEN", 40_000, 10_000, dayIn("2026-08", 12)),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    const aug = monthByKey(trend, "2026-08");
    expect(aug.revenueCents).toBe(75_000);
    expect(aug.costCents).toBe(30_000);
    expect(aug.profitCents).toBe(45_000);
    expect(trend.totalProfitCents).toBe(45_000);
  });

  it("laat regels vóór het venster buiten reeks en totalen (geen bucket → niet meegeteld)", () => {
    const entries = [
      // Binnen het venster (aug).
      entry("OMZET", 0, 50_000, dayIn("2026-08")),
      // Vóór de vroegste bucket (mrt 2026) → jan 2026 valt in geen enkele bucket.
      entry("OMZET", 0, 900_000, dayIn("2026-01")),
      entry("KOSTEN", 800_000, 0, dayIn("2026-01")),
      // Ná de lopende maand (sep 2026) → eveneens buiten het venster.
      entry("OMZET", 0, 700_000, dayIn("2026-09")),
    ];
    const trend = buildProfitTrend(entries, "FREELANCER", NOW, 6);

    expect(trend.series.map((m) => m.key)).toEqual(WINDOW_KEYS);
    expect(monthByKey(trend, "2026-08").revenueCents).toBe(50_000);
    // Enkel de aug-regel telt mee; de jan- en sep-regels verdwijnen volledig.
    expect(trend.totalRevenueCents).toBe(50_000);
    expect(trend.totalCostCents).toBe(0);
    expect(trend.totalProfitCents).toBe(50_000);
    expect(trend.hasData).toBe(true);
  });

  it("respecteert een afwijkende venstergrootte (months)", () => {
    const trend = buildProfitTrend([], "FREELANCER", NOW, 3);
    expect(trend.months).toBe(3);
    expect(trend.series.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });
});
