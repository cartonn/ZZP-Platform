import { describe, expect, it } from "vitest";
import {
  buildFreelancerPaymentBehaviourBreakdown,
  type PaidInvoiceForBehaviour,
} from "./freelancer-payment-behaviour";

// Helper: n betaalde facturen voor één opdrachtgever met een vaste betaaltijd (dagen na issuedAt)
// en een vervaldatum `dueDays` dagen na issuedAt. issuedAt is een vast anker.
function invoices(
  companyId: string,
  name: string,
  count: number,
  daysToPay: number,
  dueDays = 30,
): PaidInvoiceForBehaviour[] {
  const issued = new Date("2026-01-01T00:00:00.000Z");
  return Array.from({ length: count }, () => ({
    companyId,
    companyName: name,
    issuedAt: issued,
    dueAt: new Date(issued.getTime() + dueDays * 86_400_000),
    paidAt: new Date(issued.getTime() + daysToPay * 86_400_000),
  }));
}

describe("buildFreelancerPaymentBehaviourBreakdown", () => {
  it("returns an empty breakdown without invoices", () => {
    const b = buildFreelancerPaymentBehaviourBreakdown([]);
    expect(b.rows).toEqual([]);
    expect(b.slowPayers).toBe(0);
  });

  it("skips a client with too little history (unknown signal)", () => {
    // 2 betalingen < PAYMENT_MIN_SAMPLE_SIZE (3) → geen betrouwbaar oordeel, niet in de lijst.
    const b = buildFreelancerPaymentBehaviourBreakdown(invoices("c1", "Acme", 2, 5));
    expect(b.rows).toEqual([]);
    expect(b.slowPayers).toBe(0);
  });

  it("aggregates per client and derives the payment signal", () => {
    const b = buildFreelancerPaymentBehaviourBreakdown(invoices("c1", "Acme", 4, 8));
    expect(b.rows).toHaveLength(1);
    const row = b.rows[0]!;
    expect(row.companyId).toBe("c1");
    expect(row.name).toBe("Acme");
    expect(row.behavior.sampleSize).toBe(4);
    expect(row.behavior.avgDaysToPay).toBe(8);
    // Betaald op 8 dagen (≤14) en vóór de vervaldag → goed.
    expect(row.behavior.tone).toBe("good");
    expect(row.behavior.onTimePct).toBe(100);
    expect(b.slowPayers).toBe(0);
  });

  it("orders the most concerning payer first and counts slow payers", () => {
    const b = buildFreelancerPaymentBehaviourBreakdown([
      ...invoices("good", "Snelbetaler", 3, 7), // good
      ...invoices("slow", "Traagbetaler", 3, 45), // warning (>30 dagen, te laat)
      ...invoices("slower", "Nog trager", 3, 60), // warning, langzamer
    ]);
    expect(b.rows.map((r) => r.companyId)).toEqual(["slower", "slow", "good"]);
    expect(b.slowPayers).toBe(2);
    expect(b.rows[0]!.behavior.tone).toBe("warning");
    expect(b.rows[2]!.behavior.tone).toBe("good");
  });

  it("ignores invoices without a known client", () => {
    const b = buildFreelancerPaymentBehaviourBreakdown([
      ...invoices("c1", "Acme", 3, 10),
      { companyId: null, companyName: null, issuedAt: new Date(), dueAt: null, paidAt: new Date() },
    ]);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]!.companyId).toBe("c1");
  });
});
