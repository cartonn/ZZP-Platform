import { describe, expect, it } from "vitest";
import {
  type ClientFreelancerSuggestion,
  type FreelancerSuggestion,
  mergeClientSuggestions,
  scoreProfilesForJob,
  SEMANTIC_HIGHLIGHT_THRESHOLD,
  SUGGESTION_MIN_SCORE,
  topSuggestions,
} from "./suggestions";
import { scoreJobForFreelancer } from "./matching";
import { computeTrustLevel } from "./trust";
import { mandatoryDocuments } from "./mandatory-documents";
import { getSemanticMatcher, safeRelatedness } from "./services/semantic-matcher";

const s = (freelancerId: string, score: number): FreelancerSuggestion => ({
  freelancerId,
  name: freelancerId,
  score,
  compliance: "COMPLIANT",
  trustLevel: "BASIS",
  availability: "AVAILABLE",
  headline: null,
  location: null,
  rate: null,
});

const cs = (
  freelancerId: string,
  score: number,
  jobId: string,
  relatedness?: number,
): ClientFreelancerSuggestion => ({
  freelancerId,
  name: freelancerId,
  score,
  compliance: "COMPLIANT",
  trustLevel: "BASIS",
  availability: "AVAILABLE",
  headline: null,
  location: null,
  rate: null,
  jobId,
  jobTitle: `Opdracht ${jobId}`,
  ...(relatedness !== undefined ? { relatedness } : {}),
});

describe("topSuggestions", () => {
  it("filtert ZZP'ers onder de drempel weg", () => {
    const out = topSuggestions([s("a", 80), s("b", 50), s("c", 69)], { minScore: 70, limit: 10 });
    expect(out.map((x) => x.freelancerId)).toEqual(["a"]);
  });

  it("sorteert aflopend op score en begrenst op limit", () => {
    const out = topSuggestions([s("a", 72), s("b", 95), s("c", 88), s("d", 100)], {
      minScore: 70,
      limit: 2,
    });
    expect(out.map((x) => x.freelancerId)).toEqual(["d", "b"]);
  });

  it("geeft een lege lijst als niets de drempel haalt", () => {
    expect(topSuggestions([s("a", 10), s("b", 69)], { minScore: 70, limit: 4 })).toEqual([]);
  });

  it("draagt het beschikbaarheidsstatusveld ongewijzigd mee", () => {
    const out = topSuggestions([{ ...s("a", 80), availability: "LIMITED" }], {
      minScore: 70,
      limit: 10,
    });
    expect(out[0]?.availability).toBe("LIMITED");
  });
});

describe("mergeClientSuggestions", () => {
  it("dedupeert dezelfde freelancerId over twee opdrachten en houdt de hoogst scorende", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("freelancer-1", 80, "job-a"),
      cs("freelancer-1", 92, "job-b"),
    ];
    const out = mergeClientSuggestions(list, { limit: 10 });
    expect(out).toHaveLength(1);
    expect(out[0]?.freelancerId).toBe("freelancer-1");
    expect(out[0]?.score).toBe(92);
    expect(out[0]?.jobId).toBe("job-b");
  });

  it("sorteert aflopend op score en respecteert het limiet", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("f1", 70, "job-a"),
      cs("f2", 95, "job-a"),
      cs("f3", 88, "job-b"),
      cs("f4", 100, "job-b"),
    ];
    const out = mergeClientSuggestions(list, { limit: 2 });
    expect(out.map((x) => x.freelancerId)).toEqual(["f4", "f2"]);
  });

  it("breekt een gelijke score af op relatedness (hoogste wint)", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("f1", 85, "job-a", 0.2),
      cs("f1", 85, "job-b", 0.6),
      cs("f2", 85, "job-c", 0.4),
    ];
    const out = mergeClientSuggestions(list, { limit: 10 });
    // f1 deduped: job-b wins (relatedness 0.6 > 0.2)
    expect(out).toHaveLength(2);
    const f1 = out.find((x) => x.freelancerId === "f1");
    expect(f1?.jobId).toBe("job-b");
    expect(f1?.relatedness).toBe(0.6);
    // f2 has relatedness 0.4, f1 has 0.6 → f1 sorts first
    expect(out[0]?.freelancerId).toBe("f1");
    expect(out[1]?.freelancerId).toBe("f2");
  });
});

// ---------------------------------------------------------------------------
// Parity-borging voor de pool-refactor: `scoreProfilesForJob` (nieuw, één pool voor
// meerdere opdrachten) moet exact dezelfde output geven als de oude, per-opdracht inline
// scoring. We bouwen de oude implementatie hier op fixtures na en vergelijken 1-op-1.
// ---------------------------------------------------------------------------

interface FixtureJob {
  id: string;
  title: string;
  description: string | null;
  industryId: string | null;
  rateMin: number | null;
  rateMax: number | null;
  workMode: string;
  location: string | null;
  skills: Array<{ skillId: string; required: boolean; skill: { name: string } | null }>;
  credentialRequirements: Array<{ credentialType: string; required: boolean }>;
}

interface FixtureProfile {
  id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  hourlyRate: number | null;
  workMode: string;
  availability: string;
  maxTravelMinutes: number | null;
  user: { name: string | null; identityVerifiedAt: Date | null };
  skills: Array<{ skillId: string; skill: { name: string } | null }>;
  credentials: Array<{ type: string; status: string; expiresAt: Date | null }>;
  industries: Array<{ industryId: string }>;
  availabilityWindows: Array<{ startDate: Date; endDate: Date; type: string }>;
}

function joinText(parts: ReadonlyArray<string | null | undefined>): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(" ");
}

/** Exacte reconstructie van de oude, per-opdracht inline scoring (vóór de pool-refactor). */
function legacyScore(
  job: FixtureJob,
  profiles: readonly FixtureProfile[],
  applied: ReadonlySet<string>,
  limit: number,
  now: number,
): FreelancerSuggestion[] {
  const matcher = getSemanticMatcher();
  const jobText = joinText([job.title, job.description, ...job.skills.map((s) => s.skill?.name)]);
  const scored: FreelancerSuggestion[] = profiles
    .filter((p) => !applied.has(p.id))
    .map((p) => {
      const match = scoreJobForFreelancer(job, p);
      const verifiedCredentialCount = p.credentials.filter(
        (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > now),
      ).length;
      const trust = computeTrustLevel({
        identityVerified: !!p.user.identityVerifiedAt,
        verifiedCredentialCount,
        mandatoryDocsComplete: mandatoryDocuments(
          p.credentials.map((c) => ({
            type: c.type as never,
            status: c.status as never,
            expiresAt: c.expiresAt,
          })),
        ).allSatisfied,
      });
      const profileText = joinText([p.headline, p.bio, ...p.skills.map((s) => s.skill?.name)]);
      const relatedness = safeRelatedness(matcher, jobText, profileText);
      return {
        freelancerId: p.id,
        name: p.user.name ?? "—",
        score: match.score,
        compliance: match.compliance.status,
        trustLevel: trust.level,
        availability: match.availability.status,
        headline: p.headline,
        location: p.location,
        rate: p.hourlyRate,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
      };
    });
  return scored
    .filter((x) => x.score >= SUGGESTION_MIN_SCORE)
    .sort((a, b) => b.score - a.score || (b.relatedness ?? 0) - (a.relatedness ?? 0))
    .slice(0, limit);
}

describe("scoreProfilesForJob — parity met de oude per-opdracht scoring", () => {
  const now = Date.UTC(2026, 5, 1);
  const future = new Date(Date.UTC(2030, 0, 1));

  const jobA: FixtureJob = {
    id: "job-a",
    title: "Verpleegkundige IC",
    description: "Ervaren IC-verpleegkundige gezocht voor nachtdiensten",
    industryId: "ind-zorg",
    rateMin: 40,
    rateMax: 70,
    workMode: "ONSITE",
    location: "Amsterdam",
    skills: [
      { skillId: "sk-ic", required: true, skill: { name: "Intensive care" } },
      { skillId: "sk-nacht", required: false, skill: { name: "Nachtdienst" } },
    ],
    credentialRequirements: [{ credentialType: "BIG", required: true }],
  };

  const jobB: FixtureJob = {
    id: "job-b",
    title: "Wijkverpleegkundige",
    description: "Thuiszorg in de wijk, flexibele uren",
    industryId: "ind-zorg",
    rateMin: 35,
    rateMax: 60,
    workMode: "ONSITE",
    location: "Amsterdam",
    skills: [{ skillId: "sk-wijk", required: true, skill: { name: "Wijkzorg" } }],
    credentialRequirements: [],
  };

  const profiles: FixtureProfile[] = [
    {
      id: "prof-1",
      headline: "IC-verpleegkundige",
      bio: "Ruime ervaring op de intensive care en nachtdiensten",
      location: "Amsterdam",
      hourlyRate: 55,
      workMode: "ONSITE",
      availability: "AVAILABLE",
      maxTravelMinutes: null,
      user: { name: "Anne", identityVerifiedAt: future },
      skills: [
        { skillId: "sk-ic", skill: { name: "Intensive care" } },
        { skillId: "sk-nacht", skill: { name: "Nachtdienst" } },
      ],
      credentials: [{ type: "BIG", status: "VERIFIED", expiresAt: future }],
      industries: [{ industryId: "ind-zorg" }],
      availabilityWindows: [],
    },
    {
      id: "prof-2",
      headline: "Wijkverpleegkundige",
      bio: "Thuiszorg specialist in de wijk",
      location: "Amsterdam",
      hourlyRate: 45,
      workMode: "ONSITE",
      availability: "AVAILABLE",
      maxTravelMinutes: null,
      user: { name: "Bram", identityVerifiedAt: null },
      skills: [{ skillId: "sk-wijk", skill: { name: "Wijkzorg" } }],
      credentials: [],
      industries: [{ industryId: "ind-zorg" }],
      availabilityWindows: [],
    },
    {
      id: "prof-3",
      headline: "Frontend developer",
      bio: "React en TypeScript, geen zorgachtergrond",
      location: "Rotterdam",
      hourlyRate: 90,
      workMode: "REMOTE",
      availability: "LIMITED",
      maxTravelMinutes: null,
      user: { name: "Cas", identityVerifiedAt: null },
      skills: [{ skillId: "sk-react", skill: { name: "React" } }],
      credentials: [],
      industries: [{ industryId: "ind-it" }],
      availabilityWindows: [],
    },
  ];

  it("levert identieke output voor 2 opdrachten × 3 profielen (geen reacties)", () => {
    const empty = new Set<string>();
    for (const job of [jobA, jobB]) {
      const legacy = legacyScore(job, profiles, empty, 4, now);
      const refactored = scoreProfilesForJob(job, profiles, empty, 4, now);
      expect(refactored).toEqual(legacy);
    }
  });

  it("respecteert de applied-set identiek aan de oude implementatie", () => {
    const applied = new Set(["prof-1"]);
    for (const job of [jobA, jobB]) {
      const legacy = legacyScore(job, profiles, applied, 4, now);
      const refactored = scoreProfilesForJob(job, profiles, applied, 4, now);
      expect(refactored).toEqual(legacy);
      expect(refactored.some((r) => r.freelancerId === "prof-1")).toBe(false);
    }
  });

  it("aggregeert twee opdrachten net als de oude fan-out (dedup op hoogste score)", () => {
    const empty = new Set<string>();
    // Nieuwe aanpak: pool één keer scoren tegen beide opdrachten, dan mergen.
    const merged: ClientFreelancerSuggestion[] = [];
    for (const job of [jobA, jobB]) {
      for (const s of scoreProfilesForJob(job, profiles, empty, 4, now)) {
        merged.push({ ...s, jobId: job.id, jobTitle: job.title });
      }
    }
    const outNew = mergeClientSuggestions(merged, { limit: 4 });

    // Oude aanpak: legacy-score per opdracht, dan mergen.
    const legacyMerged: ClientFreelancerSuggestion[] = [];
    for (const job of [jobA, jobB]) {
      for (const s of legacyScore(job, profiles, empty, 4, now)) {
        legacyMerged.push({ ...s, jobId: job.id, jobTitle: job.title });
      }
    }
    const outOld = mergeClientSuggestions(legacyMerged, { limit: 4 });

    expect(outNew).toEqual(outOld);
  });
});
