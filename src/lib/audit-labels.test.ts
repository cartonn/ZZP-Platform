import { describe, expect, it } from "vitest";
import { auditActionLabel } from "@/lib/audit-labels";

describe("auditActionLabel", () => {
  it("vertaalt een bekende actie naar een NL-label", () => {
    expect(auditActionLabel("PROFILE_UPDATED")).toBe("Profiel bijgewerkt");
    expect(auditActionLabel("CREDENTIAL_VERIFIED")).toBe("Certificaat geverifieerd");
  });

  it("valt voor een onbekende actie terug op een geleesbare vorm", () => {
    expect(auditActionLabel("SOME_NEW_ACTION")).toBe("Some new action");
  });

  it("verandert geen losse spaties of hoofdletters onnodig", () => {
    expect(auditActionLabel("X")).toBe("X");
  });
});
