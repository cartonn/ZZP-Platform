import { describe, expect, it } from "vitest";
import {
  APPLICATION_FILTER_GROUPS,
  applicationFilterParams,
  applicationGroup,
  filterApplications,
  parseApplicationFilter,
  summarizeApplicationGroups,
  type FilterableApplication,
} from "@/lib/application-filter";
import { type ApplicationStatus } from "@/lib/enums";

function app(status: ApplicationStatus): FilterableApplication {
  return { status };
}

describe("applicationGroup", () => {
  it("vat NEW/VIEWED/SHORTLIST samen tot 'open'", () => {
    expect(applicationGroup("NEW")).toBe("open");
    expect(applicationGroup("VIEWED")).toBe("open");
    expect(applicationGroup("SHORTLIST")).toBe("open");
  });

  it("mapt de eindstatussen op hun eigen groep", () => {
    expect(applicationGroup("ACCEPTED")).toBe("accepted");
    expect(applicationGroup("REJECTED")).toBe("rejected");
    expect(applicationGroup("WITHDRAWN")).toBe("withdrawn");
  });
});

describe("parseApplicationFilter", () => {
  it("leest een geldige groep uit de searchParams", () => {
    expect(parseApplicationFilter({ status: "open" })).toBe("open");
    expect(parseApplicationFilter({ status: "rejected" })).toBe("rejected");
  });

  it("valt terug op 'all' bij ontbrekende, onbekende of 'all'-waarde", () => {
    expect(parseApplicationFilter({})).toBe("all");
    expect(parseApplicationFilter({ status: "all" })).toBe("all");
    expect(parseApplicationFilter({ status: "onzin" })).toBe("all");
  });

  it("neemt de eerste waarde bij een array", () => {
    expect(parseApplicationFilter({ status: ["accepted", "open"] })).toBe("accepted");
  });
});

describe("filterApplications", () => {
  const items = [app("NEW"), app("ACCEPTED"), app("SHORTLIST"), app("REJECTED"), app("WITHDRAWN")];

  it("geeft alles terug bij 'all'", () => {
    expect(filterApplications(items, "all")).toHaveLength(5);
  });

  it("filtert op groep", () => {
    expect(filterApplications(items, "open").map((a) => a.status)).toEqual(["NEW", "SHORTLIST"]);
    expect(filterApplications(items, "accepted").map((a) => a.status)).toEqual(["ACCEPTED"]);
    expect(filterApplications(items, "withdrawn").map((a) => a.status)).toEqual(["WITHDRAWN"]);
  });

  it("behoudt de invoervolgorde en muteert de invoer niet", () => {
    const input = [app("ACCEPTED"), app("NEW"), app("VIEWED")];
    const snapshot = input.map((a) => a.status);
    const out = filterApplications(input, "open");
    expect(out.map((a) => a.status)).toEqual(["NEW", "VIEWED"]);
    expect(input.map((a) => a.status)).toEqual(snapshot);
  });
});

describe("summarizeApplicationGroups", () => {
  it("telt totaal en per aanwezige groep, in canonieke volgorde", () => {
    const summary = summarizeApplicationGroups([
      app("REJECTED"),
      app("NEW"),
      app("ACCEPTED"),
      app("VIEWED"),
    ]);
    expect(summary.total).toBe(4);
    expect(summary.groups.map((g) => [g.group, g.count])).toEqual([
      ["open", 2],
      ["accepted", 1],
      ["rejected", 1],
    ]);
  });

  it("laat lege groepen weg en geeft een NL-label", () => {
    const summary = summarizeApplicationGroups([app("WITHDRAWN")]);
    expect(summary.groups).toHaveLength(1);
    expect(summary.groups[0]).toMatchObject({ group: "withdrawn", label: "Ingetrokken", count: 1 });
  });

  it("lege invoer → totaal 0, geen groepen", () => {
    const summary = summarizeApplicationGroups([]);
    expect(summary).toEqual({ total: 0, groups: [] });
  });

  it("dekt elke filtergroep af", () => {
    const summary = summarizeApplicationGroups([
      app("NEW"),
      app("ACCEPTED"),
      app("REJECTED"),
      app("WITHDRAWN"),
    ]);
    expect(summary.groups.map((g) => g.group)).toEqual([...APPLICATION_FILTER_GROUPS]);
  });
});

describe("applicationFilterParams", () => {
  it("laat de standaard ('all') weg", () => {
    expect(applicationFilterParams("all")).toEqual({});
  });

  it("zet de groep als status-param", () => {
    expect(applicationFilterParams("accepted")).toEqual({ status: "accepted" });
  });
});
