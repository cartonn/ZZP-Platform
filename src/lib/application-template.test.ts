import { describe, expect, it } from "vitest";
import {
  DEFAULT_MOTIVATION_MAX,
  hasDefaultMotivation,
  normalizeDefaultMotivation,
  resolveMotivationDraft,
} from "./application-template";

describe("normalizeDefaultMotivation", () => {
  it("geeft null voor null/undefined", () => {
    expect(normalizeDefaultMotivation(null)).toBeNull();
    expect(normalizeDefaultMotivation(undefined)).toBeNull();
  });

  it("behandelt een lege of whitespace-only string als geen standaard", () => {
    expect(normalizeDefaultMotivation("")).toBeNull();
    expect(normalizeDefaultMotivation("   \n\t ")).toBeNull();
  });

  it("trimt de tekst maar behoudt de interne inhoud", () => {
    expect(normalizeDefaultMotivation("  Hoi, ik ben Sanne.  ")).toBe("Hoi, ik ben Sanne.");
    expect(normalizeDefaultMotivation("regel 1\nregel 2")).toBe("regel 1\nregel 2");
  });
});

describe("hasDefaultMotivation", () => {
  it("is true alleen bij betekenisvolle tekst", () => {
    expect(hasDefaultMotivation("Ik pas hier goed bij.")).toBe(true);
    expect(hasDefaultMotivation("  ")).toBe(false);
    expect(hasDefaultMotivation(null)).toBe(false);
    expect(hasDefaultMotivation(undefined)).toBe(false);
  });
});

describe("resolveMotivationDraft", () => {
  it("levert een leeg veld zonder standaard", () => {
    expect(resolveMotivationDraft(null)).toEqual({ text: "", fromTemplate: false });
    expect(resolveMotivationDraft("")).toEqual({ text: "", fromTemplate: false });
    expect(resolveMotivationDraft("   ")).toEqual({ text: "", fromTemplate: false });
  });

  it("vult de genormaliseerde standaardtekst voor en markeert de herkomst", () => {
    expect(resolveMotivationDraft("  Beschikbaar per direct.  ")).toEqual({
      text: "Beschikbaar per direct.",
      fromTemplate: true,
    });
  });
});

describe("DEFAULT_MOTIVATION_MAX", () => {
  it("is gelijk aan de maximale lengte van het motivatieveld", () => {
    expect(DEFAULT_MOTIVATION_MAX).toBe(2000);
  });
});
