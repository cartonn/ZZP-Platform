import { describe, expect, it } from "vitest";
import { summarizeCredentialGap, hasCredentialGap } from "./suggestion-credential-gap";

describe("summarizeCredentialGap", () => {
  it("vertaalt types naar Nederlandse labels, gescheiden per categorie", () => {
    const out = summarizeCredentialGap(["VOG"], ["LICENSE", "DIPLOMA"]);
    expect(out.expired).toEqual(["VOG"]);
    expect(out.missing).toEqual(["Licentie", "Diploma"]);
  });

  it("behoudt de invoervolgorde en dedupt per categorie", () => {
    const out = summarizeCredentialGap([], ["VOG", "VOG", "INSURANCE"]);
    expect(out.missing).toEqual(["VOG", "Verzekering"]);
  });

  it("geeft lege lijsten als er niets ontbreekt of verlopen is", () => {
    const out = summarizeCredentialGap([], []);
    expect(out).toEqual({ expired: [], missing: [] });
  });
});

describe("hasCredentialGap", () => {
  it("is false zonder gaten", () => {
    expect(hasCredentialGap({ expired: [], missing: [] })).toBe(false);
  });

  it("is true bij een verlopen certificaat", () => {
    expect(hasCredentialGap({ expired: ["VOG"], missing: [] })).toBe(true);
  });

  it("is true bij een ontbrekend certificaat", () => {
    expect(hasCredentialGap({ expired: [], missing: ["Diploma"] })).toBe(true);
  });
});
