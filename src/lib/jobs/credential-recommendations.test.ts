import { describe, expect, it } from "vitest";
import { recommendedCredentialsForIndustry } from "./credential-recommendations";

describe("recommendedCredentialsForIndustry", () => {
  it("beveelt VOG/diploma/licentie aan voor de zorg", () => {
    const rec = recommendedCredentialsForIndustry("Zorg");
    expect(rec?.types).toEqual(["VOG", "DIPLOMA", "LICENSE"]);
    expect(rec?.reason).toMatch(/BIG-registratie/);
  });

  it("beveelt VOG/certificaat/verzekering aan voor de bouw", () => {
    expect(recommendedCredentialsForIndustry("Bouw")?.types).toEqual([
      "VOG",
      "CERTIFICATE",
      "INSURANCE",
    ]);
  });

  it("beveelt rijbewijs/verzekering/VOG aan voor logistiek", () => {
    expect(recommendedCredentialsForIndustry("Logistiek")?.types).toEqual([
      "LICENSE",
      "INSURANCE",
      "VOG",
    ]);
  });

  it("beveelt enkel een VOG aan voor ICT", () => {
    expect(recommendedCredentialsForIndustry("ICT")?.types).toEqual(["VOG"]);
  });

  it("matcht case-insensitief en op branchevarianten (substring)", () => {
    expect(recommendedCredentialsForIndustry("zorg & welzijn")?.types).toEqual([
      "VOG",
      "DIPLOMA",
      "LICENSE",
    ]);
    expect(recommendedCredentialsForIndustry("Bouw & Techniek")?.types).toEqual([
      "VOG",
      "CERTIFICATE",
      "INSURANCE",
    ]);
  });

  it("geeft null voor een lege of ontbrekende branche", () => {
    expect(recommendedCredentialsForIndustry("")).toBeNull();
    expect(recommendedCredentialsForIndustry(null)).toBeNull();
    expect(recommendedCredentialsForIndustry(undefined)).toBeNull();
  });

  it("geeft null voor een onbekende branche (geen vals-positieve hint)", () => {
    expect(recommendedCredentialsForIndustry("Horeca")).toBeNull();
    expect(recommendedCredentialsForIndustry("Marketing")).toBeNull();
  });

  it("laat de eerste passende regel winnen bij overlap", () => {
    // "zorgtechniek" bevat zowel "zorg" als "techniek"; de zorg-regel staat eerst.
    expect(recommendedCredentialsForIndustry("Zorgtechniek")?.types).toEqual([
      "VOG",
      "DIPLOMA",
      "LICENSE",
    ]);
  });
});
