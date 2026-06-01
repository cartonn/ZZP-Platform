import { describe, expect, it } from "vitest";
import { hasEntitlement, tierInfo, ENTITLEMENTS } from "@/lib/entitlements";

describe("hasEntitlement", () => {
  it("Gratis (FREE) ontsluit geen betaalde features", () => {
    for (const e of ENTITLEMENTS) {
      expect(hasEntitlement("FREE", e)).toBe(false);
    }
  });

  it("Zelf-doen (PRO) ontsluit administratie + IB-voorbereiding, niet Volledig Ontzorgd", () => {
    expect(hasEntitlement("PRO", "ADMINISTRATIE")).toBe(true);
    expect(hasEntitlement("PRO", "IB_VOORBEREIDING")).toBe(true);
    expect(hasEntitlement("PRO", "AUTO_REMINDERS")).toBe(true);
    expect(hasEntitlement("PRO", "VOLLEDIG_ONTZORGD")).toBe(false);
    expect(hasEntitlement("PRO", "PRIORITEIT_VERIFICATIE")).toBe(false);
  });

  it("Volledig Ontzorgd (BUSINESS) ontsluit alles", () => {
    expect(hasEntitlement("BUSINESS", "VOLLEDIG_ONTZORGD")).toBe(true);
    expect(hasEntitlement("BUSINESS", "PRIORITEIT_VERIFICATIE")).toBe(true);
    expect(hasEntitlement("BUSINESS", "ADMINISTRATIE")).toBe(true);
  });

  it("entitlements zijn cumulatief opklimmend (BUSINESS ⊇ PRO)", () => {
    for (const e of ENTITLEMENTS) {
      if (hasEntitlement("PRO", e)) expect(hasEntitlement("BUSINESS", e)).toBe(true);
    }
  });
});

describe("tierInfo", () => {
  it("toont waarde-namen i.p.v. technische keys, rolbewust", () => {
    expect(tierInfo("PRO", "FREELANCER").name).toBe("Zelf-doen");
    expect(tierInfo("BUSINESS", "FREELANCER").name).toBe("Volledig Ontzorgd");
    expect(tierInfo("PRO", "CLIENT").name).toBe("Zakelijk");
    expect(tierInfo("BUSINESS", "CLIENT").name).toBe("Inhuurdesk");
  });

  it("de middentier is gemarkeerd (center-stage)", () => {
    expect(tierInfo("PRO", "FREELANCER").highlighted).toBe(true);
    expect(tierInfo("FREE", "FREELANCER").highlighted).toBe(false);
    expect(tierInfo("BUSINESS", "FREELANCER").highlighted).toBe(false);
  });

  it("elke tier heeft features in mensentaal, zonder het woord AI", () => {
    for (const key of ["FREE", "PRO", "BUSINESS"] as const) {
      for (const role of ["FREELANCER", "CLIENT"] as const) {
        const info = tierInfo(key, role);
        expect(info.features.length).toBeGreaterThan(0);
        for (const f of info.features) {
          expect(f).not.toMatch(/\bAI\b/);
        }
      }
    }
  });
});
