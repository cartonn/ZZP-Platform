import { describe, expect, it } from "vitest";
import {
  computeCompanyCompleteness,
  computeFreelancerCompleteness,
  profileVisibleTo,
  rankCompletenessSteps,
  PROFILE_COMPLETENESS_ANCHORS,
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

describe("rankCompletenessSteps", () => {
  it("rangschikt ontbrekende onderdelen op puntenwinst, hoogste eerst", () => {
    const steps = rankCompletenessSteps(computeFreelancerCompleteness(empty));
    expect(steps).toHaveLength(8);
    // Puntenwinst monotoon dalend.
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].points).toBeLessThanOrEqual(steps[i - 1].points);
    }
    // Functietitel (20) is de grootste stap en staat bovenaan.
    expect(steps[0]).toMatchObject({ key: "headline", points: 20 });
  });

  it("breekt gelijke punten deterministisch op labelnaam (nl)", () => {
    const steps = rankCompletenessSteps(computeFreelancerCompleteness(empty));
    // bio, hourlyRate en skills wegen elk 15; volgorde op label: 'Korte bio', 'Minstens één skill', 'Uurtarief'.
    const fifteen = steps.filter((s) => s.points === 15).map((s) => s.label);
    expect(fifteen).toEqual(["Korte bio", "Minstens één skill", "Uurtarief"]);
  });

  it("geeft per stap een deep-link naar het juiste edit-veld-anker", () => {
    const steps = rankCompletenessSteps(computeFreelancerCompleteness(empty));
    const headline = steps.find((s) => s.key === "headline");
    expect(headline?.href).toBe("/profiel/bewerken#headline");
    const skills = steps.find((s) => s.key === "skills");
    expect(skills?.href).toBe("/profiel/bewerken#vaardigheden");
  });

  it("elke freelancer-criteriumsleutel heeft een anker (geen dode deep-link)", () => {
    for (const step of rankCompletenessSteps(computeFreelancerCompleteness(empty))) {
      expect(PROFILE_COMPLETENESS_ANCHORS[step.key]).toBeDefined();
      expect(step.href).toContain("#");
    }
  });

  it("valt zonder anker terug op de kale bewerk-pagina", () => {
    const steps = rankCompletenessSteps({
      score: 0,
      missing: [{ key: "onbekend", label: "Onbekend", points: 5 }],
    });
    expect(steps[0].href).toBe("/profiel/bewerken");
  });

  it("respecteert een aangepaste editHref", () => {
    const steps = rankCompletenessSteps(computeFreelancerCompleteness(empty), "/x");
    expect(steps[0].href).toBe("/x#headline");
  });

  it("is leeg bij een volledig profiel", () => {
    expect(rankCompletenessSteps(computeFreelancerCompleteness(full))).toEqual([]);
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
