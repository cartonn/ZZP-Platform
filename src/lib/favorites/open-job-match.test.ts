import { describe, expect, it } from "vitest";
import {
  bestOpenJobMatch,
  FLEXPOOL_MATCH_MIN_SCORE,
  type FlexpoolMatchJob,
} from "./open-job-match";
import { type FreelancerMatchSource } from "@/lib/matching";

// Een bewezen ZZP'er: skill s1, geen certificaat-issues, marktconform tarief, on-site in Utrecht.
const favorite: FreelancerMatchSource = {
  skills: [{ skillId: "s1" }],
  credentials: [],
  hourlyRate: 60,
  workMode: "ONSITE",
  location: "Utrecht",
  availability: "AVAILABLE",
  industries: [{ industryId: "zorg" }],
  headline: null,
  bio: null,
};

/** Een opdracht die perfect aansluit (skill s1, geen certificaat-eis, binnen budget, on-site Utrecht). */
function strongJob(id: string, title: string): FlexpoolMatchJob {
  return {
    id,
    title,
    skills: [{ skillId: "s1", required: true }],
    credentialRequirements: [],
    rateMin: 50,
    rateMax: 70,
    workMode: "ONSITE",
    location: "Utrecht",
    industryId: "zorg",
    description: null,
  } as FlexpoolMatchJob;
}

/** Een opdracht die niet aansluit: andere verplichte skill + verplicht certificaat dat ontbreekt. */
function weakJob(id: string, title: string): FlexpoolMatchJob {
  return {
    id,
    title,
    skills: [{ skillId: "andere-skill", required: true }],
    credentialRequirements: [{ credentialType: "VOG", required: true }],
    rateMin: 10,
    rateMax: 15,
    workMode: "REMOTE",
    location: "Groningen",
    industryId: "bouw",
    description: null,
  } as FlexpoolMatchJob;
}

describe("bestOpenJobMatch", () => {
  it("levert de sterkst matchende open opdracht op of boven de drempel", () => {
    const match = bestOpenJobMatch(
      [weakJob("w1", "Timmerman"), strongJob("s1job", "Verpleegkundige nacht")],
      favorite,
      new Set(),
    );
    expect(match).not.toBeNull();
    expect(match?.jobId).toBe("s1job");
    expect(match?.jobTitle).toBe("Verpleegkundige nacht");
    expect(match?.score).toBeGreaterThanOrEqual(FLEXPOOL_MATCH_MIN_SCORE);
  });

  it("kiest bij meerdere sterke opdrachten de hoogst-scorende", () => {
    const strong = strongJob("hi", "Sterk");
    // Zwakkere-maar-boven-drempel variant: tarief net boven budget drukt de score iets.
    const weaker: FlexpoolMatchJob = { ...strongJob("lo", "Iets minder"), rateMax: 40 };
    const match = bestOpenJobMatch([weaker, strong], favorite, new Set());
    expect(match?.jobId).toBe("hi");
    expect(match!.score).toBeGreaterThan(bestOpenJobMatch([weaker], favorite, new Set())!.score);
  });

  it("sluit opdrachten uit waarop de favoriet al reageerde (excludeJobIds)", () => {
    const jobs = [strongJob("applied", "Al gereageerd"), strongJob("open", "Nog open")];
    const match = bestOpenJobMatch(jobs, favorite, new Set(["applied"]));
    expect(match?.jobId).toBe("open");
  });

  it("retourneert null wanneer geen enkele open opdracht de drempel haalt", () => {
    const match = bestOpenJobMatch(
      [weakJob("w1", "Timmerman"), weakJob("w2", "Metselaar")],
      favorite,
      new Set(),
    );
    expect(match).toBeNull();
  });

  it("retourneert null bij een lege opdrachtenlijst", () => {
    expect(bestOpenJobMatch([], favorite, new Set())).toBeNull();
  });

  it("breekt gelijke scores deterministisch op titel (alfabetisch)", () => {
    // Twee identiek scorende opdrachten (favoriet zonder tekst → relatedness 0 voor beide).
    const a = strongJob("id-b", "Zorg B");
    const b = strongJob("id-a", "Zorg A");
    const match = bestOpenJobMatch([a, b], favorite, new Set());
    expect(match?.jobTitle).toBe("Zorg A");
    expect(match?.jobId).toBe("id-a");
  });

  it("vult een positieve reden in", () => {
    const match = bestOpenJobMatch([strongJob("s1job", "Verpleegkundige")], favorite, new Set());
    expect(match?.reason).toBeTruthy();
  });
});
