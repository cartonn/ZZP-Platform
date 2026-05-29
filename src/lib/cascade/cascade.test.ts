// Integratietest: de volledige hoofdcascade A->E voor het uurtarief, gecomponeerd over de pure
// planners met een in-memory simulatie van de domeinstaat. Dekt het hele pad (Fase 3 DoD):
// contract -> uren indienen -> goedkeuren -> concept-factuur -> indienen -> goedkeuren ->
// betaling geregistreerd. Bewijst dat beide administraties kloppen en geen geld via het platform loopt.

import { describe, expect, it } from "vitest";
import {
  planContractSigned,
  planPerformanceSubmitted,
  planPerformanceApproved,
  planPerformanceRejected,
  planInvoiceSubmittedEvent,
  planInvoiceApprovedEvent,
  planPaymentConfirmedEvent,
  planInvoiceCreditedEvent,
} from "@/lib/cascade/handlers";
import { summarizeByParty, vatPosition, type Posting } from "@/lib/administration/ledger";
import { type CascadeEffects, type NotificationDraft } from "@/lib/cascade/types";

const now = new Date("2026-05-29T10:00:00Z");

// Minimal in-memory staat die de applier nabootst.
interface SimState {
  collaboration: { id: string; status: string; contractStatus: string };
  performance: { id: string; status: string };
  invoice: { id: string; lifecycleStatus: string; partyInvoiceNumber: string | null } | null;
  postings: Posting[];
  notifications: NotificationDraft[];
  auditActions: string[];
}

function apply(state: SimState, fx: CascadeEffects) {
  for (const sc of fx.statusChanges) {
    if (sc.entity === "Collaboration") {
      (state.collaboration as Record<string, unknown>)[sc.field] = sc.to;
      if (sc.set?.contractStatus) state.collaboration.contractStatus = sc.set.contractStatus as string;
    } else if (sc.entity === "Performance") {
      state.performance.status = sc.to;
    } else if (sc.entity === "Invoice" && state.invoice) {
      state.invoice.lifecycleStatus = sc.to;
      if (sc.set?.partyInvoiceNumber) state.invoice.partyInvoiceNumber = sc.set.partyInvoiceNumber as string;
    }
  }
  state.postings.push(...fx.postings);
  state.notifications.push(...fx.notifications);
  state.auditActions.push(...fx.audits.map((a) => a.action));
}

describe("hoofdcascade A->E (uurtarief)", () => {
  it("doorloopt de volledige keten met sluitende administratie bij beide partijen", () => {
    const state: SimState = {
      collaboration: { id: "col1", status: "PROPOSED", contractStatus: "SENT" },
      performance: { id: "p1", status: "DRAFT" },
      invoice: null,
      postings: [],
      notifications: [],
      auditActions: [],
    };

    // Event A — contract getekend
    apply(state, planContractSigned({
      collaborationId: "col1", status: state.collaboration.status as "PROPOSED",
      freelancerUserId: "f1", clientUserId: "c1", jobTitle: "Wijkverpleging", actorId: "c1",
    }));
    expect(state.collaboration.status).toBe("ACTIVE");
    expect(state.collaboration.contractStatus).toBe("SIGNED");

    // Event B1 — urenstaat ingediend
    apply(state, planPerformanceSubmitted({
      performanceId: "p1", status: state.performance.status as "DRAFT", performanceType: "HOURS",
      collaborationId: "col1", clientUserId: "c1", now, actorId: "f1",
    }));
    expect(state.performance.status).toBe("SUBMITTED");

    // Event B2 — goedgekeurd -> concept-factuur
    const b2 = planPerformanceApproved({
      performance: { id: "p1", status: state.performance.status as "SUBMITTED", type: "HOURS", hours: 8, rateCents: 75_00, collaborationId: "col1" },
      freelancerUserId: "f1", clientUserId: "c1", issuerKey: "f1", vatRegime: "STANDARD_HIGH", correlationId: "corr1", now, actorId: "c1",
    });
    apply(state, b2);
    expect(state.performance.status).toBe("APPROVED");
    expect(b2.newInvoice).not.toBeNull();
    // De applier zou de factuur aanmaken; hier in de sim:
    state.invoice = { id: "i1", lifecycleStatus: "DRAFT", partyInvoiceNumber: null };
    const fin = b2.newInvoice!;

    // Event C — ZZP'er dient factuur in (nummer toegekend door allocator)
    apply(state, planInvoiceSubmittedEvent({
      invoice: { id: "i1", lifecycleStatus: "DRAFT", subtotalCents: fin.subtotalCents, vatCents: fin.vatCents, totalCents: fin.totalCents },
      partyInvoiceNumber: "2026-0001", clientUserId: "c1", now, actorId: "f1",
    }));
    expect(state.invoice.lifecycleStatus).toBe("SUBMITTED");
    expect(state.invoice.partyInvoiceNumber).toBe("2026-0001");

    // Event D — opdrachtgever keurt factuur goed
    apply(state, planInvoiceApprovedEvent({
      invoice: { id: "i1", lifecycleStatus: "SUBMITTED", subtotalCents: fin.subtotalCents, vatCents: fin.vatCents, totalCents: fin.totalCents },
      paymentTermDays: 30, freelancerUserId: "f1", now, actorId: "c1",
    }));
    expect(state.invoice.lifecycleStatus).toBe("APPROVED");

    // Event E — betaling rechtstreeks + geregistreerd
    apply(state, planPaymentConfirmedEvent({
      invoice: { id: "i1", lifecycleStatus: "APPROVED", subtotalCents: fin.subtotalCents, vatCents: fin.vatCents, totalCents: fin.totalCents, partyInvoiceNumber: "2026-0001" },
      collaboration: { id: "col1", status: state.collaboration.status as "ACTIVE" },
      freelancerUserId: "f1", clientUserId: "c1", now, actorId: "f1",
    }));
    expect(state.invoice.lifecycleStatus).toBe("PAID");
    expect(state.collaboration.status).toBe("COMPLETED");

    // --- Administratie klopt over de hele keten ---
    const summary = summarizeByParty(state.postings);
    expect(summary.FREELANCER.DEBITEUREN).toBe(0); // vordering ontvangen
    expect(summary.FREELANCER.OMZET).toBe(-600_00); // omzet gerealiseerd
    expect(summary.CLIENT.CREDITEUREN).toBe(0); //  schuld voldaan
    expect(summary.CLIENT.KOSTEN).toBe(600_00);

    const vat = vatPosition(state.postings);
    expect(vat.FREELANCER).toBe(126_00); // af te dragen
    expect(vat.CLIENT).toBe(-126_00); //   terug te vorderen

    // Geen geld via het platform (Besluit 1).
    expect(Object.keys(summary.PLATFORM)).toHaveLength(0);

    // De juiste events zijn doorlopen.
    expect(state.auditActions).toEqual([
      "CONTRACT_SIGNED",
      "PERFORMANCE_SUBMITTED",
      "PERFORMANCE_APPROVED",
      "INVOICE_SUBMITTED",
      "INVOICE_APPROVED",
      "PAYMENT_CONFIRMED",
    ]);
  });

  it("milestone/fixed price doorloopt dezelfde keten met een vast bedrag", () => {
    const b2 = planPerformanceApproved({
      performance: { id: "p2", status: "SUBMITTED", type: "MILESTONE", amountCents: 5000_00, collaborationId: "col2" },
      freelancerUserId: "f1", clientUserId: "c1", issuerKey: "f1", vatRegime: "STANDARD_HIGH", correlationId: "corr2", now, actorId: "c1",
    });
    expect(b2.newInvoice).toMatchObject({ subtotalCents: 5000_00, vatCents: 1050_00, totalCents: 6050_00 });
  });
});

describe("zijpad — afgekeurde prestatie opnieuw indienen", () => {
  it("REJECTED -> SUBMITTED -> APPROVED levert alsnog een concept-factuur", () => {
    // Afgekeurde urenstaat mag opnieuw worden ingediend (performanceMachine REJECTED->SUBMITTED).
    const resubmit = planPerformanceSubmitted({
      performanceId: "p1", status: "REJECTED", performanceType: "HOURS",
      collaborationId: "col1", clientUserId: "c1", now, actorId: "f1",
    });
    expect(resubmit.statusChanges[0]?.to).toBe("SUBMITTED");

    const approved = planPerformanceApproved({
      performance: { id: "p1", status: "SUBMITTED", type: "HOURS", hours: 4, rateCents: 75_00, collaborationId: "col1" },
      freelancerUserId: "f1", clientUserId: "c1", issuerKey: "f1", vatRegime: "STANDARD_HIGH", correlationId: "col1", now, actorId: "c1",
    });
    expect(approved.newInvoice).toMatchObject({ subtotalCents: 300_00, vatCents: 63_00, totalCents: 363_00 });
  });

  it("een rejectie vereist een reden (B2')", () => {
    expect(() =>
      planPerformanceRejected({ performanceId: "p1", status: "SUBMITTED", freelancerUserId: "f1", reason: "", now, actorId: "c1" }),
    ).toThrow(/reden/);
  });
});

describe("zijpad — creditfactuur maakt de administratie netto nul", () => {
  it("A->E gevolgd door creditering nuleert omzet, kosten en BTW", () => {
    const fin = { subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 };
    const postings: Posting[] = [
      ...planInvoiceSubmittedEvent({ invoice: { id: "i1", lifecycleStatus: "DRAFT", ...fin }, partyInvoiceNumber: "2026-0001", clientUserId: "c1", now, actorId: "f1" }).postings,
      ...planInvoiceApprovedEvent({ invoice: { id: "i1", lifecycleStatus: "SUBMITTED", ...fin }, paymentTermDays: 30, freelancerUserId: "f1", now, actorId: "c1" }).postings,
      ...planPaymentConfirmedEvent({ invoice: { id: "i1", lifecycleStatus: "APPROVED", ...fin, partyInvoiceNumber: "2026-0001" }, collaboration: { id: "col1", status: "ACTIVE" }, freelancerUserId: "f1", clientUserId: "c1", now, actorId: "f1" }).postings,
      ...planInvoiceCreditedEvent({ invoice: { id: "i1", lifecycleStatus: "PAID", ...fin, partyInvoiceNumber: "2026-0001" }, freelancerUserId: "f1", clientUserId: "c1", reason: "Correctie", actorId: "f1" }).postings,
    ];
    const summary = summarizeByParty(postings);
    expect(summary.FREELANCER.OMZET).toBe(0);
    expect(summary.FREELANCER.BTW_AF_TE_DRAGEN).toBe(0);
    expect(summary.CLIENT.KOSTEN).toBe(0);
    expect(summary.CLIENT.BTW_VOORBELASTING).toBe(0);
    expect(vatPosition(postings).FREELANCER).toBe(0);
  });
});
