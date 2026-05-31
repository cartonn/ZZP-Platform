import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  companyProfileSchema,
  credentialSchema,
  freelancerProfileSchema,
  jobSchema,
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
    expect(
      registerSchema.safeParse({ name: "X", email: "a@b.nl", password: "kort", role: "FREELANCER" })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "Naam",
        email: "a@b.nl",
        password: "geheim123",
        role: "ADMIN",
      }).success,
    ).toBe(false);
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
      freelancerProfileSchema.safeParse({
        availability: "ONBEKEND",
        workMode: "HYBRID",
        visibility: "PUBLIC",
      }).success,
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
    expect(companyProfileSchema.safeParse({ name: "Acme", website: "geen-url" }).success).toBe(
      false,
    );
    expect(companyProfileSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("jobSchema", () => {
  const base = {
    title: "Frontend Developer",
    description: "Bouw onze nieuwe app.",
    workMode: "HYBRID",
  };

  it("accepteert een geldige opdracht en defaultt arrays", () => {
    const r = jobSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.requiredSkillIds).toEqual([]);
      expect(r.data.requiredCredentialTypes).toEqual([]);
    }
  });

  it("weigert te korte titel/omschrijving", () => {
    expect(jobSchema.safeParse({ ...base, title: "X" }).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, description: "kort" }).success).toBe(false);
  });

  it("weigert rateMin > rateMax", () => {
    const r = jobSchema.safeParse({ ...base, rateMin: "90", rateMax: "50" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("rateMax");
  });

  it("coerceert startDate en lege rate naar undefined", () => {
    const r = jobSchema.safeParse({ ...base, rateMin: "", startDate: "2026-09-01" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rateMin).toBeUndefined();
      expect(r.data.startDate).toBeInstanceOf(Date);
    }
  });
});

describe("applicationSchema", () => {
  it("accepteert een geldige reactie", () => {
    const r = applicationSchema.safeParse({
      motivation: "Ik pas hier goed bij omdat...",
      proposedRate: "80",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.proposedRate).toBe(80);
  });

  it("weigert een te korte motivatie", () => {
    expect(applicationSchema.safeParse({ motivation: "kort" }).success).toBe(false);
  });
});

describe("credentialSchema", () => {
  const base = { type: "VOG", title: "Verklaring Omtrent Gedrag", visibility: "PRIVATE" };

  it("accepteert geldige metadata en coerceert datums", () => {
    const r = credentialSchema.safeParse({
      ...base,
      issuedAt: "2025-01-01",
      expiresAt: "2026-01-01",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.issuedAt).toBeInstanceOf(Date);
      expect(r.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it("weigert vervaldatum vóór uitgiftedatum", () => {
    const r = credentialSchema.safeParse({
      ...base,
      issuedAt: "2026-01-01",
      expiresAt: "2025-01-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("expiresAt");
  });

  it("weigert onbekend type en te korte titel", () => {
    expect(credentialSchema.safeParse({ ...base, type: "ONZIN" }).success).toBe(false);
    expect(credentialSchema.safeParse({ ...base, title: "X" }).success).toBe(false);
  });
});
