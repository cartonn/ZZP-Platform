import { describe, expect, it } from "vitest";
import { cascadeStage, CASCADE_TOTAL_STEPS, type CascadeStageInput } from "@/lib/cascade/stage";

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
