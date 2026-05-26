import { describe, expect, it } from "vitest";
import {
  companyProfileSchema,
  freelancerProfileSchema,
  registerSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepteert een geldige freelancer-registratie", () => {
    const r = registerSchema.safeParse({
      name: "Sanne",
      email: "Sanne@Example.NL",
      password: "geheim123",
      role: "FREELANCER",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("sanne@example.nl"); // genormaliseerd
  });

  it("eist een bedrijfsnaam voor CLIENT", () => {
    const r = registerSchema.safeParse({
      name: "Mark",
      email: "mark@example.nl",
      password: "geheim123",
      role: "CLIENT",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("companyName");
  });

  it("weigert te kort wachtwoord en ongeldige rol", () => {
    expect(registerSchema.safeParse({ name: "X", email: "a@b.nl", password: "kort", role: "FREELANCER" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Naam", email: "a@b.nl", password: "geheim123", role: "ADMIN" }).success).toBe(false);
  });
});

describe("freelancerProfileSchema", () => {
  it("coerceert tarief en defaultt arrays", () => {
    const r = freelancerProfileSchema.safeParse({
      availability: "AVAILABLE",
      workMode: "HYBRID",
      visibility: "PUBLIC",
      hourlyRate: "75",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.hourlyRate).toBe(75);
      expect(r.data.skillIds).toEqual([]);
      expect(r.data.languages).toEqual([]);
    }
  });

  it("behandelt leeg tarief als undefined", () => {
    const r = freelancerProfileSchema.safeParse({
      availability: "UNKNOWN",
      workMode: "REMOTE",
      visibility: "PRIVATE",
      hourlyRate: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hourlyRate).toBeUndefined();
  });

  it("weigert ongeldige enum-waarden", () => {
    expect(
      freelancerProfileSchema.safeParse({ availability: "ONBEKEND", workMode: "HYBRID", visibility: "PUBLIC" }).success,
    ).toBe(false);
  });
});

describe("companyProfileSchema", () => {
  it("accepteert geldig bedrijf en behandelt lege website/branche als undefined", () => {
    const r = companyProfileSchema.safeParse({ name: "Acme BV", website: "", industryId: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.website).toBeUndefined();
      expect(r.data.industryId).toBeUndefined();
    }
  });

  it("weigert ongeldige website-URL en te korte naam", () => {
    expect(companyProfileSchema.safeParse({ name: "Acme", website: "geen-url" }).success).toBe(false);
    expect(companyProfileSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});
