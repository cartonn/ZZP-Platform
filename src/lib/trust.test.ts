import { describe, expect, it } from "vitest";
import { computeTrustLevel } from "@/lib/trust";

describe("computeTrustLevel", () => {
  it("BASIS zonder verificatie", () => {
    const r = computeTrustLevel({ identityVerified: false, verifiedCredentialCount: 0 });
    expect(r.level).toBe("BASIS");
    expect(r.reasons).toEqual([]);
    expect(r.missing).toHaveLength(2);
  });

  it("DEELS bij alleen identiteit", () => {
    const r = computeTrustLevel({ identityVerified: true, verifiedCredentialCount: 0 });
    expect(r.level).toBe("DEELS");
    expect(r.reasons).toContain("Identiteit geverifieerd");
    expect(r.missing).toContain("Laat minstens één certificaat verifiëren");
  });

  it("DEELS bij alleen een geverifieerd certificaat", () => {
    expect(computeTrustLevel({ identityVerified: false, verifiedCredentialCount: 2 }).level).toBe(
      "DEELS",
    );
  });

  it("VOLLEDIG bij identiteit én certificaat", () => {
    const r = computeTrustLevel({ identityVerified: true, verifiedCredentialCount: 1 });
    expect(r.level).toBe("VOLLEDIG");
    expect(r.label).toBe("Volledig geverifieerd");
    expect(r.missing).toEqual([]);
    expect(r.reasons).toContain("1 geverifieerd certificaat");
  });

  it("zakt naar DEELS als een verplicht document ontbreekt, ook met identiteit + certificaat", () => {
    const r = computeTrustLevel({
      identityVerified: true,
      verifiedCredentialCount: 1,
      mandatoryDocsComplete: false,
    });
    expect(r.level).toBe("DEELS");
    expect(r.missing).toContain("Lever je verplichte documenten aan (VOG en verzekering)");
  });

  it("blijft VOLLEDIG als de verplichte documenten compleet zijn", () => {
    expect(
      computeTrustLevel({
        identityVerified: true,
        verifiedCredentialCount: 1,
        mandatoryDocsComplete: true,
      }).level,
    ).toBe("VOLLEDIG");
  });
});
