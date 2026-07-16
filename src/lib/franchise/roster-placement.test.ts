import { describe, expect, it } from "vitest";
import {
  countPlaceableDiensten,
  placeableChipLabel,
  placeableHeadline,
} from "@/lib/franchise/roster-placement";
import {
  DIENST_SUGGESTIE_LIMIT,
  DIENST_SUGGESTIE_MIN_SCORE,
} from "@/lib/franchise/dienst-suggesties";
import { type FreelancerMatchSource, type JobMatchSource } from "@/lib/matching";

const NOW = new Date("2026-07-16T12:00:00Z");

// Sterk profiel: alle skills, juiste branche, tarief binnen budget, beschikbaar, dezelfde stad.
function freelancer(over: Partial<FreelancerMatchSource> = {}): FreelancerMatchSource {
  return {
    skills: [{ skillId: "skill-verpleging" }, { skillId: "skill-wijkzorg" }],
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: null },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
    ],
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

function job(over: Partial<JobMatchSource> = {}): JobMatchSource {
  return {
    title: "Wijkverpleegkundige",
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

// Zwakke dienst: andere branche, werkmodus-mismatch, geen skill-overlap → onder de drempel.
const weakJob = job({
  title: "Iets anders",
  description: "Iets heel anders.",
  skills: [{ skillId: "skill-anders", required: true }],
  credentialRequirements: [],
  industryId: "ind-bouw",
  workMode: "REMOTE",
  location: "Groningen",
});

describe("countPlaceableDiensten", () => {
  it("telt alleen diensten op of boven de drempel", () => {
    expect(countPlaceableDiensten(freelancer(), [job(), job(), weakJob], NOW)).toBe(2);
  });

  it("geeft 0 bij geen open diensten", () => {
    expect(countPlaceableDiensten(freelancer(), [], NOW)).toBe(0);
  });

  it("geeft 0 wanneer geen enkele dienst de drempel haalt", () => {
    expect(countPlaceableDiensten(freelancer(), [weakJob, weakJob], NOW)).toBe(0);
  });

  it("gebruikt dezelfde drempel als de detail-suggestiekaart", () => {
    // Een dienst die net onder de drempel zou vallen bij een strengere grens telt hier mee zolang
    // de gedeelde DIENST_SUGGESTIE_MIN_SCORE hem toelaat — verhoog de drempel en de telling zakt.
    const strong = job();
    expect(countPlaceableDiensten(freelancer(), [strong], NOW)).toBe(1);
    expect(
      countPlaceableDiensten(freelancer(), [strong], NOW, DIENST_SUGGESTIE_MIN_SCORE + 1000),
    ).toBe(0);
  });
});

describe("placeableChipLabel", () => {
  it("enkelvoud bij 1", () => {
    expect(placeableChipLabel(1)).toBe("1 passende dienst");
  });

  it("meervoud bij >1", () => {
    expect(placeableChipLabel(3)).toBe("3 passende diensten");
  });

  it("toont het exacte getal tot en met de kaart-limiet", () => {
    // De detail-suggestiekaart toont exact zoveel rijen → chip mag het exacte getal claimen.
    expect(placeableChipLabel(DIENST_SUGGESTIE_LIMIT)).toBe(
      `${DIENST_SUGGESTIE_LIMIT} passende diensten`,
    );
  });

  it("begrenst tot 'N+' boven de kaart-limiet zodat lijst en detail elkaar niet tegenspreken", () => {
    // Zonder begrenzing zou de chip "8 passende diensten" claimen terwijl de detail-suggestiekaart
    // maar DIENST_SUGGESTIE_LIMIT (6) rijen toont — een DOEL 1b-tegenspraak. De chip toont "6+".
    expect(placeableChipLabel(DIENST_SUGGESTIE_LIMIT + 2)).toBe(
      `${DIENST_SUGGESTIE_LIMIT}+ passende diensten`,
    );
    expect(placeableChipLabel(50)).toBe(`${DIENST_SUGGESTIE_LIMIT}+ passende diensten`);
  });

  it("null bij 0 of negatief", () => {
    expect(placeableChipLabel(0)).toBeNull();
    expect(placeableChipLabel(-2)).toBeNull();
  });
});

describe("placeableHeadline", () => {
  it("enkelvoud bij 1", () => {
    expect(placeableHeadline(1)).toBe("1 vrije vakmens is direct plaatsbaar op een open dienst");
  });

  it("meervoud bij >1", () => {
    expect(placeableHeadline(4)).toBe(
      "4 vrije vakmensen zijn direct plaatsbaar op een open dienst",
    );
  });

  it("null bij 0", () => {
    expect(placeableHeadline(0)).toBeNull();
  });
});
