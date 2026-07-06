import { describe, expect, it } from "vitest";
import {
  buildDienstSuggesties,
  DIENST_SUGGESTIE_MIN_SCORE,
  type SuggestieJob,
} from "@/lib/franchise/dienst-suggesties";
import { type FreelancerMatchSource } from "@/lib/matching";

const NOW = new Date("2026-07-06T12:00:00Z");

const okCredentials = [
  { type: "VOG", status: "VERIFIED", expiresAt: null },
  { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
];

// Sterk profiel: alle skills, juiste branche, tarief binnen budget, beschikbaar, dezelfde stad.
function freelancer(over: Partial<FreelancerMatchSource> = {}): FreelancerMatchSource {
  return {
    skills: [{ skillId: "skill-verpleging" }, { skillId: "skill-wijkzorg" }],
    credentials: okCredentials,
    hourlyRate: 50,
    workMode: "ONSITE",
    location: "Utrecht",
    maxTravelMinutes: null,
    headline: "Wijkverpleegkundige",
    bio: "Ervaren in de wijkzorg.",
    availability: "AVAILABLE",
    availabilityWindows: [],
    industries: [{ industryId: "ind-zorg" }],
    ...over,
  };
}

function job(id: string, over: Partial<SuggestieJob> = {}): SuggestieJob {
  return {
    id,
    companyName: "Thuiszorg Noord",
    title: `Dienst ${id}`,
    description: "Zorg aan huis in de wijk.",
    skills: [
      { skillId: "skill-verpleging", required: true },
      { skillId: "skill-wijkzorg", required: false },
    ],
    credentialRequirements: [{ credentialType: "VOG", required: true }],
    rateMin: 40,
    rateMax: 60,
    workMode: "ONSITE",
    location: "Utrecht",
    industryId: "ind-zorg",
    ...over,
  };
}

describe("buildDienstSuggesties", () => {
  it("rangschikt op aflopende matchscore", () => {
    const strong = job("strong");
    // Zwakke dienst: andere branche, werkmodus mismatch, geen skill-overlap.
    const weak = job("weak", {
      skills: [{ skillId: "skill-anders", required: true }],
      industryId: "ind-bouw",
      workMode: "REMOTE",
      description: "Iets heel anders.",
    });
    const res = buildDienstSuggesties(
      freelancer(),
      [weak, strong],
      new Set(),
      new Set(),
      NOW,
      0, // toon alles zodat de sortering zichtbaar is
    );
    expect(res[0]!.jobId).toBe("strong");
    expect(res[0]!.matchScore).toBeGreaterThan(res[1]!.matchScore);
  });

  it("filtert diensten onder de drempel weg", () => {
    const weak = job("weak", {
      skills: [{ skillId: "skill-anders", required: true }],
      industryId: "ind-bouw",
      workMode: "REMOTE",
      credentialRequirements: [{ credentialType: "BIG", required: true }],
      description: "Iets heel anders.",
    });
    const res = buildDienstSuggesties(freelancer(), [weak], new Set(), new Set(), NOW);
    expect(res).toHaveLength(0);
  });

  it("markeert een reeds-gereageerde dienst", () => {
    const res = buildDienstSuggesties(freelancer(), [job("a")], new Set(["a"]), new Set(), NOW);
    expect(res[0]!.hasApplied).toBe(true);
    expect(res[0]!.proposed).toBe(false);
  });

  it("markeert een reeds-voorgedragen dienst", () => {
    const res = buildDienstSuggesties(freelancer(), [job("a")], new Set(), new Set(["a"]), NOW);
    expect(res[0]!.proposed).toBe(true);
    expect(res[0]!.hasApplied).toBe(false);
  });

  it("levert troef en minpunt uit dezelfde matchmotor", () => {
    // Tarief boven budget levert een gap-reden op, maar de match blijft sterk genoeg.
    const res = buildDienstSuggesties(
      freelancer({ hourlyRate: 80 }),
      [job("a", { rateMax: 60 })],
      new Set(),
      new Set(),
      NOW,
    );
    expect(res[0]!.topReason).toBeTruthy();
    expect(res[0]!.topGap).toContain("budget");
  });

  it("begrenst het aantal suggesties", () => {
    const many = Array.from({ length: 10 }, (_, i) => job(`j${i}`));
    const res = buildDienstSuggesties(freelancer(), many, new Set(), new Set(), NOW, 0, 3);
    expect(res).toHaveLength(3);
  });

  it("gebruikt een lagere drempel dan de proactieve ZZP-kant", () => {
    expect(DIENST_SUGGESTIE_MIN_SCORE).toBeLessThan(70);
  });
});
