import { describe, it, expect } from "vitest";
import {
  planInvoiceApprovalReminders,
  daysSince,
  invoiceLabel,
  type InvoiceApprovalCandidate,
} from "@/lib/invoice-approval-reminders";

const NOW = new Date("2026-06-18T12:00:00.000Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function candidate(over: Partial<InvoiceApprovalCandidate> = {}): InvoiceApprovalCandidate {
  return {
    invoiceId: "inv-1",
    lifecycleStatus: "SUBMITTED",
    submittedAt: daysAgo(3),
    clientUserId: "client-1",
    collabStatus: "ACTIVE",
    disputed: false,
    partyInvoiceNumber: "2026-0007",
    ...over,
  };
}

describe("daysSince", () => {
  it("telt hele dagen sinds indienen", () => {
    expect(daysSince(daysAgo(0), NOW)).toBe(0);
    expect(daysSince(daysAgo(3), NOW)).toBe(3);
    expect(daysSince(daysAgo(10), NOW)).toBe(10);
  });
});

describe("invoiceLabel", () => {
  it("gebruikt het factuurnummer wanneer aanwezig, anders een neutrale term", () => {
    expect(invoiceLabel("2026-0007")).toBe("Factuur 2026-0007");
    expect(invoiceLabel(null)).toBe("Een ingediende factuur");
  });
});

describe("planInvoiceApprovalReminders", () => {
  it("herinnert de opdrachtgever op de geconfigureerde dagen (3 en 7)", () => {
    const day3 = planInvoiceApprovalReminders([candidate({ submittedAt: daysAgo(3) })], NOW);
    expect(day3.reminders).toHaveLength(1);
    const r3 = day3.reminders[0]!;
    expect(r3.userId).toBe("client-1");
    expect(r3.notificationType).toBe("INVOICE_APPROVAL_REMINDER");
    expect(r3.stage).toBe("day-3");
    expect(r3.dedupeKey).toBe("invoice-approval-reminder-inv-1-3");
    expect(r3.body).toContain("Factuur 2026-0007");

    const day7 = planInvoiceApprovalReminders([candidate({ submittedAt: daysAgo(7) })], NOW);
    expect(day7.reminders).toHaveLength(1);
    expect(day7.reminders[0]!.stage).toBe("day-7");
  });

  it("herinnert niet op een tussenliggende dag (geen dagelijks gezeur)", () => {
    for (const d of [1, 2, 4, 5, 6]) {
      const plan = planInvoiceApprovalReminders([candidate({ submittedAt: daysAgo(d) })], NOW);
      expect(plan.reminders, `dag ${d}`).toHaveLength(0);
    }
  });

  it("escaleert naar het platform ná de laatste herinnering (dag > 7)", () => {
    const plan = planInvoiceApprovalReminders([candidate({ submittedAt: daysAgo(8) })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(1);
    expect(plan.escalations[0]!.daysSince).toBe(8);
    expect(plan.escalations[0]!.dedupeKey).toBe("invoice-approval-escalation-inv-1");
  });

  it("escaleert niet precies op de escalatiedrempel (dag 7 is nog een herinnering)", () => {
    const plan = planInvoiceApprovalReminders([candidate({ submittedAt: daysAgo(7) })], NOW);
    expect(plan.escalations).toHaveLength(0);
  });

  it("negeert facturen die niet meer op goedkeuring wachten", () => {
    for (const lifecycleStatus of ["DRAFT", "APPROVED", "REJECTED", "PAID", "WITHDRAWN"]) {
      const plan = planInvoiceApprovalReminders(
        [candidate({ lifecycleStatus, submittedAt: daysAgo(3) })],
        NOW,
      );
      expect(plan.reminders, lifecycleStatus).toHaveLength(0);
    }
  });

  it("negeert een factuur zonder submittedAt", () => {
    const plan = planInvoiceApprovalReminders([candidate({ submittedAt: null })], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("nudget niet op een geannuleerde samenwerking", () => {
    const plan = planInvoiceApprovalReminders(
      [candidate({ collabStatus: "CANCELLED", submittedAt: daysAgo(3) })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(0);
  });

  it("nudget niet op een betwiste (bevroren) samenwerking", () => {
    const plan = planInvoiceApprovalReminders(
      [candidate({ disputed: true, submittedAt: daysAgo(8) })],
      NOW,
    );
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("muteert de invoer niet en verwerkt meerdere kandidaten", () => {
    const input = [
      candidate({ invoiceId: "i1", submittedAt: daysAgo(3) }),
      candidate({ invoiceId: "i2", submittedAt: daysAgo(8), clientUserId: "client-2" }),
      candidate({ invoiceId: "i3", submittedAt: daysAgo(1) }),
    ];
    const snapshot = JSON.stringify(input);
    const plan = planInvoiceApprovalReminders(input, NOW);
    expect(plan.reminders.map((r) => r.invoiceId)).toEqual(["i1"]);
    expect(plan.escalations.map((e) => e.invoiceId)).toEqual(["i2"]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
