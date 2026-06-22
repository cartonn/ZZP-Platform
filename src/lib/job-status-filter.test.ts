import { describe, expect, it } from "vitest";
import {
  JOB_STATUS_FILTER_ORDER,
  filterJobsByStatus,
  parseJobStatusFilter,
  summarizeJobStatusGroups,
} from "@/lib/job-status-filter";

const jobs = [
  { id: "a", status: "DRAFT" },
  { id: "b", status: "PUBLISHED" },
  { id: "c", status: "PUBLISHED" },
  { id: "d", status: "CLOSED" },
];

describe("parseJobStatusFilter", () => {
  it("accepteert geldige statuswaarden", () => {
    expect(parseJobStatusFilter("DRAFT")).toBe("DRAFT");
    expect(parseJobStatusFilter("PUBLISHED")).toBe("PUBLISHED");
    expect(parseJobStatusFilter("CLOSED")).toBe("CLOSED");
    expect(parseJobStatusFilter("all")).toBe("all");
  });

  it("valt terug op 'all' bij lege, onbekende of malicieuze waarde", () => {
    expect(parseJobStatusFilter(undefined)).toBe("all");
    expect(parseJobStatusFilter("")).toBe("all");
    expect(parseJobStatusFilter("ARCHIVED")).toBe("all");
    expect(parseJobStatusFilter("<script>")).toBe("all");
    expect(parseJobStatusFilter("draft")).toBe("all"); // hoofdlettergevoelig
  });
});

describe("filterJobsByStatus", () => {
  it("geeft de lijst ongewijzigd terug bij 'all' (kopie, niet de invoer)", () => {
    const out = filterJobsByStatus(jobs, "all");
    expect(out).toEqual(jobs);
    expect(out).not.toBe(jobs);
  });

  it("filtert op de gekozen status met behoud van volgorde", () => {
    expect(filterJobsByStatus(jobs, "PUBLISHED").map((j) => j.id)).toEqual(["b", "c"]);
    expect(filterJobsByStatus(jobs, "DRAFT").map((j) => j.id)).toEqual(["a"]);
    expect(filterJobsByStatus(jobs, "CLOSED").map((j) => j.id)).toEqual(["d"]);
  });

  it("muteert de invoer niet", () => {
    const copy = [...jobs];
    filterJobsByStatus(jobs, "DRAFT");
    expect(jobs).toEqual(copy);
  });
});

describe("summarizeJobStatusGroups", () => {
  it("telt per groep, 'all' is het totaal", () => {
    expect(summarizeJobStatusGroups(jobs)).toEqual({
      all: 4,
      DRAFT: 1,
      PUBLISHED: 2,
      CLOSED: 1,
    });
  });

  it("negeert onbekende statussen in de telling maar telt ze wel in 'all'", () => {
    const counts = summarizeJobStatusGroups([...jobs, { id: "x", status: "ARCHIVED" }]);
    expect(counts.all).toBe(5);
    expect(counts.DRAFT + counts.PUBLISHED + counts.CLOSED).toBe(4);
  });

  it("geeft nullen terug voor een lege lijst", () => {
    expect(summarizeJobStatusGroups([])).toEqual({ all: 0, DRAFT: 0, PUBLISHED: 0, CLOSED: 0 });
  });

  it("dekt alle pill-groepen in de telling", () => {
    const counts = summarizeJobStatusGroups(jobs);
    for (const group of JOB_STATUS_FILTER_ORDER) {
      expect(counts[group]).toBeGreaterThanOrEqual(0);
    }
  });
});
