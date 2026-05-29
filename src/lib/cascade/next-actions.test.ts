import { describe, expect, it } from "vitest";
import { cascadeFreelancerActions, cascadeClientActions } from "@/lib/cascade/next-actions";

describe("cascadeFreelancerActions", () => {
  it("geen acties bij nul tellingen", () => {
    expect(cascadeFreelancerActions({ draftInvoices: 0, approvedInvoices: 0 })).toEqual([]);
  });
  it("concept-factuur indienen + betaling markeren", () => {
    const a = cascadeFreelancerActions({ draftInvoices: 2, approvedInvoices: 1 });
    expect(a.map((x) => x.id)).toEqual(["cascade-draft-invoices", "cascade-approved-invoices"]);
    expect(a[0]?.title).toContain("2");
    expect(a[0]?.href).toBe("/facturen");
  });
});

describe("cascadeClientActions", () => {
  it("prestaties en facturen goedkeuren", () => {
    const a = cascadeClientActions({ performancesToApprove: 3, invoicesToApprove: 1 });
    expect(a.map((x) => x.id)).toEqual(["cascade-performances-approve", "cascade-invoices-approve"]);
    expect(a[0]?.tone).toBe("attention");
  });
  it("geen acties bij nul tellingen", () => {
    expect(cascadeClientActions({ performancesToApprove: 0, invoicesToApprove: 0 })).toEqual([]);
  });
});
