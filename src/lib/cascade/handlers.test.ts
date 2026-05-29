import { describe, expect, it } from "vitest";
import { StateTransitionError } from "@/lib/state-machine";
import { CollaborationTransitionError } from "@/lib/collaborations";
import {
  planContractSigned,
  planPerformanceSubmitted,
  planPerformanceApproved,
  planPerformanceRejected,
  planInvoiceSubmittedEvent,
  planInvoiceApprovedEvent,
  planInvoiceRejectedEvent,
  planPaymentConfirmedEvent,
  planInvoiceCreditedEvent,
  performanceSubtotalCents,
} from "@/lib/cascade/handlers";

const now = new Date("2026-05-29T10:00:00Z");

describe("Event A — planContractSigned", () => {
  it("zet de samenwerking op ACTIVE + contract SIGNED en notificeert beide partijen", () => {
    const fx = planContractSigned({
      collaborationId: "col1",
      status: "PROPOSED",
      freelancerUserId: "f1",
      clientUserId: "c1",
      jobTitle: "Wijkverpleging",
      actorId: "c1",
    });
    const sc = fx.statusChanges[0]!;
    expect(sc.to).toBe("ACTIVE");
    expect(sc.set?.contractStatus).toBe("SIGNED");
    expect(fx.notifications.map((n) => n.userId).sort()).toEqual(["c1", "f1"]);
    expect(fx.audits[0]?.action).toBe("CONTRACT_SIGNED");
  });

  it("weigert tekenen vanuit een eindstatus", () => {
    expect(() =>
      planContractSigned({
        collaborationId: "col1",
        status: "COMPLETED",
        freelancerUserId: "f1",
        clientUserId: "c1",
        jobTitle: "x",
        actorId: null,
      }),
    ).toThrowError(CollaborationTransitionError);
  });
});

describe("Event B1 — planPerformanceSubmitted", () => {
  it("DRAFT -> SUBMITTED met goedkeurtaak voor de opdrachtgever", () => {
    const fx = planPerformanceSubmitted({
      performanceId: "p1",
      status: "DRAFT",
      performanceType: "HOURS",
      collaborationId: "col1",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("SUBMITTED");
    expect(fx.statusChanges[0]?.set?.submittedAt).toBe(now);
    expect(fx.notifications[0]?.userId).toBe("c1");
  });

  it("weigert indienen vanuit APPROVED", () => {
    expect(() =>
      planPerformanceSubmitted({
        performanceId: "p1",
        status: "APPROVED",
        performanceType: "HOURS",
        collaborationId: "col1",
        clientUserId: "c1",
        now,
        actorId: null,
      }),
    ).toThrowError(StateTransitionError);
  });
});

describe("performanceSubtotalCents", () => {
  it("uurtarief: uren × tarief", () => {
    expect(performanceSubtotalCents({ id: "p", status: "SUBMITTED", type: "HOURS", hours: 8, rateCents: 75_00, collaborationId: "c" })).toBe(600_00);
  });
  it("milestone: vast bedrag", () => {
    expect(performanceSubtotalCents({ id: "p", status: "SUBMITTED", type: "MILESTONE", amountCents: 2500_00, collaborationId: "c" })).toBe(2500_00);
  });
  it("werpt als verplichte velden ontbreken", () => {
    expect(() => performanceSubtotalCents({ id: "p", status: "SUBMITTED", type: "HOURS", collaborationId: "c" })).toThrow();
    expect(() => performanceSubtotalCents({ id: "p", status: "SUBMITTED", type: "MILESTONE", collaborationId: "c" })).toThrow();
  });
});

describe("Event B2 — planPerformanceApproved", () => {
  it("genereert een concept-factuur met correcte BTW en notificeert de ZZP'er", () => {
    const fx = planPerformanceApproved({
      performance: { id: "p1", status: "SUBMITTED", type: "HOURS", hours: 8, rateCents: 75_00, collaborationId: "col1" },
      freelancerUserId: "f1",
      clientUserId: "c1",
      issuerKey: "f1",
      vatRegime: "STANDARD_HIGH",
      correlationId: "corr1",
      now,
      actorId: "c1",
    });
    expect(fx.statusChanges[0]?.to).toBe("APPROVED");
    expect(fx.newInvoice).toMatchObject({
      subtotalCents: 600_00,
      vatCents: 126_00,
      totalCents: 726_00,
      issuerUserId: "f1",
      counterpartyUserId: "c1",
      correlationId: "corr1",
    });
    expect(fx.notifications[0]?.userId).toBe("f1");
    expect(fx.postings).toHaveLength(0); // boeking pas bij indienen (Event C)
  });
});

describe("zijpaden B2' en D' vereisen een reden", () => {
  it("planPerformanceRejected zonder reden werpt", () => {
    expect(() =>
      planPerformanceRejected({ performanceId: "p1", status: "SUBMITTED", freelancerUserId: "f1", reason: "  ", now, actorId: "c1" }),
    ).toThrow(/reden/);
  });
  it("planPerformanceRejected zet REJECTED met reden", () => {
    const fx = planPerformanceRejected({ performanceId: "p1", status: "SUBMITTED", freelancerUserId: "f1", reason: "Uren kloppen niet", now, actorId: "c1" });
    expect(fx.statusChanges[0]?.to).toBe("REJECTED");
    expect(fx.statusChanges[0]?.set?.rejectionReason).toBe("Uren kloppen niet");
  });
  it("planInvoiceRejectedEvent zonder reden werpt", () => {
    expect(() =>
      planInvoiceRejectedEvent({ invoiceId: "i1", lifecycleStatus: "SUBMITTED", freelancerUserId: "f1", reason: "", actorId: "c1" }),
    ).toThrow(/reden/);
  });
});

describe("Event C — planInvoiceSubmittedEvent", () => {
  it("kent het partij-nummer toe en boekt de debiteurenpost", () => {
    const fx = planInvoiceSubmittedEvent({
      invoice: { id: "i1", lifecycleStatus: "DRAFT", subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 },
      partyInvoiceNumber: "2026-0001",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("SUBMITTED");
    expect(fx.statusChanges[0]?.set?.partyInvoiceNumber).toBe("2026-0001");
    expect(fx.postings.some((p) => p.party === "FREELANCER" && p.account === "DEBITEUREN")).toBe(true);
    expect(fx.notifications[0]?.userId).toBe("c1");
  });
});

describe("Event D — planInvoiceApprovedEvent", () => {
  it("zet de vervaldatum en boekt crediteuren/voorbelasting bij de opdrachtgever", () => {
    const fx = planInvoiceApprovedEvent({
      invoice: { id: "i1", lifecycleStatus: "SUBMITTED", subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 },
      paymentTermDays: 30,
      freelancerUserId: "f1",
      now,
      actorId: "c1",
    });
    expect(fx.statusChanges[0]?.to).toBe("APPROVED");
    const due = fx.statusChanges[0]?.set?.dueAt as Date;
    expect(due.getTime()).toBe(new Date("2026-06-28T10:00:00Z").getTime());
    expect(fx.postings.some((p) => p.party === "CLIENT" && p.account === "CREDITEUREN")).toBe(true);
    expect(fx.notifications[0]?.userId).toBe("f1");
  });
});

describe("Zijpad — planInvoiceCreditedEvent", () => {
  it("crediteert met reden: status CREDITED + tegenboekingen (negatief)", () => {
    const fx = planInvoiceCreditedEvent({
      invoice: { id: "i1", lifecycleStatus: "PAID", subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00, partyInvoiceNumber: "2026-0001" },
      freelancerUserId: "f1", clientUserId: "c1", reason: "Verkeerd bedrag", actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("CREDITED");
    // Tegenboeking: debiteuren negatief bij de ZZP'er.
    expect(fx.postings.some((p) => p.party === "FREELANCER" && p.account === "DEBITEUREN" && p.debitCents < 0)).toBe(true);
    expect(fx.notifications.map((n) => n.userId).sort()).toEqual(["c1", "f1"]);
  });
  it("weigert crediteren zonder reden", () => {
    expect(() =>
      planInvoiceCreditedEvent({ invoice: { id: "i1", lifecycleStatus: "PAID", subtotalCents: 1, vatCents: 0, totalCents: 1, partyInvoiceNumber: null }, freelancerUserId: "f1", clientUserId: "c1", reason: " ", actorId: "f1" }),
    ).toThrow(/reden/);
  });
});

describe("Event E — planPaymentConfirmedEvent", () => {
  it("registreert betaald, rondt de samenwerking af, boekt af en notificeert beide partijen", () => {
    const fx = planPaymentConfirmedEvent({
      invoice: { id: "i1", lifecycleStatus: "APPROVED", subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00, partyInvoiceNumber: "2026-0001" },
      collaboration: { id: "col1", status: "ACTIVE" },
      freelancerUserId: "f1",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(fx.statusChanges.find((s) => s.entity === "Invoice")?.to).toBe("PAID");
    expect(fx.statusChanges.find((s) => s.entity === "Collaboration")?.to).toBe("COMPLETED");
    expect(fx.notifications.map((n) => n.userId).sort()).toEqual(["c1", "f1"]);
    // Default: fee UIT → geen vervolg-events.
    expect(fx.followups).toHaveLength(0);
  });
});
