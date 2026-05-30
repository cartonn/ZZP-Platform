import { describe, expect, it } from "vitest";
import { platformQuarterlySummary, type PlatformQuarterRow } from "@/lib/administration/platform-overview";
import { type LedgerEntry } from "@/lib/administration/overview";

function entry(
  party: LedgerEntry["party"],
  account: LedgerEntry["account"],
  debitCents: number,
  creditCents: number,
  occurredAt: Date,
): LedgerEntry {
  return { party, account, debitCents, creditCents, occurredAt };
}

describe("platformQuarterlySummary", () => {
  it("retourneert lege lijst bij geen regels", () => {
    expect(platformQuarterlySummary([])).toEqual([]);
  });

  it("groepeert FREELANCER OMZET per kwartaal", () => {
    const entries: LedgerEntry[] = [
      entry("FREELANCER", "OMZET", 0, 100_00, new Date("2026-01-15")), // Q1
      entry("FREELANCER", "OMZET", 0, 200_00, new Date("2026-04-01")), // Q2
    ];
    const rows = platformQuarterlySummary(entries);
    expect(rows).toHaveLength(2);
    // Nieuwste eerste
    const [q2, q1] = rows as [PlatformQuarterRow, PlatformQuarterRow];
    expect(q2.quarter).toBe(2);
    expect(q2.freelancerRevenueCents).toBe(200_00);
    expect(q1.quarter).toBe(1);
    expect(q1.freelancerRevenueCents).toBe(100_00);
  });

  it("groepeert CLIENT KOSTEN per kwartaal", () => {
    const entries: LedgerEntry[] = [
      entry("CLIENT", "KOSTEN", 300_00, 0, new Date("2026-07-10")), // Q3
      entry("CLIENT", "KOSTEN", 150_00, 0, new Date("2026-10-01")), // Q4
    ];
    const rows = platformQuarterlySummary(entries);
    expect(rows).toHaveLength(2);
    const [q4, q3] = rows as [PlatformQuarterRow, PlatformQuarterRow];
    expect(q4.quarter).toBe(4);
    expect(q4.clientCostsCents).toBe(150_00);
    expect(q3.quarter).toBe(3);
    expect(q3.clientCostsCents).toBe(300_00);
  });

  it("stapelt meerdere regels op in hetzelfde kwartaal", () => {
    const q1 = new Date("2026-02-01");
    const entries: LedgerEntry[] = [
      entry("FREELANCER", "OMZET", 0, 100_00, q1),
      entry("FREELANCER", "OMZET", 0, 50_00, q1),
      entry("CLIENT", "KOSTEN", 120_00, 0, q1),
    ];
    const rows = platformQuarterlySummary(entries);
    expect(rows).toHaveLength(1);
    const [row] = rows as [PlatformQuarterRow];
    expect(row.freelancerRevenueCents).toBe(150_00);
    expect(row.clientCostsCents).toBe(120_00);
  });

  it("negeert niet-OMZET en niet-KOSTEN rekeningen", () => {
    const entries: LedgerEntry[] = [
      entry("FREELANCER", "DEBITEUREN", 100_00, 0, new Date("2026-03-01")),
      entry("CLIENT", "CREDITEUREN", 0, 100_00, new Date("2026-03-01")),
      entry("FREELANCER", "OMZET", 0, 80_00, new Date("2026-03-01")),
    ];
    const rows = platformQuarterlySummary(entries);
    expect(rows).toHaveLength(1);
    const [row] = rows as [PlatformQuarterRow];
    expect(row.freelancerRevenueCents).toBe(80_00);
    expect(row.clientCostsCents).toBe(0);
  });

  it("sorteert nieuwste kwartaal eerst, dan oud jaar", () => {
    const entries: LedgerEntry[] = [
      entry("FREELANCER", "OMZET", 0, 10_00, new Date("2025-01-01")), // Q1 2025
      entry("FREELANCER", "OMZET", 0, 20_00, new Date("2026-04-01")), // Q2 2026
      entry("FREELANCER", "OMZET", 0, 30_00, new Date("2026-01-01")), // Q1 2026
    ];
    const rows = platformQuarterlySummary(entries);
    expect(rows.map((r): [number, number] => [r.year, r.quarter])).toEqual([
      [2026, 2],
      [2026, 1],
      [2025, 1],
    ]);
  });
});
