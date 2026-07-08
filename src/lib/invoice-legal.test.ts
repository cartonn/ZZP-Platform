import { describe, expect, it } from "vitest";
import { assessInvoiceCompliance } from "./invoice-legal";

const complete = {
  invoiceNumber: "2026-0007",
  issuedAt: new Date("2026-07-08"),
  clientName: "LogiFlow Logistics",
  hasDescription: true,
  hasAmounts: true,
  vatRegime: "STANDARD_HIGH",
  issuerBtw: "NL123456789B01",
  issuerKvk: "12345678",
} as const;

describe("assessInvoiceCompliance", () => {
  it("volledig ingevulde factuur → complete, niets ontbreekt", () => {
    const r = assessInvoiceCompliance(complete);
    expect(r.level).toBe("complete");
    expect(r.missing).toHaveLength(0);
    expect(r.metCount).toBe(r.totalCount);
    expect(r.profileFixNeeded).toBe(false);
  });

  it("ontbrekend btw-id (btw-plichtig) → incomplete + profileFixNeeded", () => {
    const r = assessInvoiceCompliance({ ...complete, issuerBtw: null });
    expect(r.level).toBe("incomplete");
    expect(r.profileFixNeeded).toBe(true);
    const btw = r.requirements.find((x) => x.key === "btw");
    expect(btw?.met).toBe(false);
    expect(btw?.severity).toBe("required");
    expect(btw?.fixTarget).toBe("profile");
    expect(r.missing.map((m) => m.key)).toContain("btw");
  });

  it("lege btw-id (whitespace) telt als ontbrekend", () => {
    const r = assessInvoiceCompliance({ ...complete, issuerBtw: "   " });
    expect(r.requirements.find((x) => x.key === "btw")?.met).toBe(false);
  });

  it("vrijstelling (EXEMPT) → btw-id is aanbeveling, niet verplicht", () => {
    const r = assessInvoiceCompliance({ ...complete, vatRegime: "EXEMPT", issuerBtw: null });
    const btw = r.requirements.find((x) => x.key === "btw");
    expect(btw?.severity).toBe("recommended");
    // Alleen een aanbeveling ontbreekt → juridisch nog steeds "complete".
    expect(r.level).toBe("complete");
    // Maar er is wél een profielherstel mogelijk (btw-id + niet strikt nodig).
    expect(r.profileFixNeeded).toBe(true);
  });

  it("ontbrekend KvK is alleen een aanbeveling, blijft complete", () => {
    const r = assessInvoiceCompliance({ ...complete, issuerKvk: null });
    expect(r.level).toBe("complete");
    expect(r.profileFixNeeded).toBe(true);
    const kvk = r.requirements.find((x) => x.key === "kvk");
    expect(kvk?.severity).toBe("recommended");
    expect(kvk?.met).toBe(false);
  });

  it("concept zonder nummer/datum → beide required-punten ontbreken", () => {
    const r = assessInvoiceCompliance({
      ...complete,
      invoiceNumber: null,
      issuedAt: null,
    });
    expect(r.level).toBe("incomplete");
    const keys = r.missing.map((m) => m.key);
    expect(keys).toContain("number");
    expect(keys).toContain("issuedAt");
    // Deze twee zijn niet op het profiel te herstellen.
    expect(r.requirements.find((x) => x.key === "number")?.fixTarget).toBeNull();
  });

  it("lege string als factuurnummer telt als ontbrekend", () => {
    const r = assessInvoiceCompliance({ ...complete, invoiceNumber: "" });
    expect(r.requirements.find((x) => x.key === "number")?.met).toBe(false);
  });

  it("ontbrekende omschrijving en bedragen → incomplete", () => {
    const r = assessInvoiceCompliance({
      ...complete,
      hasDescription: false,
      hasAmounts: false,
    });
    expect(r.level).toBe("incomplete");
    const keys = r.missing.map((m) => m.key);
    expect(keys).toEqual(expect.arrayContaining(["description", "amounts"]));
  });

  it("behoudt een stabiele volgorde van requirements", () => {
    const r = assessInvoiceCompliance(complete);
    expect(r.requirements.map((x) => x.key)).toEqual([
      "number",
      "issuedAt",
      "clientName",
      "description",
      "amounts",
      "btw",
      "kvk",
    ]);
  });
});
