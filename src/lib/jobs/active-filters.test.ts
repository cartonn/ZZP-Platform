import { describe, it, expect } from "vitest";
import type { JobFilters } from "@/lib/jobs";
import {
  describeActiveJobFilters,
  hasActiveJobFilters,
  type JobFilterLookups,
} from "@/lib/jobs/active-filters";

/** Bouw een volledig getypeerd JobFilters-object met veilige defaults (geen actieve filters). */
function makeFilters(overrides: Partial<JobFilters> = {}): JobFilters {
  return {
    q: "",
    skillIds: [],
    industryId: undefined,
    mine: false,
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

const emptyLookups: JobFilterLookups = { industries: [], skills: [] };

describe("describeActiveJobFilters", () => {
  it("levert geen chips voor lege filters", () => {
    expect(describeActiveJobFilters(makeFilters(), emptyLookups)).toEqual([]);
    expect(hasActiveJobFilters(makeFilters())).toBe(false);
  });

  it("maakt een chip voor een zoekterm", () => {
    const chips = describeActiveJobFilters(makeFilters({ q: "verpleegkundige" }), emptyLookups);
    expect(chips).toEqual([{ id: "q", label: 'Zoekterm: "verpleegkundige"', param: "q" }]);
  });

  it("gebruikt de branchenaam uit de lookup", () => {
    const chips = describeActiveJobFilters(makeFilters({ industryId: "ind-1" }), {
      industries: [{ id: "ind-1", name: "Zorg" }],
      skills: [],
    });
    expect(chips).toEqual([{ id: "industry", label: "Branche: Zorg", param: "industryId" }]);
  });

  it("valt terug op label 'Branche' bij een onbekende industryId", () => {
    const chips = describeActiveJobFilters(makeFilters({ industryId: "ghost" }), emptyLookups);
    expect(chips).toEqual([{ id: "industry", label: "Branche", param: "industryId" }]);
  });

  it("toont 'Mijn vakgebied' als mine true is zonder industryId", () => {
    const chips = describeActiveJobFilters(makeFilters({ mine: true }), emptyLookups);
    expect(chips).toEqual([{ id: "mine", label: "Mijn vakgebied", param: "mine" }]);
  });

  it("onderdrukt de mine-chip als een industryId gezet is (industryId wint)", () => {
    const chips = describeActiveJobFilters(makeFilters({ mine: true, industryId: "ind-1" }), {
      industries: [{ id: "ind-1", name: "Bouw" }],
      skills: [],
    });
    expect(chips).toEqual([{ id: "industry", label: "Branche: Bouw", param: "industryId" }]);
    expect(chips.some((c) => c.id === "mine")).toBe(false);
  });

  it("maakt per skillId een chip met value en naam uit de lookup", () => {
    const chips = describeActiveJobFilters(makeFilters({ skillIds: ["s1", "s2"] }), {
      industries: [],
      skills: [
        { id: "s1", name: "Wondverzorging" },
        { id: "s2", name: "Medicatie" },
      ],
    });
    expect(chips).toEqual([
      { id: "skill:s1", label: "Wondverzorging", param: "skillIds", value: "s1" },
      { id: "skill:s2", label: "Medicatie", param: "skillIds", value: "s2" },
    ]);
  });

  it("valt terug op 'Vaardigheid' bij een onbekende skillId", () => {
    const chips = describeActiveJobFilters(makeFilters({ skillIds: ["x"] }), emptyLookups);
    expect(chips).toEqual([{ id: "skill:x", label: "Vaardigheid", param: "skillIds", value: "x" }]);
  });

  it("mapt de werkvorm-labels correct", () => {
    expect(
      describeActiveJobFilters(makeFilters({ workMode: "REMOTE" }), emptyLookups)[0]?.label,
    ).toBe("Remote");
    expect(
      describeActiveJobFilters(makeFilters({ workMode: "ONSITE" }), emptyLookups)[0]?.label,
    ).toBe("Op locatie");
    expect(
      describeActiveJobFilters(makeFilters({ workMode: "HYBRID" }), emptyLookups)[0]?.label,
    ).toBe("Hybride");
  });

  it("maakt een chip voor locatie", () => {
    const chips = describeActiveJobFilters(makeFilters({ location: "Utrecht" }), emptyLookups);
    expect(chips).toEqual([{ id: "location", label: "Locatie: Utrecht", param: "location" }]);
  });

  it("maakt chips voor rateMin en rateMax", () => {
    expect(describeActiveJobFilters(makeFilters({ rateMin: 45 }), emptyLookups)).toEqual([
      { id: "rateMin", label: "Min. € 45/uur", param: "rateMin" },
    ]);
    expect(describeActiveJobFilters(makeFilters({ rateMax: 90 }), emptyLookups)).toEqual([
      { id: "rateMax", label: "Max. € 90/uur", param: "rateMax" },
    ]);
  });

  it("maakt een chip bij rateMin/rateMax gelijk aan 0", () => {
    const chips = describeActiveJobFilters(makeFilters({ rateMin: 0, rateMax: 0 }), emptyLookups);
    expect(chips.map((c) => c.id)).toEqual(["rateMin", "rateMax"]);
  });

  it("mapt de certificaat-labels correct", () => {
    expect(
      describeActiveJobFilters(makeFilters({ requiredCredential: "VOG" }), emptyLookups)[0]?.label,
    ).toBe("Certificaat: VOG");
    expect(
      describeActiveJobFilters(makeFilters({ requiredCredential: "DIPLOMA" }), emptyLookups)[0]
        ?.label,
    ).toBe("Certificaat: Diploma");
    expect(
      describeActiveJobFilters(makeFilters({ requiredCredential: "INSURANCE" }), emptyLookups)[0]
        ?.label,
    ).toBe("Certificaat: Verzekering");
  });

  it("houdt een deterministische volgorde met alle filters actief", () => {
    const chips = describeActiveJobFilters(
      makeFilters({
        q: "zorg",
        industryId: "ind-1",
        skillIds: ["s1"],
        workMode: "HYBRID",
        location: "Amsterdam",
        rateMin: 40,
        rateMax: 80,
        requiredCredential: "VOG",
      }),
      {
        industries: [{ id: "ind-1", name: "Zorg" }],
        skills: [{ id: "s1", name: "Wondverzorging" }],
      },
    );
    expect(chips.map((c) => c.id)).toEqual([
      "q",
      "industry",
      "skill:s1",
      "workMode",
      "location",
      "rateMin",
      "rateMax",
      "requiredCredential",
    ]);
  });
});

describe("hasActiveJobFilters", () => {
  it("negeert sort en page als actieve filter", () => {
    expect(hasActiveJobFilters(makeFilters({ sort: "recent", page: 3 }))).toBe(false);
    expect(
      describeActiveJobFilters(makeFilters({ sort: "recent", page: 3 }), emptyLookups),
    ).toEqual([]);
  });

  it("is true zodra er één filter actief is", () => {
    expect(hasActiveJobFilters(makeFilters({ mine: true }))).toBe(true);
    expect(hasActiveJobFilters(makeFilters({ rateMin: 10 }))).toBe(true);
  });

  it("werkt zonder lookups (labels vereisen geen lookups)", () => {
    expect(hasActiveJobFilters(makeFilters({ industryId: "ind-1", skillIds: ["s1"] }))).toBe(true);
  });
});
