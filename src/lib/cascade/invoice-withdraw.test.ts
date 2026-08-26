// Regressie voor het ACTIVE-deadlock-defect (persona-sweep): een nog-niet-aanvaarde factuur
// (DRAFT/SUBMITTED/REJECTED) zette de samenwerking permanent op ACTIVE vast — crediteren en "markeer
// betaald" waren onmogelijk vanuit die statussen en er bestond geen uitgang. `withdrawInvoice` +
// de WITHDRAWN-eindtoestand geven de uitschrijver (of admin) een terminale route die de indien-boeking
// terugdraait en de samenwerking weer afrondbaar/annuleerbaar maakt.

import { describe, it, expect } from "vitest";
import { invoiceLifecycleMachine } from "@/lib/lifecycles";
import {
  planInvoiceWithdrawn,
  summarizeByParty,
  planInvoiceSubmitted,
} from "@/lib/administration/ledger";
import { planInvoiceWithdrawnEvent } from "@/lib/cascade/handlers";
import {
  isInvoiceSettled,
  completionBlockReason,
  cancellationBlockReason,
} from "@/lib/cascade/completion";

const FIN = { subtotalCents: 600_00, vatCents: 126_00, totalCents: 726_00 };

describe("invoice-lifecycle: WITHDRAWN-overgangen", () => {
  it("staat intrekken toe vanuit DRAFT, SUBMITTED en REJECTED", () => {
    expect(() => invoiceLifecycleMachine.assert("DRAFT", "WITHDRAWN")).not.toThrow();
    expect(() => invoiceLifecycleMachine.assert("SUBMITTED", "WITHDRAWN")).not.toThrow();
    expect(() => invoiceLifecycleMachine.assert("REJECTED", "WITHDRAWN")).not.toThrow();
  });

  it("weigert intrekken vanuit een reeds aanvaarde/betaalde factuur (die gaat via crediteren)", () => {
    expect(() => invoiceLifecycleMachine.assert("APPROVED", "WITHDRAWN")).toThrow();
    expect(() => invoiceLifecycleMachine.assert("PAID", "WITHDRAWN")).toThrow();
    expect(() => invoiceLifecycleMachine.assert("CREDITED", "WITHDRAWN")).toThrow();
  });

  it("WITHDRAWN is terminaal — geen enkele vervolgovergang", () => {
    for (const to of ["DRAFT", "SUBMITTED", "APPROVED", "PAID", "CREDITED"] as const) {
      expect(() => invoiceLifecycleMachine.assert("WITHDRAWN", to)).toThrow();
    }
  });
});

describe("ledger: planInvoiceWithdrawn draait de indien-boeking netto naar nul", () => {
  it("intrekken + indienen samen = geen saldo bij de ZZP'er", () => {
    const net = summarizeByParty([
      ...planInvoiceSubmitted({ issuer: "FREELANCER", counterparty: "CLIENT", ...FIN }),
      ...planInvoiceWithdrawn({ issuer: "FREELANCER", counterparty: "CLIENT", ...FIN }),
    ]);
    expect(net.FREELANCER.DEBITEUREN ?? 0).toBe(0);
    expect(net.FREELANCER.OMZET ?? 0).toBe(0);
    expect(net.FREELANCER.BTW_AF_TE_DRAGEN ?? 0).toBe(0);
  });
});

describe("planInvoiceWithdrawnEvent", () => {
  it("een SUBMITTED-factuur: status → WITHDRAWN, indien-boeking teruggedraaid, notificatie naar de opdrachtgever", () => {
    const fx = planInvoiceWithdrawnEvent({
      invoice: { id: "i1", lifecycleStatus: "SUBMITTED", ...FIN },
      clientUserId: "c1",
      reason: "Toch niet doorgegaan",
      actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("WITHDRAWN");
    // Tegenboeking: debiteuren negatief bij de ZZP'er (spookvordering voorkomen).
    expect(
      fx.postings.some(
        (p) =>
          p.party === "FREELANCER" &&
          p.account === "DEBITEUREN" &&
          p.debitCents === -FIN.totalCents,
      ),
    ).toBe(true);
    expect(fx.notifications[0]?.userId).toBe("c1");
    expect(fx.audits[0]?.action).toBe("INVOICE_WITHDRAWN");
  });

  it("een REJECTED-factuur draait de indien-boeking net zo goed terug", () => {
    const fx = planInvoiceWithdrawnEvent({
      invoice: { id: "i1", lifecycleStatus: "REJECTED", ...FIN },
      clientUserId: "c1",
      reason: null,
      actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("WITHDRAWN");
    expect(fx.postings.length).toBeGreaterThan(0);
  });

  it("een DRAFT-factuur is nooit ingediend → geen boeking om terug te draaien", () => {
    const fx = planInvoiceWithdrawnEvent({
      invoice: { id: "i1", lifecycleStatus: "DRAFT", ...FIN },
      clientUserId: "c1",
      reason: null,
      actorId: "f1",
    });
    expect(fx.statusChanges[0]?.to).toBe("WITHDRAWN");
    expect(fx.postings.length).toBe(0);
  });
});

describe("completion: WITHDRAWN heft de deadlock op (REJECTED blijft blokkeren)", () => {
  it("een REJECTED-factuur telt als openstaand en blokkeert afronden én annuleren", () => {
    const snap = {
      otherInvoices: [{ lifecycleStatus: "REJECTED", status: "DRAFT" }],
      submittedPerformances: 0,
    };
    expect(isInvoiceSettled(snap.otherInvoices[0]!)).toBe(false);
    expect(completionBlockReason(snap)).not.toBeNull();
    expect(cancellationBlockReason(snap)).not.toBeNull();
    // De blok-reden noemt nu ook intrekken als route (was voorheen onuitvoerbaar voor REJECTED).
    expect(completionBlockReason(snap)).toContain("trek");
  });

  it("na intrekken (WITHDRAWN) is de factuur afgewikkeld en blokkeert ze niets meer", () => {
    const snap = {
      otherInvoices: [{ lifecycleStatus: "WITHDRAWN", status: "DRAFT" }],
      submittedPerformances: 0,
    };
    expect(isInvoiceSettled(snap.otherInvoices[0]!)).toBe(true);
    expect(completionBlockReason(snap)).toBeNull();
    expect(cancellationBlockReason(snap)).toBeNull();
  });
});
