import { describe, expect, it } from "vitest";
import {
  assertJobTransition,
  canPublish,
  canTransitionJob,
  JobTransitionError,
  normalizeJobFilters,
  parseMineParam,
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

  it("accepteert 'start_soon' (startdatum-sortering)", () => {
    expect(normalizeJobFilters({ sort: "start_soon" }).sort).toBe("start_soon");
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

  it("parseert de quickfilter-vlaggen (mine/hideApplied/onlyEligible) alleen op '1'", () => {
    const off = normalizeJobFilters({});
    expect(off.mine).toBe(false);
    expect(off.hideApplied).toBe(false);
    expect(off.onlyEligible).toBe(false);

    const on = normalizeJobFilters({ mine: "1", hideApplied: "1", onlyEligible: "1" });
    expect(on.mine).toBe(true);
    expect(on.hideApplied).toBe(true);
    expect(on.onlyEligible).toBe(true);

    // Alleen de exacte waarde "1" activeert de vlag; alles anders blijft false.
    expect(normalizeJobFilters({ onlyEligible: "true" }).onlyEligible).toBe(false);
    expect(normalizeJobFilters({ onlyEligible: "0" }).onlyEligible).toBe(false);
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

  it("'Mijn vakgebied' volgt de meegegeven standaard zolang de gebruiker niets koos", () => {
    // Geen param = geen keuze → de standaard van de pagina (ZZP'er mét profielbranches) telt.
    expect(normalizeJobFilters({}, { mine: true }).mine).toBe(true);
    expect(normalizeJobFilters({ mine: "true" }, { mine: true }).mine).toBe(true);
    // Een expliciete keuze wint altijd van de standaard — in beide richtingen.
    expect(normalizeJobFilters({ mine: "0" }, { mine: true }).mine).toBe(false);
    expect(normalizeJobFilters({ mine: "1" }, { mine: false }).mine).toBe(true);
  });

  it("parseMineParam is een tri-state: aan, uit, of geen keuze", () => {
    expect(parseMineParam("1")).toBe(true);
    expect(parseMineParam("0")).toBe(false);
    expect(parseMineParam(undefined)).toBeUndefined();
    expect(parseMineParam("ja")).toBeUndefined();
    expect(parseMineParam(["0", "1"])).toBe(false);
  });

  it("parseert de 'verberg waar ik op reageerde'-quickfilter alleen bij exact '1'", () => {
    expect(normalizeJobFilters({}).hideApplied).toBe(false);
    expect(normalizeJobFilters({ hideApplied: "1" }).hideApplied).toBe(true);
    expect(normalizeJobFilters({ hideApplied: "0" }).hideApplied).toBe(false);
    expect(normalizeJobFilters({ hideApplied: "true" }).hideApplied).toBe(false);
    expect(normalizeJobFilters({ hideApplied: ["1", "0"] }).hideApplied).toBe(true);
  });
});
