import { describe, expect, it } from "vitest";
import {
  isInvoiceSettled,
  hasOpenCollaborationWork,
  type InvoiceStateSnapshot,
  type OpenWorkSnapshot,
} from "@/lib/cascade/completion";

// ─── isInvoiceSettled ────────────────────────────────────────────────────────

describe("isInvoiceSettled — cascade-facturen (lifecycleStatus gezet)", () => {
  it("PAID is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "PAID", status: "SUBMITTED" })).toBe(true);
  });
  it("PROCESSED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "PROCESSED", status: "SUBMITTED" })).toBe(true);
  });
  it("CREDITED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "CREDITED", status: "SUBMITTED" })).toBe(true);
  });
  it("DRAFT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "DRAFT", status: "DRAFT" })).toBe(false);
  });
  it("SUBMITTED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "SUBMITTED", status: "SUBMITTED" })).toBe(false);
  });
  it("APPROVED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "APPROVED", status: "APPROVED" })).toBe(false);
  });
  it("OVERDUE is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "OVERDUE", status: "OVERDUE" })).toBe(false);
  });
  it("REJECTED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "REJECTED", status: "REJECTED" })).toBe(false);
  });
});

describe("isInvoiceSettled — legacy-facturen (lifecycleStatus null)", () => {
  it("PAID is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "PAID" })).toBe(true);
  });
  it("CANCELLED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "CANCELLED" })).toBe(true);
  });
  it("SENT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "SENT" })).toBe(false);
  });
  it("DRAFT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "DRAFT" })).toBe(false);
  });
});

// ─── hasOpenCollaborationWork ────────────────────────────────────────────────

function snapshot(overrides: Partial<OpenWorkSnapshot> = {}): OpenWorkSnapshot {
  return { otherInvoices: [], submittedPerformances: 0, ...overrides };
}

function inv(status: string, lifecycleStatus: string | null = null): InvoiceStateSnapshot {
  return { lifecycleStatus, status };
}

describe("hasOpenCollaborationWork", () => {
  it("lege snapshot → geen openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot())).toBe(false);
  });

  it("één ingediende prestatie → openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot({ submittedPerformances: 1 }))).toBe(true);
  });

  it("meerdere ingediende prestaties → openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot({ submittedPerformances: 3 }))).toBe(true);
  });

  it("één niet-afgewikkelde factuur (APPROVED) → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(snapshot({ otherInvoices: [inv("APPROVED", "APPROVED")] })),
    ).toBe(true);
  });

  it("alleen afgewikkelde facturen + 0 prestaties → geen openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID"), inv("SUBMITTED", "PROCESSED")],
          submittedPerformances: 0,
        }),
      ),
    ).toBe(false);
  });

  it("gemengd: één settled + één open factuur → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID"), inv("SUBMITTED", "SUBMITTED")],
        }),
      ),
    ).toBe(true);
  });

  it("legacy-factuur CANCELLED + 0 prestaties → geen openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({ otherInvoices: [inv("CANCELLED", null)], submittedPerformances: 0 }),
      ),
    ).toBe(false);
  });

  it("legacy-factuur SENT + 0 prestaties → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({ otherInvoices: [inv("SENT", null)], submittedPerformances: 0 }),
      ),
    ).toBe(true);
  });

  it("prestaties én afgewikkelde facturen: prestaties geven de doorslag", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID")],
          submittedPerformances: 1,
        }),
      ),
    ).toBe(true);
  });
});
