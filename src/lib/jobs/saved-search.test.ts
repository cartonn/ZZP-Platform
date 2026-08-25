import { describe, it, expect } from "vitest";
import type { JobFilters } from "@/lib/jobs";
import { normalizeJobFilters } from "@/lib/jobs";
import {
  jobFiltersToQueryString,
  savedSearchHref,
  savedSearchNameSchema,
  MAX_SAVED_SEARCH_NAME_LEN,
} from "@/lib/jobs/saved-search";

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

describe("jobFiltersToQueryString", () => {
  it("geeft een lege string voor een lege filterset", () => {
    expect(jobFiltersToQueryString(makeFilters())).toBe("");
  });

  it("neemt page nooit op (ook niet page:3)", () => {
    expect(jobFiltersToQueryString(makeFilters({ page: 3 }))).toBe("");
  });

  it("laat de default sort 'match' weg", () => {
    expect(jobFiltersToQueryString(makeFilters({ sort: "match" }))).toBe("");
  });

  it("neemt een niet-default sort wel op", () => {
    expect(jobFiltersToQueryString(makeFilters({ sort: "rate_desc" }))).toBe("sort=rate_desc");
  });

  it("sorteert skillIds deterministisch (canoniek): volgorde maakt niet uit", () => {
    const a = jobFiltersToQueryString(makeFilters({ skillIds: ["s2", "s1"] }));
    const b = jobFiltersToQueryString(makeFilters({ skillIds: ["s1", "s2"] }));
    expect(a).toBe(b);
    expect(a).toBe("skillIds=s1&skillIds=s2");
  });

  it("zet elk veld onder de juiste sleutel", () => {
    const qs = jobFiltersToQueryString(
      makeFilters({
        q: "zorg",
        industryId: "ind-1",
        mine: true,
        hideApplied: true,
        onlyEligible: true,
        location: "Utrecht",
        workMode: "ONSITE",
        rateMin: 40,
        rateMax: 80,
        requiredCredential: "VOG",
      }),
    );
    const params = new URLSearchParams(qs);
    expect(params.get("q")).toBe("zorg");
    expect(params.get("industryId")).toBe("ind-1");
    expect(params.get("mine")).toBe("1");
    expect(params.get("hideApplied")).toBe("1");
    expect(params.get("onlyEligible")).toBe("1");
    expect(params.get("location")).toBe("Utrecht");
    expect(params.get("workMode")).toBe("ONSITE");
    expect(params.get("rateMin")).toBe("40");
    expect(params.get("rateMax")).toBe("80");
    expect(params.get("requiredCredential")).toBe("VOG");
  });

  it("laat velden weg die niet gezet zijn", () => {
    const qs = jobFiltersToQueryString(makeFilters({ q: "zorg" }));
    expect(qs).toBe("q=zorg");
  });

  it("round-trip: normaliseren van de query behoudt de betekenisvolle velden", () => {
    const original = makeFilters({
      q: "zorg",
      skillIds: ["s1"],
      mine: true,
      workMode: "REMOTE",
      rateMin: 40,
      rateMax: 80,
      requiredCredential: "VOG",
      sort: "rate_desc",
    });
    const qs = jobFiltersToQueryString(original);
    const roundTripped = normalizeJobFilters(Object.fromEntries(new URLSearchParams(qs)));
    expect(roundTripped.q).toBe("zorg");
    expect(roundTripped.skillIds).toEqual(["s1"]);
    expect(roundTripped.mine).toBe(true);
    expect(roundTripped.workMode).toBe("REMOTE");
    expect(roundTripped.rateMin).toBe(40);
    expect(roundTripped.rateMax).toBe(80);
    expect(roundTripped.requiredCredential).toBe("VOG");
    expect(roundTripped.sort).toBe("rate_desc");
  });
});

describe("savedSearchHref", () => {
  it("geeft de kale /opdrachten voor een lege query", () => {
    expect(savedSearchHref("")).toBe("/opdrachten");
  });

  it("hangt een niet-lege query aan als querystring", () => {
    expect(savedSearchHref("q=zorg")).toBe("/opdrachten?q=zorg");
  });
});

describe("savedSearchNameSchema", () => {
  it("trimt een normale naam", () => {
    expect(savedSearchNameSchema.parse("  Zorg Amsterdam  ")).toBe("Zorg Amsterdam");
  });

  it("weigert een lege naam", () => {
    expect(savedSearchNameSchema.safeParse("").success).toBe(false);
  });

  it("weigert een naam van alleen whitespace", () => {
    expect(savedSearchNameSchema.safeParse("   ").success).toBe(false);
  });

  it("weigert een naam langer dan de limiet", () => {
    expect(savedSearchNameSchema.safeParse("x".repeat(MAX_SAVED_SEARCH_NAME_LEN + 1)).success).toBe(
      false,
    );
  });

  it("accepteert een naam op de limiet", () => {
    expect(savedSearchNameSchema.safeParse("x".repeat(MAX_SAVED_SEARCH_NAME_LEN)).success).toBe(
      true,
    );
  });
});
