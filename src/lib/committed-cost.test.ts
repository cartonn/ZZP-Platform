import { describe, expect, it } from "vitest";
import { summarizeCommittedCost, type CommittedCostRow } from "@/lib/committed-cost";

/** Bouwsteen: een niet-disputed rij met opgegeven (lifecycle)status en bedrag. */
function row(partial: Partial<CommittedCostRow>): CommittedCostRow {
  return {
    lifecycleStatus: null,
    status: "DRAFT",
    totalCents: 0,
    disputed: false,
    ...partial,
  };
}

describe("summarizeCommittedCost", () => {
  it("geeft null zonder concept-facturen", () => {
    expect(summarizeCommittedCost([])).toBeNull();
    expect(
      summarizeCommittedCost([
        row({ lifecycleStatus: "SUBMITTED", totalCents: 5000 }),
        row({ lifecycleStatus: "PAID", totalCents: 5000 }),
      ]),
    ).toBeNull();
  });

  it("telt cascade-DRAFT (lifecycleStatus) én losse legacy-DRAFT (status) mee", () => {
    const summary = summarizeCommittedCost([
      row({ lifecycleStatus: "DRAFT", totalCents: 12100 }),
      row({ lifecycleStatus: null, status: "DRAFT", totalCents: 4840 }),
    ]);
    expect(summary).toEqual({ count: 2, grossCents: 16940 });
  });

  it("negeert openstaande, betaalde en afgehandelde facturen (geen dubbeltelling met payables)", () => {
    const summary = summarizeCommittedCost([
      row({ lifecycleStatus: "DRAFT", totalCents: 10000 }),
      row({ lifecycleStatus: "SUBMITTED", totalCents: 20000 }), // openstaand
      row({ lifecycleStatus: "OVERDUE", totalCents: 30000 }), // openstaand
      row({ lifecycleStatus: "PAID", totalCents: 40000 }), // betaald
      row({ lifecycleStatus: "REJECTED", totalCents: 50000 }), // afgehandeld
      row({ lifecycleStatus: null, status: "PAID", totalCents: 60000 }), // legacy betaald
    ]);
    expect(summary).toEqual({ count: 1, grossCents: 10000 });
  });

  it("slaat concepten op een bevroren (disputed) samenwerking over", () => {
    const summary = summarizeCommittedCost([
      row({ lifecycleStatus: "DRAFT", totalCents: 10000, disputed: true }),
      row({ lifecycleStatus: "DRAFT", totalCents: 7500, disputed: false }),
    ]);
    expect(summary).toEqual({ count: 1, grossCents: 7500 });
  });

  it("geeft null wanneer het enige concept bevroren is", () => {
    expect(
      summarizeCommittedCost([row({ lifecycleStatus: "DRAFT", totalCents: 9999, disputed: true })]),
    ).toBeNull();
  });
});
