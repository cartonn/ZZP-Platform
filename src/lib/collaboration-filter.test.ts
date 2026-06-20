import { describe, expect, it } from "vitest";
import {
  countByStatus,
  filterCollaborations,
  isCollaborationFilterActive,
  matchesCollaborationFilter,
  parseCollaborationFilter,
  type FilterableCollaboration,
} from "./collaboration-filter";

function row(over: Partial<FilterableCollaboration> = {}): FilterableCollaboration {
  return {
    status: "ACTIVE",
    dbaLevel: "LAAG",
    jobTitle: "Verpleegkundige",
    companyName: "Zorgcentrum Jansen",
    freelancerName: "Sanne de Vries",
    ...over,
  };
}

describe("parseCollaborationFilter", () => {
  it("leest geldige status/dba/q en trimt de zoekterm", () => {
    const f = parseCollaborationFilter({ status: "ACTIVE", dba: "HOOG", q: "  sanne  " });
    expect(f).toEqual({ status: "ACTIVE", dba: "HOOG", q: "sanne" });
  });

  it("accepteert hoofd-/kleine letters voor status en dba", () => {
    const f = parseCollaborationFilter({ status: "proposed", dba: "verhoogd" });
    expect(f.status).toBe("PROPOSED");
    expect(f.dba).toBe("VERHOOGD");
  });

  it("valt terug op null bij onbekende of lege waarden", () => {
    expect(parseCollaborationFilter({ status: "ONZIN", dba: "X", q: "" })).toEqual({
      status: null,
      dba: null,
      q: "",
    });
    expect(parseCollaborationFilter({})).toEqual({ status: null, dba: null, q: "" });
  });

  it("neemt de eerste waarde bij een array-param", () => {
    expect(parseCollaborationFilter({ status: ["ACTIVE", "COMPLETED"] }).status).toBe("ACTIVE");
  });
});

describe("matchesCollaborationFilter", () => {
  it("matcht alles bij een leeg filter", () => {
    expect(matchesCollaborationFilter(row(), { status: null, dba: null, q: "" })).toBe(true);
  });

  it("filtert op status", () => {
    expect(
      matchesCollaborationFilter(row({ status: "ACTIVE" }), { status: "ACTIVE", dba: null, q: "" }),
    ).toBe(true);
    expect(
      matchesCollaborationFilter(row({ status: "COMPLETED" }), {
        status: "ACTIVE",
        dba: null,
        q: "",
      }),
    ).toBe(false);
  });

  it("filtert op DBA-niveau", () => {
    expect(
      matchesCollaborationFilter(row({ dbaLevel: "HOOG" }), { status: null, dba: "HOOG", q: "" }),
    ).toBe(true);
    expect(
      matchesCollaborationFilter(row({ dbaLevel: "LAAG" }), { status: null, dba: "HOOG", q: "" }),
    ).toBe(false);
  });

  it("zoekt over opdracht, opdrachtgever én ZZP'er, hoofdletterongevoelig", () => {
    const f = { status: null, dba: null, q: "jansen" };
    expect(matchesCollaborationFilter(row(), f)).toBe(true); // companyName
    expect(matchesCollaborationFilter(row({ companyName: "Datic BV" }), f)).toBe(false);
    expect(
      matchesCollaborationFilter(row({ companyName: "Datic", jobTitle: "JANSEN-klus" }), f),
    ).toBe(true); // jobTitle
    expect(
      matchesCollaborationFilter(row({ companyName: "Datic", freelancerName: "Bram Jansen" }), f),
    ).toBe(true); // freelancerName
  });

  it("combineert alle dimensies (AND)", () => {
    const f = { status: "ACTIVE" as const, dba: "HOOG" as const, q: "sanne" };
    expect(matchesCollaborationFilter(row({ status: "ACTIVE", dbaLevel: "HOOG" }), f)).toBe(true);
    expect(matchesCollaborationFilter(row({ status: "ACTIVE", dbaLevel: "LAAG" }), f)).toBe(false);
  });
});

describe("filterCollaborations", () => {
  it("behoudt de volgorde en geeft de matchende subset", () => {
    const items = [
      row({ jobTitle: "A", status: "ACTIVE" }),
      row({ jobTitle: "B", status: "COMPLETED" }),
      row({ jobTitle: "C", status: "ACTIVE" }),
    ];
    const out = filterCollaborations(items, { status: "ACTIVE", dba: null, q: "" });
    expect(out.map((c) => c.jobTitle)).toEqual(["A", "C"]);
  });
});

describe("countByStatus", () => {
  it("telt per status over de volledige set", () => {
    const items = [
      row({ status: "PROPOSED" }),
      row({ status: "ACTIVE" }),
      row({ status: "ACTIVE" }),
      row({ status: "CANCELLED" }),
    ];
    expect(countByStatus(items)).toEqual({
      all: 4,
      PROPOSED: 1,
      ACTIVE: 2,
      COMPLETED: 0,
      CANCELLED: 1,
    });
  });

  it("negeert onbekende statussen in de telling maar telt ze wel in all", () => {
    const counts = countByStatus([row({ status: "ONZIN" }), row({ status: "ACTIVE" })]);
    expect(counts.all).toBe(2);
    expect(counts.ACTIVE).toBe(1);
  });
});

describe("isCollaborationFilterActive", () => {
  it("is false bij een leeg filter en true zodra één dimensie gezet is", () => {
    expect(isCollaborationFilterActive({ status: null, dba: null, q: "" })).toBe(false);
    expect(isCollaborationFilterActive({ status: "ACTIVE", dba: null, q: "" })).toBe(true);
    expect(isCollaborationFilterActive({ status: null, dba: "HOOG", q: "" })).toBe(true);
    expect(isCollaborationFilterActive({ status: null, dba: null, q: "x" })).toBe(true);
  });
});
