import { describe, expect, it } from "vitest";
import {
  summarizeCredentialCompliance,
  credentialComplianceHeadline,
  type CredentialComplianceInput,
} from "./credential-compliance";

const item = (window: CredentialComplianceInput["window"]): CredentialComplianceInput => ({
  window,
});

describe("summarizeCredentialCompliance", () => {
  it("telt een leeg roster als volledig nul", () => {
    const s = summarizeCredentialCompliance([]);
    expect(s).toEqual({ total: 0, expired: 0, expiringSoon: 0, flagged: 0, clear: 0 });
  });

  it("partitioneert in verlopen / aflopend / op orde en telt op tot total", () => {
    const s = summarizeCredentialCompliance([
      item("EXPIRED"),
      item("EXPIRED"),
      item("WITHIN_30"),
      item("WITHIN_90"),
      item(null),
    ]);
    expect(s.expired).toBe(2);
    expect(s.expiringSoon).toBe(2);
    expect(s.clear).toBe(1);
    expect(s.flagged).toBe(4);
    expect(s.expired + s.expiringSoon + s.clear).toBe(s.total);
  });

  it("behandelt elk WITHIN_*-venster als aflopend, niet als verlopen", () => {
    const s = summarizeCredentialCompliance([
      item("WITHIN_30"),
      item("WITHIN_60"),
      item("WITHIN_90"),
    ]);
    expect(s.expired).toBe(0);
    expect(s.expiringSoon).toBe(3);
    expect(s.flagged).toBe(3);
  });
});

describe("credentialComplianceHeadline", () => {
  it("geeft null bij een leeg roster", () => {
    expect(credentialComplianceHeadline(summarizeCredentialCompliance([]))).toBeNull();
  });

  it("laat verlopen zwaarder wegen dan aflopend", () => {
    const s = summarizeCredentialCompliance([item("EXPIRED"), item("WITHIN_30")]);
    expect(credentialComplianceHeadline(s)).toContain("verlopen certificaat");
  });

  it("meldt aflopende certificaten wanneer er niets verlopen is", () => {
    const s = summarizeCredentialCompliance([item("WITHIN_30"), item("WITHIN_30")]);
    const headline = credentialComplianceHeadline(s);
    expect(headline).toContain("aflopend certificaat");
    expect(headline).toContain("2 vakmensen");
  });

  it("bevestigt dat alles op orde is wanneer niets aandacht vraagt", () => {
    const s = summarizeCredentialCompliance([item(null), item(null)]);
    expect(credentialComplianceHeadline(s)).toBe("Alle certificaten in je roster zijn op orde.");
  });

  it("gebruikt enkelvoud bij precies één verlopen vakmens", () => {
    const s = summarizeCredentialCompliance([item("EXPIRED"), item(null)]);
    expect(credentialComplianceHeadline(s)).toContain("1 vakmens ");
  });
});
