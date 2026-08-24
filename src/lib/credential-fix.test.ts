import { describe, expect, it } from "vitest";
import { actionableCredentialFixes, credentialFixHref } from "@/lib/credential-fix";
import { type CredentialType } from "@/lib/enums";

describe("credentialFixHref", () => {
  it("verwijst naar het uploadformulier met het type voorgeselecteerd", () => {
    expect(credentialFixHref("VOG")).toBe("/certificaten/nieuw?type=VOG");
    expect(credentialFixHref("INSURANCE")).toBe("/certificaten/nieuw?type=INSURANCE");
  });

  it("encodeert het type in de query", () => {
    // Alle CredentialType-waarden zijn nu URL-veilig; de encode is een vangnet tegen drift.
    const href = credentialFixHref("DIPLOMA" as CredentialType);
    expect(href.startsWith("/certificaten/nieuw?type=")).toBe(true);
    expect(href).not.toContain(" ");
  });
});

describe("actionableCredentialFixes", () => {
  it("geeft niets terug wanneer er niets op te lossen valt", () => {
    expect(actionableCredentialFixes({ missing: [], expired: [] })).toEqual([]);
  });

  it("zet ontbrekende types vóór verlopen types", () => {
    const fixes = actionableCredentialFixes({ missing: ["VOG"], expired: ["DIPLOMA"] });
    expect(fixes).toEqual([
      { type: "VOG", kind: "missing" },
      { type: "DIPLOMA", kind: "expired" },
    ]);
  });

  it("sorteert binnen elke groep deterministisch (alfabetisch op type)", () => {
    const fixes = actionableCredentialFixes({
      missing: ["VOG", "DIPLOMA"],
      expired: ["LICENSE", "INSURANCE"],
    });
    expect(fixes.map((f) => f.type)).toEqual(["DIPLOMA", "VOG", "INSURANCE", "LICENSE"]);
    expect(fixes.map((f) => f.kind)).toEqual(["missing", "missing", "expired", "expired"]);
  });

  it("negeert inReview volledig (die is geen actie)", () => {
    // De helper accepteert alleen missing/expired; een compliance met enkel inReview levert niets op.
    expect(actionableCredentialFixes({ missing: [], expired: [] })).toEqual([]);
  });

  it("dedupt op type wanneer een type onverhoopt in beide groepen zit (missing wint)", () => {
    const fixes = actionableCredentialFixes({ missing: ["VOG"], expired: ["VOG"] });
    expect(fixes).toEqual([{ type: "VOG", kind: "missing" }]);
  });

  it("muteert de invoer-arrays niet", () => {
    const missing: CredentialType[] = ["VOG", "DIPLOMA"];
    const expired: CredentialType[] = ["LICENSE"];
    actionableCredentialFixes({ missing, expired });
    expect(missing).toEqual(["VOG", "DIPLOMA"]);
    expect(expired).toEqual(["LICENSE"]);
  });
});
