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
  planInvoiceRejectedEvent,
  planPaymentConfirmedEvent,
  planInvoiceCreditedEvent,
} from "@/lib/cascade/handlers";
import {
  assertBalanced,
  summarizeByParty,
  vatPosition,
  type Posting,
} from "@/lib/administration/ledger";
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
      if (sc.set?.contractStatus)
        state.collaboration.contractStatus = sc.set.contractStatus as string;
    } else if (sc.entity === "Performance") {
      state.performance.status = sc.to;
    } else if (sc.entity === "Invoice" && state.invoice) {
      state.invoice.lifecycleStatus = sc.to;
      if (sc.set?.partyInvoiceNumber)
        state.invoice.partyInvoiceNumber = sc.set.partyInvoiceNumber as string;
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
    apply(
      state,
      planContractSigned({
        collaborationId: "col1",
        status: state.collaboration.status as "PROPOSED",
        freelancerUserId: "f1",
        clientUserId: "c1",
        jobTitle: "Wijkverpleging",
        actorId: "c1",
      }),
    );
    expect(state.collaboration.status).toBe("ACTIVE");
    expect(state.collaboration.contractStatus).toBe("SIGNED");

    // Event B1 — urenstaat ingediend
    apply(
      state,
      planPerformanceSubmitted({
        performanceId: "p1",
        status: state.performance.status as "DRAFT",
        performanceType: "HOURS",
        collaborationId: "col1",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }),
    );
    expect(state.performance.status).toBe("SUBMITTED");

    // Event B2 — goedgekeurd -> concept-factuur
    const b2 = planPerformanceApproved({
      performance: {
        id: "p1",
        status: state.performance.status as "SUBMITTED",
        type: "HOURS",
        hours: 8,
        rateCents: 75_00,
        collaborationId: "col1",
      },
      freelancerUserId: "f1",
      clientUserId: "c1",
      issuerKey: "f1",
      vatRegime: "STANDARD_HIGH",
      correlationId: "corr1",
      now,
      actorId: "c1",
    });
    apply(state, b2);
    expect(state.performance.status).toBe("APPROVED");
    expect(b2.newInvoice).not.toBeNull();
    // De applier zou de factuur aanmaken; hier in de sim:
    state.invoice = { id: "i1", lifecycleStatus: "DRAFT", partyInvoiceNumber: null };
    const fin = b2.newInvoice!;

    // Event C — ZZP'er dient factuur in (nummer toegekend door allocator)
    apply(
      state,
      planInvoiceSubmittedEvent({
        invoice: {
          id: "i1",
          lifecycleStatus: "DRAFT",
          subtotalCents: fin.subtotalCents,
          vatCents: fin.vatCents,
          totalCents: fin.totalCents,
        },
        partyInvoiceNumber: "2026-0001",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }),
    );
    expect(state.invoice.lifecycleStatus).toBe("SUBMITTED");
    expect(state.invoice.partyInvoiceNumber).toBe("2026-0001");

    // Event D — opdrachtgever keurt factuur goed
    apply(
      state,
      planInvoiceApprovedEvent({
        invoice: {
          id: "i1",
          lifecycleStatus: "SUBMITTED",
          subtotalCents: fin.subtotalCents,
          vatCents: fin.vatCents,
          totalCents: fin.totalCents,
        },
        paymentTermDays: 30,
        freelancerUserId: "f1",
        now,
        actorId: "c1",
      }),
    );
    expect(state.invoice.lifecycleStatus).toBe("APPROVED");

    // Event E — betaling rechtstreeks + geregistreerd
    apply(
      state,
      planPaymentConfirmedEvent({
        invoice: {
          id: "i1",
          lifecycleStatus: "APPROVED",
          subtotalCents: fin.subtotalCents,
          vatCents: fin.vatCents,
          totalCents: fin.totalCents,
          partyInvoiceNumber: "2026-0001",
        },
        collaboration: { id: "col1", status: state.collaboration.status as "ACTIVE" },
        freelancerUserId: "f1",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }),
    );
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
      performance: {
        id: "p2",
        status: "SUBMITTED",
        type: "MILESTONE",
        amountCents: 5000_00,
        collaborationId: "col2",
      },
      freelancerUserId: "f1",
      clientUserId: "c1",
      issuerKey: "f1",
      vatRegime: "STANDARD_HIGH",
      correlationId: "corr2",
      now,
      actorId: "c1",
    });
    expect(b2.newInvoice).toMatchObject({
      subtotalCents: 5000_00,
      vatCents: 1050_00,
      totalCents: 6050_00,
    });
  });
});

describe("zijpad — afgekeurde prestatie opnieuw indienen", () => {
  it("REJECTED -> SUBMITTED -> APPROVED levert alsnog een concept-factuur", () => {
    // Afgekeurde urenstaat mag opnieuw worden ingediend (performanceMachine REJECTED->SUBMITTED).
    const resubmit = planPerformanceSubmitted({
      performanceId: "p1",
      status: "REJECTED",
      performanceType: "HOURS",
      collaborationId: "col1",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(resubmit.statusChanges[0]?.to).toBe("SUBMITTED");

    const approved = planPerformanceApproved({
      performance: {
        id: "p1",
        status: "SUBMITTED",
        type: "HOURS",
        hours: 4,
        rateCents: 75_00,
        collaborationId: "col1",
      },
      freelancerUserId: "f1",
      clientUserId: "c1",
      issuerKey: "f1",
      vatRegime: "STANDARD_HIGH",
      correlationId: "col1",
      now,
      actorId: "c1",
    });
    expect(approved.newInvoice).toMatchObject({
      subtotalCents: 300_00,
      vatCents: 63_00,
      totalCents: 363_00,
    });
  });

  it("een rejectie vereist een reden (B2')", () => {
    expect(() =>
      planPerformanceRejected({
        performanceId: "p1",
        status: "SUBMITTED",
        freelancerUserId: "f1",
        reason: "",
        now,
        actorId: "c1",
      }),
    ).toThrow(/reden/);
  });
});

describe("zijpad — creditfactuur maakt de administratie netto nul", () => {
  it("A->E gevolgd door creditering nuleert omzet, kosten en BTW", () => {
    const fin = { subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 };
    const postings: Posting[] = [
      ...planInvoiceSubmittedEvent({
        invoice: { id: "i1", lifecycleStatus: "DRAFT", ...fin },
        partyInvoiceNumber: "2026-0001",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }).postings,
      ...planInvoiceApprovedEvent({
        invoice: { id: "i1", lifecycleStatus: "SUBMITTED", ...fin },
        paymentTermDays: 30,
        freelancerUserId: "f1",
        now,
        actorId: "c1",
      }).postings,
      ...planPaymentConfirmedEvent({
        invoice: { id: "i1", lifecycleStatus: "APPROVED", ...fin, partyInvoiceNumber: "2026-0001" },
        collaboration: { id: "col1", status: "ACTIVE" },
        freelancerUserId: "f1",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }).postings,
      ...planInvoiceCreditedEvent({
        invoice: { id: "i1", lifecycleStatus: "PAID", ...fin, partyInvoiceNumber: "2026-0001" },
        freelancerUserId: "f1",
        clientUserId: "c1",
        reason: "Correctie",
        actorId: "f1",
      }).postings,
    ];
    const summary = summarizeByParty(postings);
    expect(summary.FREELANCER.OMZET).toBe(0);
    expect(summary.FREELANCER.BTW_AF_TE_DRAGEN).toBe(0);
    expect(summary.CLIENT.KOSTEN).toBe(0);
    expect(summary.CLIENT.BTW_VOORBELASTING).toBe(0);
    expect(vatPosition(postings).FREELANCER).toBe(0);
    // Crediteren van een al-betaalde factuur moet óók de betaal-tegenboekingen terugdraaien, anders
    // blijft er een spookvordering/-schuld + ONTVANGEN/BETAALD-saldo staan dat in de
    // debiteuren-/crediteurenoverzichten lekt.
    expect(summary.FREELANCER.DEBITEUREN ?? 0).toBe(0);
    expect(summary.FREELANCER.ONTVANGEN ?? 0).toBe(0);
    expect(summary.CLIENT.CREDITEUREN ?? 0).toBe(0);
    expect(summary.CLIENT.BETAALD ?? 0).toBe(0);
    // En elke partij blijft sluitend (debet = credit).
    assertBalanced(postings, "FREELANCER");
    assertBalanced(postings, "CLIENT");
  });

  it("crediteren vóór betaling (APPROVED) raakt geen betaalrekeningen", () => {
    const fin = { subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 };
    const postings: Posting[] = [
      ...planInvoiceSubmittedEvent({
        invoice: { id: "i2", lifecycleStatus: "DRAFT", ...fin },
        partyInvoiceNumber: "2026-0002",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }).postings,
      ...planInvoiceApprovedEvent({
        invoice: { id: "i2", lifecycleStatus: "SUBMITTED", ...fin },
        paymentTermDays: 30,
        freelancerUserId: "f1",
        now,
        actorId: "c1",
      }).postings,
      ...planInvoiceCreditedEvent({
        invoice: { id: "i2", lifecycleStatus: "APPROVED", ...fin, partyInvoiceNumber: "2026-0002" },
        freelancerUserId: "f1",
        clientUserId: "c1",
        reason: "Correctie vóór betaling",
        actorId: "f1",
      }).postings,
    ];
    const summary = summarizeByParty(postings);
    // Geen betaling geweest → geen ONTVANGEN/BETAALD, en alles netto nul.
    expect(summary.FREELANCER.ONTVANGEN ?? 0).toBe(0);
    expect(summary.CLIENT.BETAALD ?? 0).toBe(0);
    expect(summary.FREELANCER.DEBITEUREN ?? 0).toBe(0);
    expect(summary.CLIENT.CREDITEUREN ?? 0).toBe(0);
    expect(summary.FREELANCER.OMZET).toBe(0);
    expect(summary.CLIENT.KOSTEN).toBe(0);
    assertBalanced(postings, "FREELANCER");
    assertBalanced(postings, "CLIENT");
  });
});

describe("hoofdcascade A->E (ORT — zorg)", () => {
  it("ORT-subtotaal (basis + toeslag) stroomt correct door naar de factuur en administratie", () => {
    // 4 normale uren + 4 nachturen × €30/uur; nacht = +49% toeslag.
    // basis 4×30=120 + 4×30=120 = 240; toeslag 120×49%=58,80; subtotaal 298,80
    // BTW 21% → 62,75 (afgerond); totaal 361,55
    const b2 = planPerformanceApproved({
      performance: {
        id: "p-ort",
        status: "SUBMITTED",
        type: "HOURS",
        rateCents: 30_00,
        collaborationId: "col-ort",
        ortSegments: [
          { category: "NORMAL", hours: 4 },
          { category: "NIGHT", hours: 4 },
        ],
      },
      freelancerUserId: "f1",
      clientUserId: "c1",
      issuerKey: "f1",
      vatRegime: "STANDARD_HIGH",
      correlationId: "corr-ort",
      now,
      actorId: "c1",
    });

    // Subtotaal = 4×30 + (4×30 + 49% van 4×30) = 120 + 120 + 58,80 = 298,80
    expect(b2.newInvoice?.subtotalCents).toBe(298_80);
    expect(b2.newInvoice?.vatCents).toBe(62_75); // Math.round(298_80 × 21/100)
    expect(b2.newInvoice?.totalCents).toBe(361_55);

    // Factuur C→D→E met het ORT-subtotaal
    const fin = b2.newInvoice!;
    const postings = [
      ...planInvoiceSubmittedEvent({
        invoice: { id: "i-ort", lifecycleStatus: "DRAFT", ...fin },
        partyInvoiceNumber: "2026-0003",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }).postings,
      ...planInvoiceApprovedEvent({
        invoice: { id: "i-ort", lifecycleStatus: "SUBMITTED", ...fin },
        paymentTermDays: 14,
        freelancerUserId: "f1",
        now,
        actorId: "c1",
      }).postings,
      ...planPaymentConfirmedEvent({
        invoice: {
          id: "i-ort",
          lifecycleStatus: "APPROVED",
          ...fin,
          partyInvoiceNumber: "2026-0003",
        },
        collaboration: { id: "col-ort", status: "ACTIVE" },
        freelancerUserId: "f1",
        clientUserId: "c1",
        now,
        actorId: "f1",
      }).postings,
    ];

    const summary = summarizeByParty(postings);
    expect(summary.FREELANCER.DEBITEUREN).toBe(0);
    expect(summary.FREELANCER.OMZET).toBe(-298_80); // ORT-subtotaal gerealiseerd
    expect(summary.CLIENT.KOSTEN).toBe(298_80);
    expect(summary.CLIENT.CREDITEUREN).toBe(0);
    expect(Object.keys(summary.PLATFORM)).toHaveLength(0); // geen platformboeking (Besluit 1)
  });
});

describe("zijpad D' — factuur afgekeurd en opnieuw ingediend (Fase 7)", () => {
  it("REJECTED -> SUBMITTED -> APPROVED doorloopt correct met sluitende administratie", () => {
    const fin = { subtotalCents: 480_00, vatCents: 100_80, totalCents: 580_80 };

    // Factuur ingediend (C)
    const c = planInvoiceSubmittedEvent({
      invoice: { id: "i2", lifecycleStatus: "DRAFT", ...fin },
      partyInvoiceNumber: "2026-0002",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(c.statusChanges[0]?.to).toBe("SUBMITTED");

    // D' — factuur afgekeurd door opdrachtgever (reden verplicht)
    const dPrime = planInvoiceRejectedEvent({
      invoiceId: "i2",
      lifecycleStatus: "SUBMITTED",
      reason: "Onjuist uurtarief toegepast.",
      freelancerUserId: "f1",
      actorId: "c1",
    });
    expect(dPrime.statusChanges[0]?.to).toBe("REJECTED");
    // Geen boekingen bij afwijzing (nog niets gerealiseerd)
    expect(dPrime.postings).toHaveLength(0);

    // C opnieuw — ZZP'er dient na afkeuring opnieuw in (REJECTED→SUBMITTED). Het echte command-pad
    // zet resubmit:true en hergebruikt het bestaande nummer (geen nieuwe allocatie). Cruciaal: GEEN
    // nieuwe boekingen — de omzet/BTW is bij de eerste indiening al erkend en afkeuring boekte niet
    // terug, dus opnieuw boeken zou de administratie laten dubbeltellen.
    const cRetry = planInvoiceSubmittedEvent({
      invoice: { id: "i2", lifecycleStatus: "REJECTED", ...fin },
      partyInvoiceNumber: "2026-0002",
      clientUserId: "c1",
      now,
      actorId: "f1",
      resubmit: true,
    });
    expect(cRetry.statusChanges[0]?.to).toBe("SUBMITTED");
    expect(cRetry.statusChanges[0]?.set?.partyInvoiceNumber).toBe("2026-0002"); // nummer behouden
    expect(cRetry.postings).toHaveLength(0); // geen dubbele omzet/BTW-boeking

    // D — opdrachtgever keurt goed
    const d = planInvoiceApprovedEvent({
      invoice: { id: "i2", lifecycleStatus: "SUBMITTED", ...fin },
      paymentTermDays: 30,
      freelancerUserId: "f1",
      now,
      actorId: "c1",
    });
    expect(d.statusChanges[0]?.to).toBe("APPROVED");

    // E — betaling geregistreerd
    const e = planPaymentConfirmedEvent({
      invoice: { id: "i2", lifecycleStatus: "APPROVED", ...fin, partyInvoiceNumber: "2026-0002" },
      collaboration: { id: "col3", status: "ACTIVE" },
      freelancerUserId: "f1",
      clientUserId: "c1",
      now,
      actorId: "f1",
    });
    expect(e.statusChanges[0]?.to).toBe("PAID");

    // Administratie sluit: postings van C + (lege) C-retry + D + E. De heraanbieding voegt nu
    // expliciet niets toe (resubmit), dus de omzet/BTW telt precies één keer — ook al nemen we de
    // C-retry-postings hier wél mee.
    const allPostings = [...c.postings, ...cRetry.postings, ...d.postings, ...e.postings];
    const summary = summarizeByParty(allPostings);
    expect(summary.FREELANCER.DEBITEUREN).toBe(0);
    expect(summary.FREELANCER.OMZET).toBe(-480_00);
    expect(summary.CLIENT.CREDITEUREN).toBe(0);
    expect(summary.CLIENT.KOSTEN).toBe(480_00);
    expect(Object.keys(summary.PLATFORM)).toHaveLength(0);
  });

  it("planInvoiceRejectedEvent vereist een reden (D')", () => {
    expect(() =>
      planInvoiceRejectedEvent({
        invoiceId: "i2",
        lifecycleStatus: "SUBMITTED",
        reason: "",
        freelancerUserId: "f1",
        actorId: "c1",
      }),
    ).toThrow(/reden/);
  });
});
