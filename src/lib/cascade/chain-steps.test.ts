import { describe, expect, it } from "vitest";
import { buildChainSteps } from "@/lib/cascade/chain-steps";

// Helpers om invoer compact te schrijven
function col(
  status: string,
  performances: Array<{ status: string }> = [],
  invoices: Array<{ lifecycleStatus: string | null }> = [],
) {
  return { status, performances, invoices };
}

describe("buildChainSteps — stap 1 (Contract)", () => {
  it("PROPOSED → contract is active (wachten op ondertekening)", () => {
    const steps = buildChainSteps(col("PROPOSED"));
    const contract = steps[0]!;
    expect(contract.status).toBe("active");
    expect(contract.label).toBe("Contract");
    expect(contract.detail).toContain("ondertekening");
  });

  it("ACTIVE → contract is done", () => {
    const contract = buildChainSteps(col("ACTIVE"))[0]!;
    expect(contract.status).toBe("done");
    expect(contract.detail).toBe("Getekend");
  });

  it("COMPLETED → contract is done", () => {
    expect(buildChainSteps(col("COMPLETED"))[0]!.status).toBe("done");
  });

  it("CANCELLED → contract is done (contract was al ondertekend vóór annulering)", () => {
    // CANCELLED is niet "PROPOSED", dus contractDone = true → "done"
    const contract = buildChainSteps(col("CANCELLED"))[0]!;
    expect(contract.status).toBe("done");
  });
});

describe("buildChainSteps — stap 2 (Prestatie)", () => {
  it("PROPOSED (geen contract) → prestatie is waiting", () => {
    const perf = buildChainSteps(col("PROPOSED"))[1]!;
    expect(perf.status).toBe("waiting");
    expect(perf.detail).toContain("Volgt na contract");
  });

  it("ACTIVE zonder prestaties → prestatie is waiting met beschrijving", () => {
    const perf = buildChainSteps(col("ACTIVE"))[1]!;
    expect(perf.status).toBe("waiting");
    expect(perf.detail).toContain("Nog geen");
  });

  it("prestatie SUBMITTED → active", () => {
    const perf = buildChainSteps(col("ACTIVE", [{ status: "SUBMITTED" }]))[1]!;
    expect(perf.status).toBe("active");
    expect(perf.detail).toContain("goedkeuring");
  });

  it("prestatie APPROVED → done", () => {
    const perf = buildChainSteps(col("ACTIVE", [{ status: "APPROVED" }]))[1]!;
    expect(perf.status).toBe("done");
    expect(perf.detail).toBe("Goedgekeurd");
  });

  it("prestatie REJECTED → error", () => {
    const perf = buildChainSteps(col("ACTIVE", [{ status: "REJECTED" }]))[1]!;
    expect(perf.status).toBe("error");
    expect(perf.detail).toContain("Afgekeurd");
  });

  it("prestatie DRAFT (alleen concept) → active", () => {
    const perf = buildChainSteps(col("ACTIVE", [{ status: "DRAFT" }]))[1]!;
    expect(perf.status).toBe("active");
    expect(perf.detail).toContain("Concept");
  });

  it("APPROVED heeft hogere prioriteit dan REJECTED (beide aanwezig)", () => {
    const perf = buildChainSteps(
      col("ACTIVE", [{ status: "REJECTED" }, { status: "APPROVED" }]),
    )[1]!;
    expect(perf.status).toBe("done");
  });
});

describe("buildChainSteps — stap 3 (Factuur)", () => {
  it("geen facturen → wachten", () => {
    const inv = buildChainSteps(col("ACTIVE", [{ status: "APPROVED" }]))[2]!;
    expect(inv.status).toBe("waiting");
  });

  it("factuur DRAFT → active", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "DRAFT" }]))[2]!;
    expect(inv.status).toBe("active");
    expect(inv.detail).toContain("Concept");
  });

  it("factuur SUBMITTED → active", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "SUBMITTED" }]))[2]!;
    expect(inv.status).toBe("active");
    expect(inv.detail).toContain("goedkeuring");
  });

  it("factuur APPROVED → active (wachten op betaling)", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "APPROVED" }]))[2]!;
    expect(inv.status).toBe("active");
    expect(inv.detail).toContain("betaling");
  });

  it("factuur REJECTED → error", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "REJECTED" }]))[2]!;
    expect(inv.status).toBe("error");
  });

  it("factuur OVERDUE → error", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "OVERDUE" }]))[2]!;
    expect(inv.status).toBe("error");
    expect(inv.detail).toContain("laat");
  });

  it("factuur PAID → done", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "PAID" }]))[2]!;
    expect(inv.status).toBe("done");
    expect(inv.detail).toBe("Betaald");
  });

  it("factuur PROCESSED → done", () => {
    const inv = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "PROCESSED" }]))[2]!;
    expect(inv.status).toBe("done");
  });
});

describe("buildChainSteps — stap 4 (Betaling)", () => {
  it("geen factuur → wachten", () => {
    const pay = buildChainSteps(col("ACTIVE"))[3]!;
    expect(pay.status).toBe("waiting");
    expect(pay.detail).toContain("factuurgoedkeuring");
  });

  it("factuur APPROVED → betaling active", () => {
    const pay = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "APPROVED" }]))[3]!;
    expect(pay.status).toBe("active");
    expect(pay.detail).toContain("Wachten");
  });

  it("factuur PAID → betaling done", () => {
    const pay = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "PAID" }]))[3]!;
    expect(pay.status).toBe("done");
    expect(pay.detail).toBe("Ontvangen");
  });

  it("factuur PROCESSED → betaling done", () => {
    const pay = buildChainSteps(col("ACTIVE", [], [{ lifecycleStatus: "PROCESSED" }]))[3]!;
    expect(pay.status).toBe("done");
  });
});

describe("buildChainSteps — altijd 4 stappen", () => {
  it("geeft precies 4 stappen terug", () => {
    expect(buildChainSteps(col("PROPOSED"))).toHaveLength(4);
    expect(buildChainSteps(col("ACTIVE"))).toHaveLength(4);
    expect(buildChainSteps(col("CANCELLED"))).toHaveLength(4);
  });
});
