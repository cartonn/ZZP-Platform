import { describe, it, expect } from "vitest";
import { hubRedirectTarget } from "@/lib/hub-redirect";

describe("hubRedirectTarget", () => {
  it("wijst naar het kale hub-pad voor de standaardtab", () => {
    expect(hubRedirectTarget("/admin/toezicht", null)).toBe("/admin/toezicht");
  });

  it("zet de tab in de query voor een niet-standaardtab", () => {
    expect(hubRedirectTarget("/admin/toezicht", "dba")).toBe("/admin/toezicht?tab=dba");
  });

  it("behoudt de filters van de oude route (deeplinks blijven werken)", () => {
    expect(hubRedirectTarget("/admin/toezicht", "dba", { niveau: "HOOG" })).toBe(
      "/admin/toezicht?tab=dba&niveau=HOOG",
    );
    expect(hubRedirectTarget("/admin/gebruikersbeheer", null, { q: "a@b.nl" })).toBe(
      "/admin/gebruikersbeheer?q=a%40b.nl",
    );
  });

  it("behoudt herhaalde waarden", () => {
    expect(hubRedirectTarget("/financien", "openstaand", { status: ["OPEN", "LATE"] })).toBe(
      "/financien?tab=openstaand&status=OPEN&status=LATE",
    );
  });

  it("negeert een meegestuurde tab — de omleiding bepaalt het paneel", () => {
    expect(hubRedirectTarget("/admin/toezicht", "avg", { tab: "audit" })).toBe(
      "/admin/toezicht?tab=avg",
    );
  });

  it("slaat lege (undefined) parameters over", () => {
    expect(hubRedirectTarget("/financien", "boekhouding", { q: undefined })).toBe(
      "/financien?tab=boekhouding",
    );
  });
});
