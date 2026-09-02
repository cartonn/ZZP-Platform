import { describe, expect, it } from "vitest";
import {
  KANDIDATEN_FILTER_LABELS,
  buildKandidatenHref,
  isApplicationStatus,
  kandidatenStatusWhere,
  normalizeKandidatenFilter,
  statusCountsFromGroups,
  totalFromStatusGroups,
} from "./kandidaten-filter";

/** Zoals `prisma.application.groupBy({ by: ["status"], _count: { _all: true } })` het teruggeeft. */
const groups = [
  { status: "NEW", _count: { _all: 2 } },
  { status: "SHORTLIST", _count: { _all: 1 } },
  { status: "REJECTED", _count: { _all: 1 } },
  { status: "WITHDRAWN", _count: { _all: 1 } },
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

describe("kandidatenStatusWhere", () => {
  it("levert een leeg fragment bij 'alle'", () => {
    expect(kandidatenStatusWhere("")).toEqual({});
  });
  it("filtert server-side op één status", () => {
    expect(kandidatenStatusWhere("SHORTLIST")).toEqual({ status: "SHORTLIST" });
  });
  it("blijft samen te voegen met een eigenaar-scope zonder die te overschrijven", () => {
    const owner = { job: { company: { userId: "u1" } } };
    expect({ ...owner, ...kandidatenStatusWhere("NEW") }).toEqual({
      job: { company: { userId: "u1" } },
      status: "NEW",
    });
  });
});

describe("statusCountsFromGroups", () => {
  it("telt per status, alle statussen geïnitialiseerd op 0", () => {
    const counts = statusCountsFromGroups(groups);
    expect(counts.NEW).toBe(2);
    expect(counts.SHORTLIST).toBe(1);
    expect(counts.REJECTED).toBe(1);
    expect(counts.WITHDRAWN).toBe(1);
    expect(counts.VIEWED).toBe(0);
    expect(counts.ACCEPTED).toBe(0);
  });
  it("levert nullen bij een leeg groupBy-resultaat", () => {
    const counts = statusCountsFromGroups([]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
  it("negeert onbekende statuswaarden uit de database", () => {
    const counts = statusCountsFromGroups([
      { status: "BOGUS", _count: { _all: 9 } },
      { status: "NEW", _count: { _all: 1 } },
    ]);
    expect(counts.NEW).toBe(1);
  });
  it("telt dubbele groepen voor dezelfde status op", () => {
    const counts = statusCountsFromGroups([
      { status: "NEW", _count: { _all: 2 } },
      { status: "NEW", _count: { _all: 3 } },
    ]);
    expect(counts.NEW).toBe(5);
  });
});

describe("totalFromStatusGroups", () => {
  it("telt alle statussen op — ook onbekende, want die bestaan wél", () => {
    expect(totalFromStatusGroups(groups)).toBe(5);
    expect(totalFromStatusGroups([{ status: "BOGUS", _count: { _all: 4 } }])).toBe(4);
  });
  it("levert 0 bij een lege lijst (de 'nog geen reacties'-poort)", () => {
    expect(totalFromStatusGroups([])).toBe(0);
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
  it("neemt de paginatie-cursor mee met filter én scope ('Meer laden')", () => {
    expect(buildKandidatenHref({ status: "NEW", job: "job-1", cursor: "app-9" })).toBe(
      "/kandidaten?status=NEW&job=job-1&cursor=app-9",
    );
  });
  it("laat een lege cursor weg, zodat een tab-href bij pagina 1 begint", () => {
    expect(buildKandidatenHref({ status: "NEW", cursor: null })).toBe("/kandidaten?status=NEW");
    expect(buildKandidatenHref({ status: "NEW", cursor: "" })).toBe("/kandidaten?status=NEW");
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
