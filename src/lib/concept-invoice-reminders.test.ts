import { describe, expect, it } from "vitest";
import {
  planConceptInvoiceReminders,
  daysSince,
  type ConceptInvoiceCandidate,
} from "@/lib/concept-invoice-reminders";

const now = new Date("2026-05-29T12:00:00Z");

function cand(
  overrides: Partial<ConceptInvoiceCandidate> & Pick<ConceptInvoiceCandidate, "invoiceId">,
): ConceptInvoiceCandidate {
  return {
    lifecycleStatus: "DRAFT",
    createdAt: now,
    issuerUserId: "f1",
    partyInvoiceNumber: "2026-0001",
    ...overrides,
  };
}

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 86400000);
}

describe("daysSince", () => {
  it("telt hele dagen sinds aanmaak", () => {
    expect(daysSince(daysAgo(3), now)).toBe(3);
    expect(daysSince(now, now)).toBe(0);
  });
});

describe("planConceptInvoiceReminders", () => {
  it("herinnert op dag 3 en dag 7 (aan de ZZP'er)", () => {
    const plan = planConceptInvoiceReminders(
      [
        cand({ invoiceId: "i3", createdAt: daysAgo(3) }),
        cand({ invoiceId: "i7", createdAt: daysAgo(7) }),
      ],
      now,
    );
    expect(plan.reminders.map((r) => r.stage).sort()).toEqual(["day-3", "day-7"]);
    expect(plan.reminders.every((r) => r.userId === "f1")).toBe(true);
    expect(plan.escalations).toHaveLength(0);
  });

  it("herinnert niet op een tussenliggende dag", () => {
    const plan = planConceptInvoiceReminders(
      [cand({ invoiceId: "i5", createdAt: daysAgo(5) })],
      now,
    );
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });

  it("escaleert naar het platform na de laatste herinnering (>7 dagen)", () => {
    const plan = planConceptInvoiceReminders(
      [cand({ invoiceId: "iLate", createdAt: daysAgo(9) })],
      now,
    );
    expect(plan.escalations).toHaveLength(1);
    expect(plan.escalations[0]?.dedupeKey).toBe("concept-escalation-iLate");
    expect(plan.escalations[0]?.daysSince).toBe(9);
  });

  it("negeert facturen die al ingediend/verwerkt zijn", () => {
    const plan = planConceptInvoiceReminders(
      [
        cand({ invoiceId: "iSub", createdAt: daysAgo(7), lifecycleStatus: "SUBMITTED" }),
        cand({ invoiceId: "iPaid", createdAt: daysAgo(9), lifecycleStatus: "PAID" }),
      ],
      now,
    );
    expect(plan.reminders).toHaveLength(0);
    expect(plan.escalations).toHaveLength(0);
  });
});
