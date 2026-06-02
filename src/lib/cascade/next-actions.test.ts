import { describe, expect, it } from "vitest";
import { cascadeFreelancerActions, cascadeClientActions } from "@/lib/cascade/next-actions";

const clearFreelancer = {
  draftInvoices: 0,
  approvedInvoices: 0,
  rejectedPerformances: 0,
  rejectedInvoices: 0,
};

describe("cascadeFreelancerActions", () => {
  it("geen acties bij nul tellingen", () => {
    expect(cascadeFreelancerActions(clearFreelancer)).toEqual([]);
  });
  it("concept-factuur indienen + betaling markeren", () => {
    const a = cascadeFreelancerActions({
      ...clearFreelancer,
      draftInvoices: 2,
      approvedInvoices: 1,
    });
    expect(a.map((x) => x.id)).toEqual(["cascade-draft-invoices", "cascade-approved-invoices"]);
    expect(a[0]?.title).toContain("2");
    expect(a[0]?.href).toBe("/facturen");
  });
  it("afgekeurde prestaties/facturen verschijnen en wegen zwaarder dan eigen indienen", () => {
    const a = cascadeFreelancerActions({
      draftInvoices: 1,
      approvedInvoices: 1,
      rejectedPerformances: 1,
      rejectedInvoices: 1,
    });
    // Ordening binnen de cascade: afkeur (62) > betaling (58) > indienen (55).
    const ranked = [...a].sort((x, y) => y.priority - x.priority).map((x) => x.id);
    expect(ranked.slice(0, 2)).toEqual([
      "cascade-rejected-performances",
      "cascade-rejected-invoices",
    ]);
    expect(ranked.indexOf("cascade-approved-invoices")).toBeLessThan(
      ranked.indexOf("cascade-draft-invoices"),
    );
  });
});

describe("cascadeClientActions", () => {
  it("prestaties en facturen goedkeuren", () => {
    const a = cascadeClientActions({ performancesToApprove: 3, invoicesToApprove: 1 });
    expect(a.map((x) => x.id)).toEqual([
      "cascade-performances-approve",
      "cascade-invoices-approve",
    ]);
    expect(a[0]?.tone).toBe("attention");
  });
  it("geen acties bij nul tellingen", () => {
    expect(cascadeClientActions({ performancesToApprove: 0, invoicesToApprove: 0 })).toEqual([]);
  });
});
