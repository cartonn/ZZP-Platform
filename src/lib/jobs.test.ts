import { describe, expect, it } from "vitest";
import {
  assertJobTransition,
  canPublish,
  canTransitionJob,
  JobTransitionError,
  normalizeJobFilters,
} from "@/lib/jobs";

describe("job-statusovergangen", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransitionJob("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransitionJob("PUBLISHED", "CLOSED")).toBe(true);
    expect(canTransitionJob("PUBLISHED", "DRAFT")).toBe(true);
    expect(canTransitionJob("CLOSED", "PUBLISHED")).toBe(true);
  });

  it("weigert ongeldige overgangen", () => {
    expect(canTransitionJob("CLOSED", "DRAFT")).toBe(false);
    expect(canTransitionJob("DRAFT", "DRAFT")).toBe(false);
    expect(() => assertJobTransition("CLOSED", "DRAFT")).toThrow(JobTransitionError);
  });
});

describe("canPublish", () => {
  it("vereist titel én omschrijving", () => {
    expect(canPublish({ title: "Dev", description: "Werk" })).toBe(true);
    expect(canPublish({ title: "Dev", description: "" })).toBe(false);
    expect(canPublish({ title: "  ", description: "Werk" })).toBe(false);
  });
});

describe("normalizeJobFilters", () => {
  it("levert veilige defaults bij lege input", () => {
    const f = normalizeJobFilters({});
    // "match" (beste match eerst) is de standaardsortering — de kern-differentiator van het platform.
    expect(f).toMatchObject({ q: "", skillIds: [], sort: "match", page: 1 });
    expect(f.workMode).toBeUndefined();
    expect(f.rateMin).toBeUndefined();
  });

  it("negeert onbekende enum-waarden", () => {
    const f = normalizeJobFilters({ workMode: "TELEPORT", requiredCredential: "FOO", sort: "x" });
    expect(f.workMode).toBeUndefined();
    expect(f.requiredCredential).toBeUndefined();
    expect(f.sort).toBe("match");
  });

  it("accepteert 'match' als sortering", () => {
    expect(normalizeJobFilters({ sort: "match" }).sort).toBe("match");
    expect(normalizeJobFilters({ sort: "recent" }).sort).toBe("recent");
  });

  it("accepteert geldige enums en parseert tarief-range", () => {
    const f = normalizeJobFilters({
      workMode: "REMOTE",
      requiredCredential: "VOG",
      rateMin: "50",
      rateMax: "90",
      sort: "rate_desc",
    });
    expect(f.workMode).toBe("REMOTE");
    expect(f.requiredCredential).toBe("VOG");
    expect(f.rateMin).toBe(50);
    expect(f.rateMax).toBe(90);
    expect(f.sort).toBe("rate_desc");
  });

  it("verwisselt een omgekeerde tarief-range", () => {
    const f = normalizeJobFilters({ rateMin: "90", rateMax: "50" });
    expect(f.rateMin).toBe(50);
    expect(f.rateMax).toBe(90);
  });

  it("dedupliceert skillIds en clampt page >= 1", () => {
    const f = normalizeJobFilters({ skillIds: ["a", "a", "b"], page: "0" });
    expect(f.skillIds).toEqual(["a", "b"]);
    expect(f.page).toBe(1);
  });

  it("ondersteunt meerdere skillIds én een enkele string", () => {
    expect(normalizeJobFilters({ skillIds: "solo" }).skillIds).toEqual(["solo"]);
    expect(normalizeJobFilters({ skillIds: ["x", "y"] }).skillIds).toEqual(["x", "y"]);
  });

  it("trimt en begrenst de locatie-filter; leeg wordt undefined", () => {
    expect(normalizeJobFilters({ location: "  Amsterdam  " }).location).toBe("Amsterdam");
    expect(normalizeJobFilters({ location: "   " }).location).toBeUndefined();
    expect(normalizeJobFilters({}).location).toBeUndefined();
    expect(normalizeJobFilters({ location: "x".repeat(200) }).location).toHaveLength(80);
  });

  it("parseert de 'Mijn vakgebied'-quickfilter alleen bij exact '1'", () => {
    expect(normalizeJobFilters({}).mine).toBe(false);
    expect(normalizeJobFilters({ mine: "1" }).mine).toBe(true);
    expect(normalizeJobFilters({ mine: "0" }).mine).toBe(false);
    expect(normalizeJobFilters({ mine: "true" }).mine).toBe(false);
    // Bij een herhaalde param telt de eerste waarde.
    expect(normalizeJobFilters({ mine: ["1", "0"] }).mine).toBe(true);
  });
});
