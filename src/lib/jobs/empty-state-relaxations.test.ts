import { describe, it, expect } from "vitest";
import type { JobFilters } from "@/lib/jobs";
import {
  buildRelaxationCandidates,
  rankRelaxations,
  type RelaxationKind,
  type RelaxationSuggestion,
} from "@/lib/jobs/empty-state-relaxations";

/** Bouw een volledig getypeerd JobFilters-object met veilige defaults (geen actieve filters). */
function makeFilters(overrides: Partial<JobFilters> = {}): JobFilters {
  return {
    q: "",
    skillIds: [],
    industryId: undefined,
    mine: false,
    hideApplied: false,
    onlyEligible: false,
    location: undefined,
    workMode: undefined,
    rateMin: undefined,
    rateMax: undefined,
    requiredCredential: undefined,
    sort: "match",
    page: 1,
    ...overrides,
  };
}

function suggestion(kind: RelaxationKind, count: number): RelaxationSuggestion {
  return { kind, label: kind, count, href: `/opdrachten?${kind}` };
}

describe("buildRelaxationCandidates", () => {
  it("levert niets zonder actieve filters", () => {
    expect(buildRelaxationCandidates(makeFilters())).toEqual([]);
  });

  it("biedt 'alle vakgebieden' bij de mine-quickfilter en wist mine", () => {
    const candidates = buildRelaxationCandidates(makeFilters({ mine: true }));
    expect(candidates).toHaveLength(1);
    const c = candidates[0]!;
    expect(c.kind).toBe("vakgebied");
    expect(c.filters.mine).toBe(false);
    expect(c.filters.industryId).toBeUndefined();
  });

  it("wist zowel een expliciete branche als mine voor de vakgebied-verbreding", () => {
    const c = buildRelaxationCandidates(makeFilters({ industryId: "ind-1", mine: true }))[0]!;
    expect(c.kind).toBe("vakgebied");
    expect(c.filters.industryId).toBeUndefined();
    expect(c.filters.mine).toBe(false);
  });

  it("zet page terug naar 1 op elke versoepeling", () => {
    const c = buildRelaxationCandidates(makeFilters({ mine: true, page: 4 }))[0]!;
    expect(c.filters.page).toBe(1);
  });

  it("houdt de overige actieve filters intact (relaxt precies één dimensie)", () => {
    const c = buildRelaxationCandidates(
      makeFilters({ mine: true, workMode: "REMOTE", q: "zorg" }),
    )[0]!;
    // De vakgebied-verbreding raakt alleen vakgebied; werkvorm en zoekterm blijven staan.
    expect(c.kind).toBe("vakgebied");
    expect(c.filters.workMode).toBe("REMOTE");
    expect(c.filters.q).toBe("zorg");
  });

  it("levert een kandidaat per actieve DB-where-filter in vaste volgorde", () => {
    const candidates = buildRelaxationCandidates(
      makeFilters({
        q: "zorg",
        mine: true,
        hideApplied: true,
        location: "Utrecht",
        workMode: "ONSITE",
        rateMin: 40,
        skillIds: ["s1"],
        requiredCredential: "VOG",
      }),
    );
    expect(candidates.map((c) => c.kind)).toEqual([
      "vakgebied",
      "requiredCredential",
      "skills",
      "workMode",
      "rate",
      "location",
      "hideApplied",
      "q",
    ]);
  });

  it("relaxt beide tariefgrenzen als één kandidaat", () => {
    const candidates = buildRelaxationCandidates(makeFilters({ rateMin: 40, rateMax: 80 }));
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.kind).toBe("rate");
    expect(candidates[0]!.filters.rateMin).toBeUndefined();
    expect(candidates[0]!.filters.rateMax).toBeUndefined();
  });

  it("negeert een lege zoekterm (alleen witruimte telt niet als filter)", () => {
    expect(buildRelaxationCandidates(makeFilters({ q: "   " }))).toEqual([]);
  });

  it("biedt bij onlyEligible uitsluitend het versoepelen van onlyEligible zelf aan", () => {
    const candidates = buildRelaxationCandidates(
      makeFilters({ onlyEligible: true, mine: true, workMode: "REMOTE" }),
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.kind).toBe("onlyEligible");
    expect(candidates[0]!.filters.onlyEligible).toBe(false);
    // De overige filters blijven staan; alleen onlyEligible gaat uit.
    expect(candidates[0]!.filters.mine).toBe(true);
    expect(candidates[0]!.filters.workMode).toBe("REMOTE");
  });
});

describe("rankRelaxations", () => {
  it("laat versoepelingen zonder treffers weg", () => {
    const ranked = rankRelaxations([suggestion("vakgebied", 0), suggestion("workMode", 5)]);
    expect(ranked.map((s) => s.kind)).toEqual(["workMode"]);
  });

  it("sorteert op meeste treffers eerst", () => {
    const ranked = rankRelaxations([
      suggestion("workMode", 3),
      suggestion("vakgebied", 12),
      suggestion("location", 7),
    ]);
    expect(ranked.map((s) => s.count)).toEqual([12, 7]);
  });

  it("breekt gelijke aantallen met de vaste voorkeursvolgorde (vakgebied vóór location)", () => {
    const ranked = rankRelaxations([suggestion("location", 5), suggestion("vakgebied", 5)]);
    expect(ranked.map((s) => s.kind)).toEqual(["vakgebied", "location"]);
  });

  it("kapt op het maximum (standaard 2)", () => {
    const ranked = rankRelaxations([
      suggestion("vakgebied", 9),
      suggestion("workMode", 8),
      suggestion("location", 7),
    ]);
    expect(ranked).toHaveLength(2);
    expect(ranked.map((s) => s.kind)).toEqual(["vakgebied", "workMode"]);
  });

  it("respecteert een expliciet maximum", () => {
    const ranked = rankRelaxations(
      [suggestion("vakgebied", 9), suggestion("workMode", 8), suggestion("location", 7)],
      3,
    );
    expect(ranked).toHaveLength(3);
  });

  it("levert een lege lijst bij uitsluitend nul-treffers", () => {
    expect(rankRelaxations([suggestion("vakgebied", 0), suggestion("workMode", 0)])).toEqual([]);
  });
});
