import { describe, it, expect } from "vitest";
import { summarizeDiensten, hasDienstenSummary } from "@/lib/diensten-summary";
import { type DienstSummary } from "@/lib/diensten";

function dienst(overrides: Partial<DienstSummary>): DienstSummary {
  return {
    id: "d-1",
    collaborationId: "col-1",
    jobTitle: "Nachtdienst VVT",
    companyName: "Zorg BV",
    type: "HOURS",
    status: "SUBMITTED",
    periodStart: new Date("2026-01-01"),
    periodEnd: new Date("2026-01-07"),
    hours: 20,
    subtotalCents: 100_00,
    hasOrt: false,
    description: "",
    submittedAt: new Date("2026-01-08"),
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    ...overrides,
  };
}

describe("summarizeDiensten", () => {
  it("telt de wachtende (SUBMITTED) waarde op en scheidt goedgekeurd/concept/afgekeurd", () => {
    const res = summarizeDiensten([
      dienst({ status: "SUBMITTED", subtotalCents: 100_00 }),
      dienst({ status: "SUBMITTED", subtotalCents: 250_00 }),
      dienst({ status: "APPROVED", subtotalCents: 500_00 }),
      dienst({ status: "APPROVED", subtotalCents: 100_00 }),
      dienst({ status: "DRAFT", subtotalCents: null }),
      dienst({ status: "REJECTED", subtotalCents: 42_00 }),
    ]);

    expect(res.awaitingApprovalCents).toBe(350_00);
    expect(res.awaitingApprovalCount).toBe(2);
    expect(res.awaitingWithoutAmount).toBe(0);
    expect(res.approvedCents).toBe(600_00);
    expect(res.approvedCount).toBe(2);
    expect(res.draftCount).toBe(1);
    expect(res.rejectedCount).toBe(1);
  });

  it("telt een wachtende urenstaat zonder subtotaal wel in de telling maar niet in het bedrag", () => {
    const res = summarizeDiensten([
      dienst({ status: "SUBMITTED", subtotalCents: 80_00 }),
      dienst({ status: "SUBMITTED", subtotalCents: null }),
    ]);

    expect(res.awaitingApprovalCents).toBe(80_00);
    expect(res.awaitingApprovalCount).toBe(2);
    expect(res.awaitingWithoutAmount).toBe(1);
  });

  it("negeert een goedgekeurde urenstaat zonder subtotaal in het bedrag maar telt hem wel", () => {
    const res = summarizeDiensten([dienst({ status: "APPROVED", subtotalCents: null })]);
    expect(res.approvedCents).toBe(0);
    expect(res.approvedCount).toBe(1);
  });

  it("geeft een lege samenvatting terug voor geen rijen", () => {
    const res = summarizeDiensten([]);
    expect(res).toEqual({
      awaitingApprovalCents: 0,
      awaitingApprovalCount: 0,
      awaitingWithoutAmount: 0,
      approvedCents: 0,
      approvedCount: 0,
      draftCount: 0,
      rejectedCount: 0,
    });
  });

  it("negeert onbekende statussen", () => {
    const res = summarizeDiensten([dienst({ status: "WEIRD_STATUS", subtotalCents: 999_00 })]);
    expect(res.awaitingApprovalCount).toBe(0);
    expect(res.approvedCount).toBe(0);
    expect(res.draftCount).toBe(0);
    expect(res.rejectedCount).toBe(0);
  });
});

describe("hasDienstenSummary", () => {
  it("is waar zodra er ten minste één urenstaat in een getelde status staat", () => {
    expect(hasDienstenSummary(summarizeDiensten([dienst({ status: "DRAFT" })]))).toBe(true);
    expect(hasDienstenSummary(summarizeDiensten([dienst({ status: "SUBMITTED" })]))).toBe(true);
  });

  it("is onwaar voor een lege lijst", () => {
    expect(hasDienstenSummary(summarizeDiensten([]))).toBe(false);
  });
});
