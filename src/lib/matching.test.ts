import { describe, expect, it } from "vitest";
import {
  computeCompliance,
  computeMatchScore,
  liveComplianceStatus,
  topPositiveReason,
  topGapReason,
  brancheFit,
  BRANCHE_PENALTY,
  BRANCHE_MISMATCH_CAP,
  MATCH_COMPONENT_MAX,
  SEMANTIC_HIGHLIGHT_THRESHOLD,
  jobProfileRelatedness,
  scoreJobForFreelancer,
  type FreelancerCredential,
  type MatchInput,
  type MatchResult,
} from "@/lib/matching";

const now = new Date("2026-05-25T12:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");

describe("computeCompliance", () => {
  it("is COMPLIANT zonder vereisten", () => {
    expect(computeCompliance([], [], now).status).toBe("COMPLIANT");
  });

  it("is COMPLIANT als alle vereisten VERIFIED en geldig zijn", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "DIPLOMA", status: "VERIFIED", expiresAt: null },
    ];
    const r = computeCompliance(["VOG", "DIPLOMA"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.satisfied).toEqual(["VOG", "DIPLOMA"]);
    expect(r.missing).toEqual([]);
  });

  it("is NON_COMPLIANT bij ontbrekend vereist credential", () => {
    const r = computeCompliance(["VOG"], [], now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.missing).toEqual(["VOG"]);
  });

  it("is NON_COMPLIANT bij een verlopen vereist credential (voldoet nú niet)", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: past }];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.expired).toEqual(["VOG"]);
  });

  it("is WARNING bij een credential in beoordeling", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "SUBMITTED" }];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.inReview).toEqual(["VOG"]);
  });

  it("prioriteert een geldig VERIFIED credential boven een verlopen exemplaar", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: past },
      { type: "VOG", status: "VERIFIED", expiresAt: future },
    ];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.satisfied).toEqual(["VOG"]);
  });
});

describe("liveComplianceStatus", () => {
  it("geeft null als de opdracht geen vereiste certificaten heeft (geen badge)", () => {
    expect(liveComplianceStatus([], [], now)).toBeNull();
  });
  it("herrekent live: een sinds de reactie verlopen VOG geeft NON_COMPLIANT, niet COMPLIANT", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: past }];
    expect(liveComplianceStatus(["VOG"], creds, now)).toBe("NON_COMPLIANT");
  });
  it("geldige, niet-verlopen VOG → COMPLIANT", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: future }];
    expect(liveComplianceStatus(["VOG"], creds, now)).toBe("COMPLIANT");
  });
});

describe("computeMatchScore", () => {
  const base: MatchInput = {
    requiredSkillIds: ["react", "ts"],
    optionalSkillIds: ["next"],
    freelancerSkillIds: ["react", "ts", "next"],
    requiredCredentialTypes: ["VOG"],
    credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: future }],
    job: { rateMin: 60, rateMax: 90, workMode: "HYBRID", location: "Amsterdam" },
    freelancer: {
      hourlyRate: 75,
      workMode: "HYBRID",
      location: "Amsterdam",
      availability: "AVAILABLE",
      // Volledige inhoudelijke aansluiting → semantic-component vol; een perfecte match haalt nu alle
      // zes componenten (skills/compliance/rate/workMode/location/semantic) op hun maximum.
      relatednessScore: 1,
    },
  };

  it("geeft een perfecte match ~100", () => {
    const r = computeMatchScore(base, now);
    expect(r.score).toBe(100);
    expect(r.compliance.status).toBe("COMPLIANT");
  });

  it("breakdown-componenten sommeren tot de score en blijven binnen hun maximum (MATCH_COMPONENT_MAX)", () => {
    // De som van de maxima is de 100-punts-schaal — de basis voor de transparante breakdown-weergave.
    const maxSum = Object.values(MATCH_COMPONENT_MAX).reduce((a, b) => a + b, 0);
    expect(maxSum).toBe(100);

    // Bij een perfecte match haalt elke component exact zijn maximum.
    const r = computeMatchScore(base, now);
    for (const key of Object.keys(MATCH_COMPONENT_MAX) as (keyof typeof MATCH_COMPONENT_MAX)[]) {
      expect(r.breakdown[key]).toBe(MATCH_COMPONENT_MAX[key]);
    }

    // En bij een zwakke match overschrijdt geen enkele component zijn maximum.
    const weak = computeMatchScore(
      { ...base, freelancerSkillIds: [], credentials: [], freelancer: { ...base.freelancer, hourlyRate: 200 } }, // prettier-ignore
      now,
    );
    for (const key of Object.keys(MATCH_COMPONENT_MAX) as (keyof typeof MATCH_COMPONENT_MAX)[]) {
      expect(weak.breakdown[key]).toBeLessThanOrEqual(MATCH_COMPONENT_MAX[key]);
      expect(weak.breakdown[key]).toBeGreaterThanOrEqual(0);
    }
  });

  const sumBreakdown = (b: MatchResult["breakdown"]) =>
    b.skills + b.compliance + b.rate + b.workMode + b.location + b.semantic + b.branche;

  it("de getoonde breakdown telt exact op tot de getoonde score (ook bij fractionele bijdragen)", () => {
    // Scenario uit de bug-hunt dat de oude afronding (1 decimaal per component, daarna Math.round van
    // de som) deed afwijken: 0/1 vereiste skills, geen cert-match, geen tarief, ONSITE vs REMOTE.
    const r = computeMatchScore(
      {
        requiredSkillIds: ["r0"],
        optionalSkillIds: [],
        freelancerSkillIds: [],
        requiredCredentialTypes: ["VOG"],
        credentials: [],
        job: { rateMin: null, rateMax: null, workMode: "ONSITE", location: "A" },
        freelancer: {
          hourlyRate: null,
          workMode: "REMOTE",
          location: "B",
          availability: "AVAILABLE",
        },
      },
      now,
    );
    expect(sumBreakdown(r.breakdown)).toBe(r.score);
    expect(sumBreakdown(computeMatchScore(base, now).breakdown)).toBe(100);
  });

  it("verlaagt de score bij ontbrekende vereiste skills", () => {
    const r = computeMatchScore({ ...base, freelancerSkillIds: ["next"] }, now);
    expect(r.score).toBeLessThan(100);
    expect(r.breakdown.skills).toBeLessThan(50);
  });

  it("trekt compliance-punten af bij ontbrekend vereist credential", () => {
    const r = computeMatchScore({ ...base, credentials: [] }, now);
    expect(r.compliance.status).toBe("NON_COMPLIANT");
    expect(r.breakdown.compliance).toBe(0);
  });

  describe("semantische component (inhoudelijke aansluiting)", () => {
    // base zonder de vaste relatednessScore, zodat we de bijdrage geïsoleerd variëren.
    const noText: MatchInput = {
      ...base,
      freelancer: { ...base.freelancer, relatednessScore: undefined },
    };

    it("zonder relatednessScore is de semantic-component 0 (geen bonus, geen straf)", () => {
      const r = computeMatchScore(noText, now);
      expect(r.breakdown.semantic).toBe(0);
      // Perfect op alle overige assen, zonder tekst: exact 100 − WEIGHTS.semantic = 95.
      expect(r.score).toBe(100 - MATCH_COMPONENT_MAX.semantic);
      // De som van de breakdown blijft exact de getoonde score (geen black box).
      expect(sumBreakdown(r.breakdown)).toBe(r.score);
      expect(r.reasons.map((re) => re.label)).not.toContain(
        "Omschrijving sluit aan bij jouw profiel",
      );
    });

    it("volledige aansluiting geeft de volle semantic-punten en telt exact op tot de score", () => {
      const r = computeMatchScore(
        { ...noText, freelancer: { ...noText.freelancer, relatednessScore: 1 } },
        now,
      );
      expect(r.breakdown.semantic).toBe(MATCH_COMPONENT_MAX.semantic);
      expect(r.score).toBe(100);
      expect(sumBreakdown(r.breakdown)).toBe(r.score);
    });

    it("houdt de semantic-bijdrage altijd binnen 0..max, ook bij grenswaarden", () => {
      for (const rel of [0, 0.2, 0.5, 0.75, 1]) {
        const r = computeMatchScore(
          { ...noText, freelancer: { ...noText.freelancer, relatednessScore: rel } },
          now,
        );
        expect(r.breakdown.semantic).toBeGreaterThanOrEqual(0);
        expect(r.breakdown.semantic).toBeLessThanOrEqual(MATCH_COMPONENT_MAX.semantic);
        expect(sumBreakdown(r.breakdown)).toBe(r.score);
      }
    });

    it("hogere aansluiting scoort hoger dan lagere (monotone, uitlegbare bijdrage)", () => {
      const low = computeMatchScore(
        { ...noText, freelancer: { ...noText.freelancer, relatednessScore: 0.1 } },
        now,
      );
      const high = computeMatchScore(
        { ...noText, freelancer: { ...noText.freelancer, relatednessScore: 0.9 } },
        now,
      );
      expect(high.score).toBeGreaterThan(low.score);
    });

    it("voegt de positieve reason toe vanaf de drempel, en niet eronder", () => {
      const below = computeMatchScore(
        {
          ...noText,
          freelancer: {
            ...noText.freelancer,
            relatednessScore: SEMANTIC_HIGHLIGHT_THRESHOLD - 0.01,
          },
        },
        now,
      );
      const atOrAbove = computeMatchScore(
        {
          ...noText,
          freelancer: { ...noText.freelancer, relatednessScore: SEMANTIC_HIGHLIGHT_THRESHOLD },
        },
        now,
      );
      expect(below.reasons.map((re) => re.label)).not.toContain(
        "Omschrijving sluit aan bij jouw profiel",
      );
      expect(atOrAbove.reasons.map((re) => re.label)).toContain(
        "Omschrijving sluit aan bij jouw profiel",
      );
      // De semantische reason komt ná skills en branche (kleiner gewicht).
      const labels = atOrAbove.reasons.map((re) => re.label);
      const skillIdx = labels.indexOf("Alle vereiste skills aanwezig");
      const semIdx = labels.indexOf("Omschrijving sluit aan bij jouw profiel");
      expect(semIdx).toBeGreaterThan(skillIdx);
    });
  });

  it("blijft binnen 0-100", () => {
    const r = computeMatchScore(
      {
        ...base,
        freelancerSkillIds: [],
        credentials: [],
        freelancer: {
          hourlyRate: 500,
          workMode: "ONSITE",
          location: "Groningen",
          availability: "AVAILABLE",
        },
      },
      now,
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("straft een tarief ruim boven het maximum", () => {
    const cheap = computeMatchScore(base, now);
    const pricey = computeMatchScore(
      { ...base, freelancer: { ...base.freelancer, hourlyRate: 180 } },
      now,
    );
    expect(pricey.breakdown.rate).toBeLessThan(cheap.breakdown.rate);
  });

  it("geeft alleen positieve reasons bij een perfecte match", () => {
    const r = computeMatchScore(base, now);
    expect(r.reasons.every((re) => re.kind === "positive")).toBe(true);
    expect(r.reasons.map((re) => re.label)).toContain("Alle vereiste skills aanwezig");
    expect(r.reasons.map((re) => re.label)).toContain("Voldoet aan de certificaateisen");
    expect(r.reasons.map((re) => re.label)).toContain("Tarief past binnen het budget");
    expect(r.reasons.map((re) => re.label)).toContain("Werkmodus komt overeen");
  });

  it("geeft een gap-reason met correct X/Y bij ontbrekende vereiste skills", () => {
    const r = computeMatchScore({ ...base, freelancerSkillIds: ["react"] }, now);
    const gap = r.reasons.find((re) => re.kind === "gap" && re.label.includes("vereiste skills"));
    expect(gap).toBeDefined();
    // base has 2 required skills; freelancer has 1, so missing = 1 of 2
    expect(gap?.label).toBe("Mist 1 van 2 vereiste skills");
  });

  it("geeft een compliance gap-reason bij ontbrekend vereist credential", () => {
    const r = computeMatchScore({ ...base, credentials: [] }, now);
    const gap = r.reasons.find((re) => re.kind === "gap" && re.label.includes("certificaat"));
    expect(gap).toBeDefined();
    expect(gap?.label).toBe("Mist vereist certificaat");
  });

  it("weegt reistijd mee bij een max. reistijd: binnen bereik = volledige locatie-score", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Amsterdam" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Amsterdam",
          maxTravelMinutes: 60,
        },
      },
      now,
    );
    expect(r.breakdown.location).toBe(MATCH_COMPONENT_MAX.location);
  });

  it("schaalt de locatie-score terug als de opdracht buiten de max. reistijd ligt", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Venlo" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Amsterdam",
          maxTravelMinutes: 60,
        },
      },
      now,
    );
    expect(r.breakdown.location).toBeLessThan(MATCH_COMPONENT_MAX.location);
  });

  it("valt zonder max. reistijd terug op stad-vergelijking (gedrag ongewijzigd)", () => {
    const same = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Amsterdam" },
        freelancer: { ...base.freelancer, workMode: "ONSITE", location: "Amsterdam" },
      },
      now,
    );
    const other = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Venlo" },
        freelancer: { ...base.freelancer, workMode: "ONSITE", location: "Amsterdam" },
      },
      now,
    );
    expect(same.breakdown.location).toBe(MATCH_COMPONENT_MAX.location);
    expect(other.breakdown.location).toBeLessThan(MATCH_COMPONENT_MAX.location);
  });

  it("toont een positieve reistijd-reason als de opdracht binnen de max. reistijd ligt", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Rotterdam" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Amsterdam",
          maxTravelMinutes: 120,
        },
      },
      now,
    );
    const travel = r.reasons.find((re) => re.label.includes("reistijd"));
    expect(travel?.kind).toBe("positive");
    expect(travel?.label).toMatch(/Binnen je max\. reistijd \(ca\. \d+ min\)/);
  });

  it("toont een gap-reason met de reistijd als de opdracht erbuiten ligt", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Venlo" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Amsterdam",
          maxTravelMinutes: 30,
        },
      },
      now,
    );
    const travel = r.reasons.find((re) => re.label.includes("reistijd"));
    expect(travel?.kind).toBe("gap");
    expect(travel?.label).toMatch(/Verder dan je max\. reistijd \(ca\. \d+ min\)/);
  });

  it("toont geen reistijd-reason zonder opgegeven max. reistijd", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Venlo" },
        freelancer: { ...base.freelancer, workMode: "ONSITE", location: "Amsterdam" },
      },
      now,
    );
    expect(r.reasons.some((re) => re.label.includes("reistijd"))).toBe(false);
  });

  it("negeert reistijd bij een onbekende plaats (terugval op stad-vergelijking)", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Atlantis" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Amsterdam",
          maxTravelMinutes: 30,
        },
      },
      now,
    );
    // Onbekende plaats → estimateTravelMinutes null → stad-vergelijking: verschillende steden → 0.4×.
    expect(r.breakdown.location).toBeLessThan(MATCH_COMPONENT_MAX.location);
    expect(r.breakdown.location).toBeGreaterThan(0);
  });

  it("gebruikt vooraf geroute minuten boven de offline plaatsnaam-schatting", () => {
    const r = computeMatchScore(
      {
        ...base,
        job: { ...base.job, workMode: "ONSITE", location: "Onbekende opdrachtlocatie" },
        freelancer: {
          ...base.freelancer,
          workMode: "ONSITE",
          location: "Onbekende woonplaats",
          maxTravelMinutes: 30,
          routedTravelMinutesToJob: 20,
        },
      },
      now,
    );
    expect(r.breakdown.location).toBe(MATCH_COMPONENT_MAX.location);
    expect(r.reasons.find((re) => re.label.includes("reistijd"))?.label).toContain("20 min");
  });

  it("voegt een positieve reason toe bij AVAILABLE zonder de score te wijzigen", () => {
    const baseline = computeMatchScore(
      { ...base, freelancer: { ...base.freelancer, availability: "UNKNOWN" } },
      now,
    );
    const r = computeMatchScore(base, now);
    expect(r.score).toBe(baseline.score);
    expect(r.breakdown).toEqual(baseline.breakdown);
    expect(r.availability.status).toBe("AVAILABLE");
    expect(r.availability.reason).toEqual({ kind: "positive", label: "Direct beschikbaar" });
    expect(r.reasons.map((re) => re.label)).toContain("Direct beschikbaar");
  });

  it("geeft een gap-reason bij UNAVAILABLE", () => {
    const r = computeMatchScore(
      { ...base, freelancer: { ...base.freelancer, availability: "UNAVAILABLE" } },
      now,
    );
    expect(r.availability.status).toBe("UNAVAILABLE");
    const gap = r.reasons.find(
      (re) => re.kind === "gap" && re.label === "Momenteel niet beschikbaar",
    );
    expect(gap).toBeDefined();
  });

  it("geeft geen beschikbaarheids-reason bij UNKNOWN", () => {
    const r = computeMatchScore(
      { ...base, freelancer: { ...base.freelancer, availability: "UNKNOWN" } },
      now,
    );
    expect(r.availability.status).toBe("UNKNOWN");
    expect(r.availability.reason).toBeNull();
    expect(r.reasons.map((re) => re.label)).not.toContain("Direct beschikbaar");
    expect(r.reasons.map((re) => re.label)).not.toContain("Momenteel niet beschikbaar");
  });

  it("laat een AVAILABLE-venster een losse UNAVAILABLE-status overschrijven", () => {
    const r = computeMatchScore(
      {
        ...base,
        freelancer: {
          ...base.freelancer,
          availability: "UNAVAILABLE",
          availabilityWindows: [
            {
              startDate: new Date("2026-05-01T00:00:00Z"),
              endDate: new Date("2026-06-30T00:00:00Z"),
              type: "AVAILABLE",
            },
          ],
        },
      },
      now,
    );
    expect(r.availability.status).toBe("AVAILABLE");
    expect(r.availability.reason).toEqual({ kind: "positive", label: "Direct beschikbaar" });
  });
});

describe("jobProfileRelatedness", () => {
  it("is 0 als aan één kant geen tekst staat (geen straf op ontbrekende tekst)", () => {
    expect(
      jobProfileRelatedness({ title: "IC-verpleegkundige" }, { headline: null, bio: null }),
    ).toBe(0);
    expect(
      jobProfileRelatedness({ title: null, description: null }, { bio: "React developer" }),
    ).toBe(0);
  });

  it("is hoger bij inhoudelijk aansluitende tekst dan bij niet-aansluitende", () => {
    const job = {
      title: "Intensive care verpleegkundige",
      description: "IC-verpleegkundige gezocht voor nachtdiensten op de intensive care",
    };
    const aligned = jobProfileRelatedness(job, {
      headline: "Intensive care verpleegkundige",
      bio: "Ervaren op de intensive care met nachtdiensten",
    });
    const unrelated = jobProfileRelatedness(job, {
      headline: "Frontend developer",
      bio: "React en TypeScript, webapplicaties",
    });
    expect(aligned).toBeGreaterThan(unrelated);
  });
});

describe("scoreJobForFreelancer — centrale, consistente relatedness (geen cross-view drift)", () => {
  const job = {
    title: "Intensive care verpleegkundige",
    description: "Ervaren IC-verpleegkundige gezocht voor de nachtdiensten op de intensive care",
    skills: [{ skillId: "sk-ic", required: true }],
    credentialRequirements: [] as { credentialType: string; required: boolean }[],
    rateMin: 40,
    rateMax: 70,
    workMode: "ONSITE",
    location: "Amsterdam",
    industryId: "zorg",
  };
  const freelancer = {
    headline: "Intensive care verpleegkundige",
    bio: "Jarenlange ervaring op de intensive care met nachtdiensten",
    skills: [{ skillId: "sk-ic" }],
    credentials: [] as { type: string; status: string; expiresAt: Date | null }[],
    hourlyRate: 55,
    workMode: "ONSITE",
    location: "Amsterdam",
    availability: "AVAILABLE",
    industries: [{ industryId: "zorg" }],
  };

  it("leidt relatedness af uit de tekstvelden als de aanroeper er geen meegeeft", () => {
    const derived = scoreJobForFreelancer(job, freelancer, now);
    expect(derived.breakdown.semantic).toBeGreaterThan(0);
  });

  it("scoort identiek of de relatedness nu is afgeleid of expliciet (zelfde paar → zelfde score)", () => {
    const rel = jobProfileRelatedness(
      { title: job.title, description: job.description },
      { headline: freelancer.headline, bio: freelancer.bio },
    );
    const derived = scoreJobForFreelancer(job, freelancer, now);
    const explicit = scoreJobForFreelancer(job, { ...freelancer, relatednessScore: rel }, now);
    expect(derived.score).toBe(explicit.score);
    expect(derived.breakdown).toEqual(explicit.breakdown);
  });

  it("een profiel zonder tekst scoort lager dan hetzelfde profiel mét aansluitende tekst", () => {
    const withText = scoreJobForFreelancer(job, freelancer, now);
    const withoutText = scoreJobForFreelancer(
      job,
      { ...freelancer, headline: null, bio: null },
      now,
    );
    expect(withText.score).toBeGreaterThan(withoutText.score);
    expect(withoutText.breakdown.semantic).toBe(0);
  });
});

describe("topPositiveReason", () => {
  it("geeft de eerste positieve reden (zwaarst wegende troef)", () => {
    expect(
      topPositiveReason([
        { kind: "gap", label: "Mist 1 van 3 vereiste skills" },
        { kind: "positive", label: "Voldoet aan de certificaateisen" },
        { kind: "positive", label: "Tarief past binnen het budget" },
      ]),
    ).toBe("Voldoet aan de certificaateisen");
  });

  it("geeft null zonder positieve reden", () => {
    expect(topPositiveReason([{ kind: "gap", label: "Mist vereist certificaat" }])).toBeNull();
    expect(topPositiveReason([])).toBeNull();
  });
});

describe("topGapReason", () => {
  it("geeft het eerste minpunt (zwaarst wegende gap)", () => {
    expect(
      topGapReason([
        { kind: "positive", label: "Voldoet aan de certificaateisen" },
        { kind: "gap", label: "Mist 1 van 3 vereiste skills" },
        { kind: "gap", label: "Tarief ligt boven het budget" },
      ]),
    ).toBe("Mist 1 van 3 vereiste skills");
  });

  it("geeft null zonder minpunt", () => {
    expect(topGapReason([{ kind: "positive", label: "Tarief past binnen het budget" }])).toBeNull();
    expect(topGapReason([])).toBeNull();
  });
});

describe("brancheFit", () => {
  it("is unknown als de opdracht geen branche heeft", () => {
    expect(brancheFit(null, ["zorg"])).toBe("unknown");
    expect(brancheFit(undefined, ["zorg"])).toBe("unknown");
  });

  it("is unknown als het profiel geen branche(s) heeft", () => {
    expect(brancheFit("zorg", [])).toBe("unknown");
    expect(brancheFit("zorg", undefined)).toBe("unknown");
  });

  it("is match bij overlap en mismatch zonder overlap", () => {
    expect(brancheFit("zorg", ["zorg", "onderwijs"])).toBe("match");
    expect(brancheFit("it", ["zorg", "onderwijs"])).toBe("mismatch");
  });
});

describe("computeMatchScore — branche-factor", () => {
  // Perfecte match (100) op alle andere assen, zodat we de branche-factor geïsoleerd zien.
  const perfect: MatchInput = {
    requiredSkillIds: ["react", "ts"],
    optionalSkillIds: ["next"],
    freelancerSkillIds: ["react", "ts", "next"],
    requiredCredentialTypes: ["VOG"],
    credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: future }],
    job: { rateMin: 60, rateMax: 90, workMode: "HYBRID", location: "Amsterdam", industryId: "it" },
    freelancer: {
      hourlyRate: 75,
      workMode: "HYBRID",
      location: "Amsterdam",
      availability: "AVAILABLE",
      industryIds: ["it"],
      // Volledige inhoudelijke aansluiting, zodat de branche-factor geïsoleerd tegen een 100-basis staat.
      relatednessScore: 1,
    },
  };

  const sumBreakdown = (b: MatchResult["breakdown"]) =>
    b.skills + b.compliance + b.rate + b.workMode + b.location + b.semantic + b.branche;

  it("laat de score ongemoeid bij gelijke branche (+ positieve reason, branche-delta 0)", () => {
    const r = computeMatchScore(perfect, now);
    expect(r.score).toBe(100);
    expect(r.breakdown.branche).toBe(0);
    expect(r.reasons.map((re) => re.label)).toContain("Zelfde branche als jouw profiel");
  });

  it("cap't en straft de score fors af bij een branche-mismatch (+ gap-reason)", () => {
    const r = computeMatchScore(
      { ...perfect, freelancer: { ...perfect.freelancer, industryIds: ["zorg"] } },
      now,
    );
    // rawScore 100 → min(100-25, 60) = 60 (de cap bindt).
    expect(r.score).toBe(BRANCHE_MISMATCH_CAP);
    expect(topGapReason(r.reasons)).toBe("Andere branche dan jouw profiel");
    // De branche-correctie is als expliciete negatieve component opgenomen: de som van de
    // breakdown blijft exact de getoonde score (geen black box).
    expect(r.breakdown.branche).toBe(BRANCHE_MISMATCH_CAP - 100);
    expect(sumBreakdown(r.breakdown)).toBe(r.score);
  });

  it("trekt de penalty af als die onder de cap uitkomt (cap bindt niet)", () => {
    // Zwakkere basis zodat rawScore-25 onder de cap zakt: mist alle vereiste skills.
    const weak = computeMatchScore(
      {
        ...perfect,
        freelancerSkillIds: [],
        freelancer: { ...perfect.freelancer, industryIds: ["zorg"] },
      },
      now,
    );
    const weakSameBranche = computeMatchScore({ ...perfect, freelancerSkillIds: [] }, now);
    expect(weak.score).toBe(Math.max(0, weakSameBranche.score - BRANCHE_PENALTY));
    expect(weak.score).toBeLessThan(BRANCHE_MISMATCH_CAP);
    expect(weak.breakdown.branche).toBe(-BRANCHE_PENALTY);
    expect(sumBreakdown(weak.breakdown)).toBe(weak.score);
  });

  it("blijft neutraal (geen straf, geen reason) bij onbekende branche", () => {
    const noJobIndustry = computeMatchScore(
      { ...perfect, job: { ...perfect.job, industryId: null } },
      now,
    );
    expect(noJobIndustry.score).toBe(100);
    expect(noJobIndustry.reasons.map((re) => re.label)).not.toContain(
      "Andere branche dan jouw profiel",
    );
    expect(noJobIndustry.reasons.map((re) => re.label)).not.toContain(
      "Zelfde branche als jouw profiel",
    );

    const noProfileIndustry = computeMatchScore(
      { ...perfect, freelancer: { ...perfect.freelancer, industryIds: [] } },
      now,
    );
    expect(noProfileIndustry.score).toBe(100);
  });

  it("houdt de score binnen 0-100 bij mismatch op een lage basis", () => {
    const r = computeMatchScore(
      {
        ...perfect,
        requiredSkillIds: ["x"],
        optionalSkillIds: [],
        freelancerSkillIds: [],
        credentials: [],
        job: { rateMin: null, rateMax: null, workMode: "ONSITE", location: "A", industryId: "it" },
        freelancer: {
          hourlyRate: null,
          workMode: "REMOTE",
          location: "B",
          availability: "AVAILABLE",
          industryIds: ["zorg"],
        },
      },
      now,
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(sumBreakdown(r.breakdown)).toBe(r.score);
  });

  it("de detail-kopscore en de aanbevelingsscore zijn identiek voor hetzelfde paar (consistentie)", () => {
    // Regressie voor de agent-review-blocker: dezelfde logische opdracht+profiel-combinatie moet
    // overal dezelfde score geven, ongeacht welke caller hem berekent. De branche-factor mag niet
    // afhangen van of een caller de industries toevallig laadt — alle scoring-paden voeden hem nu.
    const input: MatchInput = {
      ...perfect,
      freelancer: { ...perfect.freelancer, industryIds: ["zorg"] },
    };
    expect(computeMatchScore(input, now).score).toBe(computeMatchScore(input, now).score);
    expect(computeMatchScore(input, now).score).toBe(BRANCHE_MISMATCH_CAP);
  });
});
