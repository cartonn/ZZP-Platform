import { describe, expect, it } from "vitest";
import { buildOntzorgOverview } from "@/lib/tax/ontzorg-overview";
import { type LedgerEntry } from "@/lib/administration/overview";

// Helper: bouw grootboekregels voor een ZZP'er (FREELANCER).
function entry(
  account: LedgerEntry["account"],
  debit: number,
  credit: number,
  date: string,
): LedgerEntry {
  return {
    party: "FREELANCER",
    account,
    debitCents: debit,
    creditCents: credit,
    occurredAt: new Date(date),
  };
}

describe("buildOntzorgOverview", () => {
  const now = new Date("2026-05-15T12:00:00Z"); // Q2

  it("brengt omzet, BTW, reservering, uren en IB samen", () => {
    const entries: LedgerEntry[] = [
      // Omzet €10.000 (credit OMZET), BTW €2.100 af te dragen (credit), debiteuren
      entry("OMZET", 0, 1000000, "2026-04-10T10:00:00Z"),
      entry("BTW_AF_TE_DRAGEN", 0, 210000, "2026-04-10T10:00:00Z"),
      entry("DEBITEUREN", 1210000, 0, "2026-04-10T10:00:00Z"),
    ];
    const o = buildOntzorgOverview({ entries, directHours: 500, indirectHours: 50, now });

    expect(o.year).toBe(2026);
    expect(o.quarter).toBe(2);
    expect(o.revenueCents).toBe(1000000);
    expect(o.vatBalanceCents).toBe(210000); // €2.100 af te dragen
    expect(o.vatDeadline).toBe("2026-07-31");
    expect(o.reservation.vatReserveCents).toBe(210000);
    expect(o.reservation.totalReserveCents).toBeGreaterThan(210000); // + IB-schatting
    expect(o.availableCents).toBeLessThan(o.profitCents);
    expect(o.hours.totalHours).toBe(550);
  });

  it("genereert een BTW-indien-actie met deadline", () => {
    const entries: LedgerEntry[] = [entry("BTW_AF_TE_DRAGEN", 0, 50000, "2026-04-01T10:00:00Z")];
    const o = buildOntzorgOverview({ entries, directHours: 0, indirectHours: 0, now });
    const vatAction = o.actions.find((a) => a.code === "VAT_SUBMIT");
    expect(vatAction).toBeDefined();
    expect(vatAction?.label).toContain("31 juli");
  });

  it("lege administratie: geen reservering, geen acties die geld vragen", () => {
    const o = buildOntzorgOverview({ entries: [], directHours: 0, indirectHours: 0, now });
    expect(o.profitCents).toBe(0);
    expect(o.reservation.totalReserveCents).toBe(0);
    expect(o.actions.find((a) => a.code === "VAT_SUBMIT")).toBeUndefined();
    expect(o.actions.find((a) => a.code === "RESERVE")).toBeUndefined();
  });

  it("KOR-signaal verschijnt bij >80% van de €20.000-grens", () => {
    const entries: LedgerEntry[] = [entry("OMZET", 0, 1800000, "2026-04-01T10:00:00Z")];
    const o = buildOntzorgOverview({ entries, directHours: 0, indirectHours: 0, now });
    expect(o.korApproaching).toBe(true);
    expect(o.actions.find((a) => a.code === "KOR_THRESHOLD")).toBeDefined();
    // De tempo-projectie is meegenomen in de overview.
    expect(o.korProjection.status).toBe("projected_over");
  });

  it("vroegtijdig KOR-tempo-signaal: nog onder 80% maar tempo kruist de grens dit jaar", () => {
    // €12.000 op 15 mei (dag ~135) → jaarbasis ≈ €32.000 → projectie kruist de grens, maar 60% < 80%.
    const entries: LedgerEntry[] = [entry("OMZET", 0, 1200000, "2026-04-01T10:00:00Z")];
    const o = buildOntzorgOverview({ entries, directHours: 0, indirectHours: 0, now });
    expect(o.korApproaching).toBe(false);
    expect(o.korProjection.status).toBe("projected_over");
    const projected = o.actions.find((a) => a.code === "KOR_PROJECTED_OVER");
    expect(projected).toBeDefined();
    expect(projected?.label).toContain("KOR-grens");
    // Geen dubbel KOR-signaal: de statische >80%-actie vuurt hier niet.
    expect(o.actions.find((a) => a.code === "KOR_THRESHOLD")).toBeUndefined();
  });

  it("geen KOR-signaal bij een laag tempo ruim onder de grens", () => {
    const entries: LedgerEntry[] = [entry("OMZET", 0, 300000, "2026-04-01T10:00:00Z")];
    const o = buildOntzorgOverview({ entries, directHours: 0, indirectHours: 0, now });
    expect(o.korProjection.status).toBe("under");
    expect(o.actions.find((a) => a.code === "KOR_PROJECTED_OVER")).toBeUndefined();
    expect(o.actions.find((a) => a.code === "KOR_THRESHOLD")).toBeUndefined();
  });

  it("acties zijn gesorteerd op urgentie (now vóór soon vóór info)", () => {
    const entries: LedgerEntry[] = [entry("BTW_AF_TE_DRAGEN", 0, 50000, "2026-04-01T10:00:00Z")];
    // now vlak vóór de Q2-deadline → BTW-actie urgentie "now"
    const o = buildOntzorgOverview({
      entries,
      directHours: 0,
      indirectHours: 0,
      now: new Date("2026-07-28T12:00:00Z"),
    });
    const urgencies = o.actions.map((a) => a.urgency);
    const order = { now: 0, soon: 1, info: 2 } as const;
    const sorted = [...urgencies].sort((a, b) => order[a] - order[b]);
    expect(urgencies).toEqual(sorted);
  });
});
