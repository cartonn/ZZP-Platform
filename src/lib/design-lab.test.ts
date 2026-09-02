import { describe, it, expect } from "vitest";
import { isDesignLabEnabled } from "@/lib/design-lab";

describe("isDesignLabEnabled", () => {
  it("staat buiten productie altijd open (lokale ontwikkeling, test)", () => {
    expect(isDesignLabEnabled(undefined, "development")).toBe(true);
    expect(isDesignLabEnabled("false", "development")).toBe(true);
    expect(isDesignLabEnabled(undefined, "test")).toBe(true);
    expect(isDesignLabEnabled(undefined, undefined)).toBe(true);
  });

  it("is in productie dicht zonder expliciete opt-in", () => {
    expect(isDesignLabEnabled(undefined, "production")).toBe(false);
    expect(isDesignLabEnabled("", "production")).toBe(false);
    expect(isDesignLabEnabled("false", "production")).toBe(false);
    expect(isDesignLabEnabled("0", "production")).toBe(false);
    expect(isDesignLabEnabled("off", "production")).toBe(false);
  });

  it("opent in productie bij een waarheidswaarde, ongeacht spaties/hoofdletters", () => {
    expect(isDesignLabEnabled("true", "production")).toBe(true);
    expect(isDesignLabEnabled("TRUE", "production")).toBe(true);
    expect(isDesignLabEnabled("  true  ", "production")).toBe(true);
    expect(isDesignLabEnabled("1", "production")).toBe(true);
    expect(isDesignLabEnabled("yes", "production")).toBe(true);
    expect(isDesignLabEnabled("on", "production")).toBe(true);
  });

  it("weigert een waarde die er alleen op lijkt (geen substring-match)", () => {
    expect(isDesignLabEnabled("truthy", "production")).toBe(false);
    expect(isDesignLabEnabled("ja", "production")).toBe(false);
    expect(isDesignLabEnabled("enabled", "production")).toBe(false);
  });
});
