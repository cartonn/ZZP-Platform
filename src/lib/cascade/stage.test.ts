import { describe, expect, it } from "vitest";
import {
  cascadeStage,
  isPerformanceNewerThanInvoice,
  CASCADE_TOTAL_STEPS,
  type CascadeStageInput,
} from "@/lib/cascade/stage";

// Basis: getekend contract, niets ingediend (ACTIVE, niet betwist).
function base(overrides: Partial<CascadeStageInput> = {}): CascadeStageInput {
  return {
    viewer: "FREELANCER",
    collaborationId: "c1",
    collaborationStatus: "ACTIVE",
    contractStatus: "SIGNED",
    disputed: false,
    latestPerformanceStatus: null,
    latestInvoiceStatus: null,
    ...overrides,
  };
}

describe("cascadeStage — terminaal/overschrijvend", () => {
  it("geannuleerd", () => {
    const s = cascadeStage(base({ collaborationStatus: "CANCELLED" }));
    expect(s.id).toBe("cancelled");
    expect(s.youAreUp).toBe(false);
  });
  it("afgerond = succes op laatste stap", () => {
    const s = cascadeStage(base({ collaborationStatus: "COMPLETED" }));
    expect(s.id).toBe("completed");
    expect(s.step).toBe(CASCADE_TOTAL_STEPS);
    expect(s.tone).toBe("success");
  });
  it("dispuut bevriest — niemand aan zet, attention", () => {
    const s = cascadeStage(base({ disputed: true, latestPerformanceStatus: "SUBMITTED" }));
    expect(s.id).toBe("disputed");
    expect(s.youAreUp).toBe(false);
    expect(s.tone).toBe("attention");
  });
  it("betaald = succes (overschrijft eerdere fasen)", () => {
    const s = cascadeStage(
      base({ latestPerformanceStatus: "APPROVED", latestInvoiceStatus: "PAID" }),
    );
    expect(s.id).toBe("paid");
    expect(s.tone).toBe("success");
    expect(s.step).toBe(CASCADE_TOTAL_STEPS);
  });
  it("gecrediteerd = eindtoestand, niemand aan zet (geen betaal-signaal)", () => {
    // Regressie: een CREDITED-factuur viel eerder door naar de betaal-default en toonde ten onrechte
    // "Markeer de betaling" / "Wacht op betalingsbevestiging". Nu een terminale, neutrale fase.
    const fr = cascadeStage(
      base({ latestPerformanceStatus: "APPROVED", latestInvoiceStatus: "CREDITED" }),
    );
    const cl = cascadeStage(
      base({
        viewer: "CLIENT",
        latestPerformanceStatus: "APPROVED",
        latestInvoiceStatus: "CREDITED",
      }),
    );
    for (const s of [fr, cl]) {
      expect(s.id).toBe("credited");
      expect(s.youAreUp).toBe(false);
      expect(s.step).toBe(CASCADE_TOTAL_STEPS);
      expect(s.label).not.toMatch(/betaling/i);
    }
  });
});

describe("cascadeStage — keten + viewer-perspectief", () => {
  it("contract SENT: beide partijen aan zet", () => {
    const fr = cascadeStage(base({ contractStatus: "SENT" }));
    const cl = cascadeStage(base({ contractStatus: "SENT", viewer: "CLIENT" }));
    expect(fr.id).toBe("contract-sign");
    expect(fr.youAreUp).toBe(true);
    expect(cl.youAreUp).toBe(true);
    expect(fr.step).toBe(1);
    expect(fr.cta.href).toBe("/samenwerkingen/c1");
  });

  it("contract DRAFT (PROPOSED): beide partijen aan zet — meteen ondertekenbaar", () => {
    // Productie kent enkel DRAFT → SIGNED; een voorgestelde samenwerking is meteen ondertekenbaar
    // door beide partijen. De fase mag dus niet als passief "wordt voorbereid" tonen (dat verborg de
    // teken-CTA en sprak de actiecentrum-taak `contractSignTask` tegen).
    const fr = cascadeStage(base({ contractStatus: "DRAFT", collaborationStatus: "PROPOSED" }));
    const cl = cascadeStage(
      base({ contractStatus: "DRAFT", collaborationStatus: "PROPOSED", viewer: "CLIENT" }),
    );
    expect(fr.id).toBe("contract-sign");
    expect(fr.youAreUp).toBe(true);
    expect(cl.youAreUp).toBe(true);
    expect(fr.tone).toBe("attention");
    expect(fr.step).toBe(1);
    expect(fr.cta.label).toBe("Onderteken contract");
  });

  it("getekend, geen prestatie: ZZP'er dient in, opdrachtgever wacht", () => {
    const fr = cascadeStage(base());
    const cl = cascadeStage(base({ viewer: "CLIENT" }));
    expect(fr.id).toBe("performance-submit");
    expect(fr.youAreUp).toBe(true);
    expect(cl.youAreUp).toBe(false);
    expect(fr.step).toBe(2);
  });

  it("prestatie SUBMITTED: opdrachtgever aan zet (goedkeuren)", () => {
    const fr = cascadeStage(base({ latestPerformanceStatus: "SUBMITTED" }));
    const cl = cascadeStage(base({ latestPerformanceStatus: "SUBMITTED", viewer: "CLIENT" }));
    expect(cl.id).toBe("performance-approve");
    expect(cl.youAreUp).toBe(true);
    expect(fr.youAreUp).toBe(false);
    expect(cl.step).toBe(3);
  });

  it("prestatie REJECTED: ZZP'er aan zet, attention", () => {
    const s = cascadeStage(base({ latestPerformanceStatus: "REJECTED" }));
    expect(s.id).toBe("performance-rejected");
    expect(s.youAreUp).toBe(true);
    expect(s.tone).toBe("attention");
  });

  it("prestatie APPROVED, geen factuur: ZZP'er dient factuur in", () => {
    const fr = cascadeStage(base({ latestPerformanceStatus: "APPROVED" }));
    const cl = cascadeStage(base({ latestPerformanceStatus: "APPROVED", viewer: "CLIENT" }));
    expect(fr.id).toBe("invoice-submit");
    expect(fr.youAreUp).toBe(true);
    expect(cl.youAreUp).toBe(false);
    expect(fr.step).toBe(4);
  });

  it("factuur SUBMITTED: opdrachtgever keurt", () => {
    const cl = cascadeStage(
      base({
        latestPerformanceStatus: "APPROVED",
        latestInvoiceStatus: "SUBMITTED",
        viewer: "CLIENT",
      }),
    );
    expect(cl.id).toBe("invoice-approve");
    expect(cl.youAreUp).toBe(true);
    expect(cl.step).toBe(5);
  });

  it("factuur APPROVED: ZZP'er markeert betaling", () => {
    const fr = cascadeStage(
      base({ latestPerformanceStatus: "APPROVED", latestInvoiceStatus: "APPROVED" }),
    );
    expect(fr.id).toBe("payment");
    expect(fr.youAreUp).toBe(true);
    expect(fr.step).toBe(6);
  });

  it("factuur OVERDUE: betaalfase met attention-tone", () => {
    const fr = cascadeStage(
      base({ latestPerformanceStatus: "APPROVED", latestInvoiceStatus: "OVERDUE" }),
    );
    expect(fr.id).toBe("payment");
    expect(fr.tone).toBe("attention");
  });

  describe("multi-cyclus — betaalde vorige cyclus maskeert geen nieuwe uren", () => {
    // Regressie (PERSONA-SWEEP run 8 MEDIUM, run 9 gefixt): op één ACTIVE-samenwerking gate't
    // createPerformance alleen op ACTIVE, dus na een PAID-factuur (cyclus 1) kan de ZZP'er nieuwe
    // uren indienen (cyclus 2). Zonder `performanceNewerThanInvoice` toonde de fase "Factuur betaald
    // · niets te doen" terwijl de opdrachtgever de nieuwe uren moet goedkeuren.

    it("PAID-factuur + nieuwere SUBMITTED-prestatie: opdrachtgever moet keuren (geen betaald)", () => {
      const cl = cascadeStage(
        base({
          viewer: "CLIENT",
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "PAID",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(cl.id).toBe("performance-approve");
      expect(cl.youAreUp).toBe(true);
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "PAID",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("performance-approve");
      expect(fr.youAreUp).toBe(false);
    });

    it("PAID-factuur + nieuwere APPROVED-prestatie: ZZP'er dient nieuwe factuur in", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "APPROVED",
          latestInvoiceStatus: "PAID",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("invoice-submit");
      expect(fr.youAreUp).toBe(true);
    });

    it("PAID-factuur zonder nieuwere prestatie blijft terminaal betaald (single-cyclus)", () => {
      const s = cascadeStage(
        base({
          latestPerformanceStatus: "APPROVED",
          latestInvoiceStatus: "PAID",
          performanceNewerThanInvoice: false,
        }),
      );
      expect(s.id).toBe("paid");
      expect(s.tone).toBe("success");
    });

    // Regressie (PERSONA-SWEEP run 10): het spiegelbeeld van run 9. Een vorige-cyclus-factuur die nog
    // NIET terminaal is (APPROVED/OVERDUE = betaling markeren, DRAFT = factuur indienen, REJECTED =
    // corrigeren) draagt nog een openstaande ZZP-actie. Wordt die genuld door een nieuwere, door de
    // opdrachtgever te keuren prestatie (SUBMITTED), dan mag de fase de ZZP'er niet "niets te doen"
    // tonen terwijl het actiecentrum (pending-tasks) diezelfde taak toont — een zichzelf tegensprekend
    // scherm (live gereproduceerd tegen de draaiende app). De opdrachtgever ziet gewoon de keur-fase.
    it("APPROVED-factuur + nieuwere SUBMITTED-prestatie: ZZP'er blijft aan zet voor de betaling", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "APPROVED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("payment");
      expect(fr.youAreUp).toBe(true);
      // Opdrachtgever ziet ongewijzigd de goedkeur-fase (dat is diens actie).
      const cl = cascadeStage(
        base({
          viewer: "CLIENT",
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "APPROVED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(cl.id).toBe("performance-approve");
      expect(cl.youAreUp).toBe(true);
    });

    it("OVERDUE-factuur + nieuwere SUBMITTED-prestatie: ZZP'er aan zet, tone attention", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "OVERDUE",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("payment");
      expect(fr.youAreUp).toBe(true);
      expect(fr.tone).toBe("attention");
    });

    it("DRAFT-factuur + nieuwere SUBMITTED-prestatie: ZZP'er dient de vorige factuur nog in", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "DRAFT",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("invoice-submit");
      expect(fr.youAreUp).toBe(true);
    });

    it("REJECTED-factuur + nieuwere SUBMITTED-prestatie: ZZP'er corrigeert de vorige factuur", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "REJECTED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("invoice-rejected");
      expect(fr.youAreUp).toBe(true);
    });

    it("SUBMITTED-factuur (wacht op opdrachtgever) + nieuwere prestatie: geen valse ZZP-actie", () => {
      // Een vorige-cyclus-factuur die SUBMITTED is, wacht op de opdrachtgever — geen ZZP-actie. De
      // fase valt terug op de reguliere keur-fase (geen betaal-/indien-tak voor de ZZP'er).
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "SUBMITTED",
          latestInvoiceStatus: "SUBMITTED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("performance-approve");
      expect(fr.youAreUp).toBe(false);
    });

    it("isPerformanceNewerThanInvoice: strikt nieuwer, ontbrekende datum → false", () => {
      const oud = new Date("2026-01-01T00:00:00Z");
      const nieuw = new Date("2026-02-01T00:00:00Z");
      expect(isPerformanceNewerThanInvoice(nieuw, oud)).toBe(true);
      expect(isPerformanceNewerThanInvoice(oud, nieuw)).toBe(false);
      expect(isPerformanceNewerThanInvoice(oud, oud)).toBe(false);
      expect(isPerformanceNewerThanInvoice(null, oud)).toBe(false);
      expect(isPerformanceNewerThanInvoice(nieuw, null)).toBe(false);
      expect(isPerformanceNewerThanInvoice(null, null)).toBe(false);
    });
  });

  it("CTA verwijst altijd naar de samenwerking-detailpagina", () => {
    for (const o of [
      {},
      { contractStatus: "SENT" as const },
      { latestPerformanceStatus: "SUBMITTED" as const },
      { latestPerformanceStatus: "APPROVED" as const, latestInvoiceStatus: "APPROVED" as const },
    ]) {
      expect(cascadeStage(base(o)).cta.href).toBe("/samenwerkingen/c1");
    }
  });
});
