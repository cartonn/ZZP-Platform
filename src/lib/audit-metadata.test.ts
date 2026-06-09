import { describe, it, expect } from "vitest";
import { formatAuditMetadata } from "@/lib/audit-metadata";

describe("formatAuditMetadata", () => {
  it("toont centen-velden als euro met NL-label", () => {
    const s = formatAuditMetadata(
      JSON.stringify({ subtotalCents: 96000, vatCents: 20160, totalCents: 116160 }),
    );
    expect(s).toBe("Subtotaal € 960,00 · Btw € 201,60 · Totaal € 1.161,60");
  });

  it("labelt bekende sleutels en vertaalt status-waarden naar NL", () => {
    expect(formatAuditMetadata(JSON.stringify({ email: "a@b.nl", to: "PAID" }))).toBe(
      "E-mail: a@b.nl · Naar: Betaald",
    );
  });

  it("vertaalt from/to-statusovergangen volledig naar NL", () => {
    expect(formatAuditMetadata(JSON.stringify({ from: "SUBMITTED", to: "VERIFIED" }))).toBe(
      "Van: Ingediend · Naar: Geverifieerd",
    );
  });

  it("laat onbekende waarden ongewijzigd", () => {
    expect(formatAuditMetadata(JSON.stringify({ planKey: "GROEI", party: "FREELANCER" }))).toBe(
      "Plan: GROEI · Partij: FREELANCER",
    );
  });

  it("valt terug op de ruwe string bij ongeldige JSON en leeg bij niets", () => {
    expect(formatAuditMetadata("geen json")).toBe("geen json");
    expect(formatAuditMetadata(null)).toBe("");
    expect(formatAuditMetadata("")).toBe("");
  });

  it("slaat null-waarden over en humaniseert onbekende sleutels", () => {
    expect(formatAuditMetadata(JSON.stringify({ planKey: "GROEI", extraVeld: 3, weg: null }))).toBe(
      "Plan: GROEI · Extra veld: 3",
    );
  });
});
