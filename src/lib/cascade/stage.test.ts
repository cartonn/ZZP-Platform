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

    // Regressie (PERSONA-SWEEP run 41 MED): de rescue vuurde eerder alléén in de SUBMITTED-tak.
    // Bij een verse cyclus-2-prestatie die de ZZP'er nog moet indienen (null/DRAFT), corrigeren
    // (REJECTED) of waarvan hij de factuur nog moet opstellen (APPROVED), viel de openstaande
    // vorige-cyclus-betaal-/factuuractie stil weg uit het detail/dashboard terwijl /acties 'm toonde.
    // De rescue toont nu de verder-in-de-keten staande vorige-cyclus-actie in álle freelancer-fasen.
    it("APPROVED-factuur + nieuwere DRAFT-prestatie: ZZP'er blijft aan zet voor de betaling", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "DRAFT",
          latestInvoiceStatus: "APPROVED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("payment");
      expect(fr.youAreUp).toBe(true);
    });

    it("OVERDUE-factuur + geen nieuwe prestatie (null) + nieuwere-vlag: ZZP'er aan zet, attention", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: null,
          latestInvoiceStatus: "OVERDUE",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("payment");
      expect(fr.youAreUp).toBe(true);
      expect(fr.tone).toBe("attention");
    });

    it("APPROVED-factuur + nieuwere REJECTED-prestatie: betaling (verder in de keten) wint", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "REJECTED",
          latestInvoiceStatus: "APPROVED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("payment");
      expect(fr.youAreUp).toBe(true);
    });

    it("DRAFT-factuur + nieuwere REJECTED-prestatie: vorige factuur eerst indienen", () => {
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "REJECTED",
          latestInvoiceStatus: "DRAFT",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("invoice-submit");
      expect(fr.youAreUp).toBe(true);
    });

    it("SUBMITTED-factuur (wacht op opdrachtgever) + nieuwere DRAFT-prestatie: verse indien-fase", () => {
      // Vorige factuur SUBMITTED = geen ZZP-actie → rescue geeft null → de reguliere fase (verse
      // uren indienen) neemt over. Geen valse betaal-/factuuractie.
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "DRAFT",
          latestInvoiceStatus: "SUBMITTED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("performance-submit");
      expect(fr.youAreUp).toBe(true);
    });

    it("opdrachtgever krijgt nooit de vorige-cyclus-ZZP-actie (alleen zijn eigen fase)", () => {
      // CLIENT met een verse REJECTED-prestatie + open vorige-cyclus-factuur: de rescue is
      // freelancer-only, dus de opdrachtgever ziet ongewijzigd de afgekeurde-prestatie-fase.
      const cl = cascadeStage(
        base({
          viewer: "CLIENT",
          latestPerformanceStatus: "REJECTED",
          latestInvoiceStatus: "APPROVED",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(cl.id).toBe("performance-rejected");
      expect(cl.youAreUp).toBe(false);
    });

    it("PAID-factuur + nieuwere DRAFT-prestatie: geen valse rescue (verse uren indienen)", () => {
      // Terminale vorige factuur (PAID) → rescue geeft null → verse cyclus-2-uren indienen.
      const fr = cascadeStage(
        base({
          latestPerformanceStatus: "DRAFT",
          latestInvoiceStatus: "PAID",
          performanceNewerThanInvoice: true,
        }),
      );
      expect(fr.id).toBe("performance-submit");
      expect(fr.youAreUp).toBe(true);
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

  describe("afgekeurde prestatie gemaskeerd door een nieuwere — prior-prestatie-rescue", () => {
    // Regressie (PERSONA-SWEEP): op één ACTIVE-samenwerking mag de ZZP'er meerdere (niet-overlappende)
    // prestaties naast elkaar hebben. Wordt een oudere REJECTED-prestatie gemaskeerd door een nieuwere,
    // niet-afgekeurde prestatie in `latestPerformanceStatus`, dan verklaarde de statusregel de ZZP'er
    // ten onrechte "niets te doen — wacht op goedkeuring" terwijl /acties (`rejectedPerfWhere`) diezelfde
    // afgekeurde prestatie nog wél als taak toont. `hasRejectedPerformance` sluit dat gat.

    it("nieuwere SUBMITTED-prestatie + oudere REJECTED: ZZP'er blijft aan zet (corrigeren), niet 'wacht op goedkeuring'", () => {
      const fr = cascadeStage(
        base({ latestPerformanceStatus: "SUBMITTED", hasRejectedPerformance: true }),
      );
      expect(fr.id).toBe("performance-rejected");
      expect(fr.youAreUp).toBe(true);
      expect(fr.tone).toBe("attention");
      expect(fr.step).toBe(2);
    });

    it("nieuwere APPROVED-prestatie + oudere REJECTED: ZZP'er blijft aan zet (corrigeren)", () => {
      const fr = cascadeStage(
        base({ latestPerformanceStatus: "APPROVED", hasRejectedPerformance: true }),
      );
      expect(fr.id).toBe("performance-rejected");
      expect(fr.youAreUp).toBe(true);
    });

    it("opdrachtgever ziet de rescue niet — hij keurt gewoon de nieuwere prestatie", () => {
      const cl = cascadeStage(
        base({
          viewer: "CLIENT",
          latestPerformanceStatus: "SUBMITTED",
          hasRejectedPerformance: true,
        }),
      );
      expect(cl.id).toBe("performance-approve");
      expect(cl.youAreUp).toBe(true);
    });

    it("de afgekeurde prestatie is zélf de meest recente: ongewijzigd (bestaande REJECTED-tak)", () => {
      const fr = cascadeStage(
        base({ latestPerformanceStatus: "REJECTED", hasRejectedPerformance: true }),
      );
      expect(fr.id).toBe("performance-rejected");
      expect(fr.youAreUp).toBe(true);
    });

    it("geen afgekeurde prestatie: nieuwere SUBMITTED houdt de reguliere keur-fase (geen valse rescue)", () => {
      const fr = cascadeStage(
        base({ latestPerformanceStatus: "SUBMITTED", hasRejectedPerformance: false }),
      );
      expect(fr.id).toBe("performance-approve");
      expect(fr.youAreUp).toBe(false);
    });

    it("terminale/overschrijvende toestanden winnen van de rescue (afgerond blijft afgerond)", () => {
      const done = cascadeStage(
        base({
          collaborationStatus: "COMPLETED",
          latestPerformanceStatus: "APPROVED",
          hasRejectedPerformance: true,
        }),
      );
      expect(done.id).toBe("completed");
      const disputed = cascadeStage(
        base({
          disputed: true,
          latestPerformanceStatus: "SUBMITTED",
          hasRejectedPerformance: true,
        }),
      );
      expect(disputed.id).toBe("disputed");
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
