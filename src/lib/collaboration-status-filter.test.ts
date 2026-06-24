import { describe, expect, it } from "vitest";
import {
  COLLAB_STATUS_FILTER_ORDER,
  collaborationStatusWhere,
  parseCollaborationStatusFilter,
  summarizeCollaborationStatusGroups,
  type CollaborationStatusGroupCount,
} from "@/lib/collaboration-status-filter";

describe("parseCollaborationStatusFilter", () => {
  it("accepteert bekende groepen", () => {
    expect(parseCollaborationStatusFilter("PROPOSED")).toBe("PROPOSED");
    expect(parseCollaborationStatusFilter("ACTIVE")).toBe("ACTIVE");
    expect(parseCollaborationStatusFilter("COMPLETED")).toBe("COMPLETED");
    expect(parseCollaborationStatusFilter("CANCELLED")).toBe("CANCELLED");
    expect(parseCollaborationStatusFilter("all")).toBe("all");
  });

  it("valt terug op 'all' bij onbekende/lege/malicieuze waarde", () => {
    expect(parseCollaborationStatusFilter(undefined)).toBe("all");
    expect(parseCollaborationStatusFilter("")).toBe("all");
    expect(parseCollaborationStatusFilter("active")).toBe("all"); // hoofdlettergevoelig (enum-waarde)
    expect(parseCollaborationStatusFilter("'; DROP TABLE--")).toBe("all");
    expect(parseCollaborationStatusFilter("<script>")).toBe("all");
  });
});

describe("collaborationStatusWhere", () => {
  it("legt geen constraint op voor 'all'", () => {
    expect(collaborationStatusWhere("all")).toEqual({});
  });

  it("filtert op de gekozen status", () => {
    expect(collaborationStatusWhere("ACTIVE")).toEqual({ status: "ACTIVE" });
    expect(collaborationStatusWhere("CANCELLED")).toEqual({ status: "CANCELLED" });
  });
});

describe("summarizeCollaborationStatusGroups", () => {
  const groups: CollaborationStatusGroupCount[] = [
    { status: "PROPOSED", _count: { _all: 2 } },
    { status: "ACTIVE", _count: { _all: 3 } },
    { status: "COMPLETED", _count: { _all: 1 } },
  ];

  it("telt per status en somt het totaal", () => {
    const counts = summarizeCollaborationStatusGroups(groups);
    expect(counts.PROPOSED).toBe(2);
    expect(counts.ACTIVE).toBe(3);
    expect(counts.COMPLETED).toBe(1);
    expect(counts.CANCELLED).toBe(0);
    expect(counts.all).toBe(6);
  });

  it("geeft nul-tellingen voor een lege lijst", () => {
    const counts = summarizeCollaborationStatusGroups([]);
    expect(counts).toEqual({ all: 0, PROPOSED: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 });
  });

  it("telt onbekende legacy-statussen wel in het totaal maar in geen pill", () => {
    const counts = summarizeCollaborationStatusGroups([
      { status: "ARCHIVED", _count: { _all: 4 } },
      { status: "ACTIVE", _count: { _all: 1 } },
    ]);
    expect(counts.all).toBe(5);
    expect(counts.ACTIVE).toBe(1);
    expect(counts.PROPOSED).toBe(0);
  });
});

describe("COLLAB_STATUS_FILTER_ORDER", () => {
  it("begint met 'all' en bevat elke status precies één keer", () => {
    expect(COLLAB_STATUS_FILTER_ORDER[0]).toBe("all");
    expect(new Set(COLLAB_STATUS_FILTER_ORDER).size).toBe(COLLAB_STATUS_FILTER_ORDER.length);
    expect(COLLAB_STATUS_FILTER_ORDER).toEqual([
      "all",
      "PROPOSED",
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
    ]);
  });
});
