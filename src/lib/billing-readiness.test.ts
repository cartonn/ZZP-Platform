import { describe, it, expect } from "vitest";
import { assessBillingReadiness } from "./billing-readiness";

describe("assessBillingReadiness", () => {
  it("geen facturatie-activiteit → altijd ready, geen gaps (ook bij lege btw/iban)", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: false,
      hasVatChargingInvoice: false,
      btwNumber: null,
      iban: "",
    });
    expect(r.ready).toBe(true);
    expect(r.gaps).toEqual([]);
  });

  it("facturatie + btw-heffend + ontbrekend btw-id (null/leeg/whitespace/undefined) → btw-gap", () => {
    for (const btwNumber of [null, "", "   ", undefined]) {
      const r = assessBillingReadiness({
        hasIssuedInvoice: true,
        hasVatChargingInvoice: true,
        btwNumber,
        iban: "NL91ABNA0417164300",
      });
      expect(r.gaps.map((g) => g.key)).toContain("btw");
    }
  });

  it("facturatie + btw-heffend + btw-id aanwezig + ontbrekend iban → alleen iban-gap", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: true,
      btwNumber: "NL123456789B01",
      iban: null,
    });
    const keys = r.gaps.map((g) => g.key);
    expect(keys).toContain("iban");
    expect(keys).not.toContain("btw");
    expect(r.ready).toBe(false);
  });

  it("facturatie + btw-heffend + btw-id én iban aanwezig → ready, geen gaps", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: true,
      btwNumber: "NL123456789B01",
      iban: "NL91ABNA0417164300",
    });
    expect(r.ready).toBe(true);
    expect(r.gaps).toEqual([]);
  });

  it("facturatie zonder btw-heffing (KOR/EXEMPT) + ontbrekend btw-id + iban aanwezig → geen btw-gap, ready", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: false,
      btwNumber: null,
      iban: "NL91ABNA0417164300",
    });
    expect(r.gaps.map((g) => g.key)).not.toContain("btw");
    expect(r.ready).toBe(true);
  });

  it("facturatie zonder btw-heffing + btw-id én iban ontbreken → alleen iban-gap (iban regime-onafhankelijk)", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: false,
      btwNumber: null,
      iban: null,
    });
    const keys = r.gaps.map((g) => g.key);
    expect(keys).toContain("iban");
    expect(keys).not.toContain("btw");
  });

  it("facturatie + btw-heffend + beide ontbreken → beide gaps, btw vóór iban", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: true,
      btwNumber: null,
      iban: null,
    });
    expect(r.gaps.map((g) => g.key)).toEqual(["btw", "iban"]);
    expect(r.ready).toBe(false);
  });

  it("elke gap draagt niet-lege label en hint, met de verwachte key-waarden", () => {
    const r = assessBillingReadiness({
      hasIssuedInvoice: true,
      hasVatChargingInvoice: true,
      btwNumber: null,
      iban: null,
    });
    expect(r.gaps).toHaveLength(2);
    for (const gap of r.gaps) {
      expect(["btw", "iban"]).toContain(gap.key);
      expect(typeof gap.label).toBe("string");
      expect(gap.label.length).toBeGreaterThan(0);
      expect(typeof gap.hint).toBe("string");
      expect(gap.hint.length).toBeGreaterThan(0);
    }
  });
});
