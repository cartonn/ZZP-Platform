import { describe, expect, it } from "vitest";
import {
  KANDIDATEN_FILTER_LABELS,
  buildKandidatenHref,
  countApplicationsByStatus,
  filterApplicationsByStatus,
  isApplicationStatus,
  normalizeKandidatenFilter,
} from "./kandidaten-filter";

const apps = [
  { id: "a", status: "NEW" },
  { id: "b", status: "NEW" },
  { id: "c", status: "SHORTLIST" },
  { id: "d", status: "REJECTED" },
  { id: "e", status: "WITHDRAWN" },
];

describe("isApplicationStatus", () => {
  it("herkent geldige statussen", () => {
    expect(isApplicationStatus("NEW")).toBe(true);
    expect(isApplicationStatus("WITHDRAWN")).toBe(true);
  });
  it("wijst onbekende waarden af", () => {
    expect(isApplicationStatus("BOGUS")).toBe(false);
    expect(isApplicationStatus("")).toBe(false);
  });
});

describe("normalizeKandidatenFilter", () => {
  it("laat een geldige status door", () => {
    expect(normalizeKandidatenFilter("SHORTLIST")).toBe("SHORTLIST");
  });
  it("valt terug op '' bij onbekend/leeg/undefined", () => {
    expect(normalizeKandidatenFilter("BOGUS")).toBe("");
    expect(normalizeKandidatenFilter("")).toBe("");
    expect(normalizeKandidatenFilter(undefined)).toBe("");
  });
});

describe("filterApplicationsByStatus", () => {
  it("laat alles staan bij '' (en kopieert)", () => {
    const result = filterApplicationsByStatus(apps, "");
    expect(result).toHaveLength(5);
    expect(result).not.toBe(apps);
  });
  it("filtert op één status", () => {
    expect(filterApplicationsByStatus(apps, "NEW").map((a) => a.id)).toEqual(["a", "b"]);
    expect(filterApplicationsByStatus(apps, "ACCEPTED")).toEqual([]);
  });
  it("muteert de invoer niet", () => {
    const copy = [...apps];
    filterApplicationsByStatus(apps, "NEW");
    expect(apps).toEqual(copy);
  });
});

describe("countApplicationsByStatus", () => {
  it("telt per status, alle statussen geïnitialiseerd op 0", () => {
    const counts = countApplicationsByStatus(apps);
    expect(counts.NEW).toBe(2);
    expect(counts.SHORTLIST).toBe(1);
    expect(counts.REJECTED).toBe(1);
    expect(counts.WITHDRAWN).toBe(1);
    expect(counts.VIEWED).toBe(0);
    expect(counts.ACCEPTED).toBe(0);
  });
  it("levert nullen bij een lege lijst", () => {
    const counts = countApplicationsByStatus([]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
  it("negeert onbekende statuswaarden", () => {
    const counts = countApplicationsByStatus([{ status: "BOGUS" }, { status: "NEW" }]);
    expect(counts.NEW).toBe(1);
  });
});

describe("buildKandidatenHref", () => {
  it("geeft de kale route zonder status of scope", () => {
    expect(buildKandidatenHref({})).toBe("/kandidaten");
    expect(buildKandidatenHref({ status: "", job: null })).toBe("/kandidaten");
  });
  it("zet alleen het statusfilter", () => {
    expect(buildKandidatenHref({ status: "SHORTLIST" })).toBe("/kandidaten?status=SHORTLIST");
  });
  it("zet alleen de opdracht-scope", () => {
    expect(buildKandidatenHref({ job: "job-1" })).toBe("/kandidaten?job=job-1");
  });
  it("behoudt status én scope samen", () => {
    expect(buildKandidatenHref({ status: "NEW", job: "job-1" })).toBe(
      "/kandidaten?status=NEW&job=job-1",
    );
  });
  it("codeert bijzondere tekens in de opdracht-id", () => {
    expect(buildKandidatenHref({ job: "a b&c" })).toBe("/kandidaten?job=a+b%26c");
  });
});

describe("KANDIDATEN_FILTER_LABELS", () => {
  it("begint met 'Alle' en dekt elke applicatie-status", () => {
    const keys = Object.keys(KANDIDATEN_FILTER_LABELS);
    expect(keys[0]).toBe("");
    for (const s of ["NEW", "VIEWED", "SHORTLIST", "ACCEPTED", "REJECTED", "WITHDRAWN"]) {
      expect(KANDIDATEN_FILTER_LABELS[s]).toBeTruthy();
    }
  });
});
