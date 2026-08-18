import { describe, expect, it } from "vitest";
import { buildFreelancerPayerBehavior, type PayerInvoiceRow } from "./freelancer-payer-behavior";

// Helper: bouw een betaalde-factuurrij. `issued`/`due`/`paid` als ISO-datum (of null).
function inv(
  companyId: string | null,
  companyName: string | null,
  issued: string | null,
  due: string | null,
  paid: string | null,
): PayerInvoiceRow {
  return {
    companyId,
    companyName,
    issuedAt: issued ? new Date(issued) : null,
    dueAt: due ? new Date(due) : null,
    paidAt: paid ? new Date(paid) : null,
  };
}

// Drie snel-betaalde facturen (≤14 dagen) → tone "good".
function goodClient(companyId: string, name: string): PayerInvoiceRow[] {
  return [
    inv(companyId, name, "2026-01-01", "2026-01-30", "2026-01-08"),
    inv(companyId, name, "2026-02-01", "2026-03-02", "2026-02-06"),
    inv(companyId, name, "2026-03-01", "2026-03-31", "2026-03-05"),
  ];
}

// Drie traag-betaalde facturen (>30 dagen, ver na vervaldatum) → tone "warning".
function slowClient(companyId: string, name: string): PayerInvoiceRow[] {
  return [
    inv(companyId, name, "2026-01-01", "2026-01-15", "2026-02-20"),
    inv(companyId, name, "2026-02-01", "2026-02-15", "2026-03-25"),
    inv(companyId, name, "2026-03-01", "2026-03-15", "2026-04-24"),
  ];
}

describe("buildFreelancerPayerBehavior", () => {
  it("returns an empty list without invoices", () => {
    expect(buildFreelancerPayerBehavior([])).toEqual([]);
  });

  it("ignores invoices without a known company", () => {
    const rows = buildFreelancerPayerBehavior([
      inv(null, null, "2026-01-01", "2026-01-30", "2026-01-08"),
      inv(null, null, "2026-02-01", "2026-02-28", "2026-02-06"),
      inv(null, null, "2026-03-01", "2026-03-30", "2026-03-06"),
    ]);
    expect(rows).toEqual([]);
  });

  it("drops companies below the minimum sample size (no meaningful signal)", () => {
    const rows = buildFreelancerPayerBehavior([
      inv("co1", "Zorg BV", "2026-01-01", "2026-01-30", "2026-01-08"),
      inv("co1", "Zorg BV", "2026-02-01", "2026-02-28", "2026-02-06"),
    ]);
    expect(rows).toEqual([]);
  });

  it("computes payment behaviour per company from the freelancer's own paid invoices", () => {
    const rows = buildFreelancerPayerBehavior(goodClient("co1", "Zorg BV"));
    expect(rows).toHaveLength(1);
    const zorg = rows[0];
    expect(zorg.companyId).toBe("co1");
    expect(zorg.name).toBe("Zorg BV");
    expect(zorg.behavior.sampleSize).toBe(3);
    expect(zorg.behavior.tone).toBe("good");
    expect(zorg.behavior.onTimePct).toBe(100);
    expect(zorg.behavior.avgDaysToPay).not.toBeNull();
  });

  it("sorts warning payers before good payers (worst first)", () => {
    const rows = buildFreelancerPayerBehavior([
      ...goodClient("co-good", "Snelle BV"),
      ...slowClient("co-slow", "Trage NV"),
    ]);
    expect(rows.map((r) => r.companyId)).toEqual(["co-slow", "co-good"]);
    expect(rows[0].behavior.tone).toBe("warning");
    expect(rows[1].behavior.tone).toBe("good");
  });

  it("does not leak individual invoice amounts (only aggregate stats)", () => {
    const rows = buildFreelancerPayerBehavior(goodClient("co1", "Zorg BV"));
    const keys = Object.keys(rows[0].behavior).sort();
    expect(keys).toEqual(["avgDaysToPay", "onTimePct", "sampleSize", "tone"]);
  });

  it("falls back to a placeholder name when the company name is missing", () => {
    const rows = buildFreelancerPayerBehavior([
      inv("co1", null, "2026-01-01", "2026-01-30", "2026-01-08"),
      inv("co1", null, "2026-02-01", "2026-02-28", "2026-02-06"),
      inv("co1", null, "2026-03-01", "2026-03-30", "2026-03-06"),
    ]);
    expect(rows[0].name).toBe("Onbekende opdrachtgever");
  });
});
