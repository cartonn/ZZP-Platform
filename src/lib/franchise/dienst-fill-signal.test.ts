import { describe, it, expect } from "vitest";
import {
  computeDienstFill,
  dienstFillChip,
  READY_MATCH_MIN_SCORE,
  type DienstFillSignal,
} from "@/lib/franchise/dienst-fill-signal";
import { type RosterFreelancerSource } from "@/lib/franchise/dienst-voordracht";
import { type JobMatchSource } from "@/lib/matching";

const NOW = new Date("2026-07-15T09:00:00Z");

// Een dienst die om verpleegkundige-vaardigheden + een geldig VOG vraagt.
const JOB: JobMatchSource = {
  skills: [
    { skillId: "verpleging", required: true },
    { skillId: "medicatie", required: false },
  ],
  credentialRequirements: [{ credentialType: "VOG", required: true }],
  rateMin: 40,
  rateMax: 70,
  workMode: "ONSITE",
  location: "Utrecht",
  industryId: "zorg",
  title: "Verpleegkundige nachtdienst",
  description: "VVT-nachtdiensten in Utrecht",
};

/** Een goed-matchende, vrij-inzetbare ZZP'er: alle vereiste skills + geldig VOG, beschikbaar, geen lopende opdracht. */
function strongIdleFreelancer(id: string): RosterFreelancerSource {
  return {
    id,
    headline: "Verpleegkundige VVT",
    bio: "Ervaren in nachtdiensten en medicatie",
    completeness: 90,
    availability: "AVAILABLE",
    hourlyRate: 55,
    workMode: "ONSITE",
    location: "Utrecht",
    maxTravelMinutes: 60,
    user: {
      name: `ZZP ${id}`,
      identityVerifiedAt: new Date("2026-01-01T00:00:00Z"),
      lastLoginAt: new Date("2026-07-14T00:00:00Z"),
    },
    skills: [{ skillId: "verpleging" }, { skillId: "medicatie" }],
    industries: [{ industryId: "zorg" }],
    availabilityWindows: [],
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: null },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
    ],
    activeCollaborations: [],
  };
}

describe("computeDienstFill", () => {
  it("telt een vrij-inzetbare, goed-matchende ZZP'er als ready match", () => {
    const signal = computeDienstFill(JOB, [strongIdleFreelancer("a")], NOW);
    expect(signal.idleReady).toBe(1);
    expect(signal.readyMatches).toBe(1);
  });

  it("telt een ZZP'er met een lopende opdracht NIET als vrije capaciteit", () => {
    const placed: RosterFreelancerSource = {
      ...strongIdleFreelancer("b"),
      activeCollaborations: [
        {
          collaborationId: "c1",
          jobId: "j1",
          jobTitle: "Andere klus",
          tenantId: "t1",
          startDate: null,
          endDate: null,
        },
      ],
    };
    const signal = computeDienstFill(JOB, [placed], NOW);
    expect(signal.idleReady).toBe(0);
    expect(signal.readyMatches).toBe(0);
  });

  it("telt een onbeschikbare ZZP'er niet mee (bewust niet beschikbaar)", () => {
    const busy: RosterFreelancerSource = {
      ...strongIdleFreelancer("c"),
      availability: "UNAVAILABLE",
    };
    const signal = computeDienstFill(JOB, [busy], NOW);
    expect(signal.idleReady).toBe(0);
    expect(signal.readyMatches).toBe(0);
  });

  it("telt een niet-inzetbare ZZP'er (ontbrekend verplicht bewijs) niet als vrije capaciteit", () => {
    // Geen VOG → engageability AANDACHT/INACTIEF → niet vrij-inzetbaar.
    const noVog: RosterFreelancerSource = {
      ...strongIdleFreelancer("d"),
      credentials: [],
    };
    const signal = computeDienstFill(JOB, [noVog], NOW);
    expect(signal.idleReady).toBe(0);
    expect(signal.readyMatches).toBe(0);
  });

  it("telt een vrij-inzetbare maar zwak-matchende ZZP'er wel als idle, niet als ready match", () => {
    // Vrij inzetbaar (VOG + beschikbaar) maar mist de vereiste vak-skill → lage score.
    const weak: RosterFreelancerSource = {
      ...strongIdleFreelancer("e"),
      headline: "Grafisch ontwerper",
      bio: "Logo's en huisstijl",
      skills: [{ skillId: "ontwerp" }],
      industries: [{ industryId: "creatief" }],
      location: "Groningen",
    };
    const signal = computeDienstFill(JOB, [weak], NOW);
    expect(signal.idleReady).toBe(1);
    expect(signal.readyMatches).toBe(0);
  });

  it("aggregeert over een gemengd roster", () => {
    const signal = computeDienstFill(
      JOB,
      [
        strongIdleFreelancer("a"),
        strongIdleFreelancer("b"),
        { ...strongIdleFreelancer("c"), availability: "UNAVAILABLE" },
      ],
      NOW,
    );
    expect(signal.idleReady).toBe(2);
    expect(signal.readyMatches).toBe(2);
  });

  it("geeft nul terug bij een leeg roster", () => {
    expect(computeDienstFill(JOB, [], NOW)).toEqual({ readyMatches: 0, idleReady: 0 });
  });
});

describe("dienstFillChip", () => {
  it("toont een success-chip bij minstens één ready match", () => {
    const chip = dienstFillChip({ readyMatches: 3, idleReady: 5 });
    expect(chip).toEqual({ label: "3 geschikte vakmensen vrij", tone: "success" });
  });

  it("gebruikt de enkelvoudsvorm bij precies één", () => {
    expect(dienstFillChip({ readyMatches: 1, idleReady: 2 })?.label).toBe(
      "1 geschikte vakmens vrij",
    );
  });

  it("toont geen chip zonder geschikte vrije match (rustige lijst)", () => {
    expect(dienstFillChip({ readyMatches: 0, idleReady: 4 })).toBeNull();
    expect(dienstFillChip({ readyMatches: 0, idleReady: 0 })).toBeNull();
  });
});

describe("READY_MATCH_MIN_SCORE", () => {
  it("is een strenge drempel op de 0-100-schaal", () => {
    const signal: DienstFillSignal = computeDienstFill(JOB, [], NOW);
    expect(signal.readyMatches).toBe(0);
    expect(READY_MATCH_MIN_SCORE).toBeGreaterThanOrEqual(50);
    expect(READY_MATCH_MIN_SCORE).toBeLessThanOrEqual(100);
  });
});
