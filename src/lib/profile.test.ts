import { describe, expect, it } from "vitest";
import {
  computeCompanyCompleteness,
  computeFreelancerCompleteness,
  profileVisibleTo,
  type CompletenessInput,
} from "@/lib/profile";
import { type Actor } from "@/lib/authz";

const empty: CompletenessInput = {
  headline: null,
  bio: null,
  hourlyRate: null,
  location: null,
  availability: "UNKNOWN",
  languages: [],
  skillCount: 0,
  industryCount: 0,
};

const full: CompletenessInput = {
  headline: "Senior Frontend Developer",
  bio: "Tien jaar ervaring.",
  hourlyRate: 85,
  location: "Amsterdam",
  availability: "AVAILABLE",
  languages: ["nl", "en"],
  skillCount: 3,
  industryCount: 1,
};

describe("computeFreelancerCompleteness", () => {
  it("leeg profiel = 0% met alle criteria ontbrekend", () => {
    const r = computeFreelancerCompleteness(empty);
    expect(r.score).toBe(0);
    expect(r.missing).toHaveLength(8);
  });

  it("volledig profiel = 100% zonder ontbrekende onderdelen", () => {
    const r = computeFreelancerCompleteness(full);
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("telt gewichten per ingevuld veld", () => {
    const r = computeFreelancerCompleteness({ ...empty, headline: "Dev" });
    expect(r.score).toBe(20);
    expect(r.missing.map((m) => m.key)).toContain("bio");
    expect(r.missing.map((m) => m.key)).not.toContain("headline");
  });

  it("negeert lege/whitespace-strings en niet-positief tarief", () => {
    const r = computeFreelancerCompleteness({ ...empty, headline: "   ", hourlyRate: 0 });
    expect(r.score).toBe(0);
  });
});

describe("computeCompanyCompleteness", () => {
  const empty = {
    description: null,
    location: null,
    website: null,
    hasIndustry: false,
    hasLogo: false,
  };

  it("is 0% en somt alles op bij een leeg bedrijfsprofiel", () => {
    const r = computeCompanyCompleteness(empty);
    expect(r.score).toBe(0);
    expect(r.missing.map((m) => m.key)).toEqual([
      "description",
      "location",
      "industry",
      "website",
      "logo",
    ]);
  });

  it("is 100% en zonder ontbrekende velden bij een compleet profiel", () => {
    const r = computeCompanyCompleteness({
      description: "Wij bouwen software.",
      location: "Utrecht",
      website: "https://x.nl",
      hasIndustry: true,
      hasLogo: true,
    });
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("telt de gewichten per ingevuld onderdeel", () => {
    const r = computeCompanyCompleteness({ ...empty, description: "x", hasIndustry: true });
    expect(r.score).toBe(55); // 35 + 20
    expect(r.missing.map((m) => m.key)).toEqual(["location", "website", "logo"]);
  });
});

describe("profileVisibleTo", () => {
  const owner: Actor = { id: "u1", role: "FREELANCER", status: "ACTIVE" };
  const other: Actor = { id: "u2", role: "CLIENT", status: "ACTIVE" };
  const admin: Actor = { id: "u3", role: "ADMIN", status: "ACTIVE" };

  it("PUBLIC profiel is voor iedereen zichtbaar (ook anoniem)", () => {
    expect(profileVisibleTo(null, "u1", "PUBLIC")).toBe(true);
    expect(profileVisibleTo(other, "u1", "PUBLIC")).toBe(true);
  });

  it("PRIVATE profiel: alleen eigenaar en admin", () => {
    expect(profileVisibleTo(null, "u1", "PRIVATE")).toBe(false);
    expect(profileVisibleTo(other, "u1", "PRIVATE")).toBe(false);
    expect(profileVisibleTo(owner, "u1", "PRIVATE")).toBe(true);
    expect(profileVisibleTo(admin, "u1", "PRIVATE")).toBe(true);
  });
});
