import { describe, it, expect } from "vitest";
import {
  parseDisputeFilter,
  matchesDisputeFilter,
  filterDisputeRows,
  isDisputeFilterActive,
  disputeFilterParams,
} from "@/lib/dispute-filter";
import { type DisputeRow } from "@/lib/disputes";

function row(urgency: DisputeRow["urgency"], id: string): DisputeRow {
  return {
    collaborationId: id,
    jobTitle: `Opdracht ${id}`,
    companyName: "Zorgcentrum",
    freelancerName: "Sanne",
    disputedAt: new Date("2026-06-01T00:00:00Z"),
    disputeReason: null,
    ageDays: 5,
    urgency,
  };
}

describe("parseDisputeFilter", () => {
  it("leest een geldig urgentieniveau (case-insensitief)", () => {
    expect(parseDisputeFilter({ urgency: "urgent" })).toEqual({ urgency: "URGENT" });
    expect(parseDisputeFilter({ urgency: "  Verhoogd " })).toEqual({ urgency: "VERHOOGD" });
    expect(parseDisputeFilter({ urgency: "NORMAAL" })).toEqual({ urgency: "NORMAAL" });
  });

  it("valt terug op null bij een onbekende of ontbrekende waarde", () => {
    expect(parseDisputeFilter({})).toEqual({ urgency: null });
    expect(parseDisputeFilter({ urgency: "onzin" })).toEqual({ urgency: null });
    expect(parseDisputeFilter({ urgency: "" })).toEqual({ urgency: null });
  });

  it("neemt de eerste waarde bij een array-param", () => {
    expect(parseDisputeFilter({ urgency: ["URGENT", "NORMAAL"] })).toEqual({ urgency: "URGENT" });
  });
});

describe("matchesDisputeFilter", () => {
  it("laat alles door zonder actief filter", () => {
    const f = { urgency: null };
    expect(matchesDisputeFilter(row("NORMAAL", "a"), f)).toBe(true);
    expect(matchesDisputeFilter(row("URGENT", "b"), f)).toBe(true);
  });

  it("matcht alleen het gevraagde niveau", () => {
    const f = { urgency: "URGENT" as const };
    expect(matchesDisputeFilter(row("URGENT", "a"), f)).toBe(true);
    expect(matchesDisputeFilter(row("VERHOOGD", "b"), f)).toBe(false);
  });
});

describe("filterDisputeRows", () => {
  const rows = [row("URGENT", "a"), row("VERHOOGD", "b"), row("URGENT", "c"), row("NORMAAL", "d")];

  it("geeft alle rijen terug zonder actief filter", () => {
    const out = filterDisputeRows(rows, { urgency: null });
    expect(out).toHaveLength(4);
  });

  it("filtert op niveau", () => {
    const out = filterDisputeRows(rows, { urgency: "URGENT" });
    expect(out.map((r) => r.collaborationId)).toEqual(["a", "c"]);
  });

  it("muteert de invoer-array niet", () => {
    const copy = [...rows];
    filterDisputeRows(rows, { urgency: "URGENT" });
    expect(rows).toEqual(copy);
  });

  it("geeft een nieuwe array terug, niet dezelfde referentie", () => {
    expect(filterDisputeRows(rows, { urgency: null })).not.toBe(rows);
  });
});

describe("isDisputeFilterActive", () => {
  it("is false zonder filter, true met een niveau", () => {
    expect(isDisputeFilterActive({ urgency: null })).toBe(false);
    expect(isDisputeFilterActive({ urgency: "VERHOOGD" })).toBe(true);
  });
});

describe("disputeFilterParams", () => {
  it("geeft een leeg object voor 'alle'", () => {
    expect(disputeFilterParams(null)).toEqual({});
  });

  it("geeft de urgency-param voor een niveau", () => {
    expect(disputeFilterParams("URGENT")).toEqual({ urgency: "URGENT" });
  });
});
