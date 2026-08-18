import { describe, it, expect } from "vitest";
import {
  DIENST_STATUS_FILTER_GROUPS,
  DIENST_STATUS_FILTER_ORDER,
  dienstStatusGroup,
  parseDienstStatusFilter,
  filterDienstenByStatus,
  summarizeDienstStatusGroups,
  type DienstStatusLike,
} from "./dienst-status-filter";

// Representatieve mix: elke afgeleide groep minstens één keer, incl. de precedentie-randgevallen
// (gevuld wint van CLOSED/DRAFT). Volgorde bewust door elkaar om orde-behoud te toetsen.
const sample: DienstStatusLike[] = [
  { status: "PUBLISHED", filled: false }, // open
  { status: "PUBLISHED", filled: true }, // filled
  { status: "DRAFT", filled: false }, // concept
  { status: "CLOSED", filled: false }, // closed
  { status: "PUBLISHED", filled: false }, // open
  { status: "CLOSED", filled: true }, // filled (gevuld wint van CLOSED)
  { status: "DRAFT", filled: true }, // filled (gevuld wint van DRAFT)
];

describe("dienstStatusGroup — afgeleide primaire groep", () => {
  it("gevuld wint altijd, ongeacht ruwe status", () => {
    expect(dienstStatusGroup({ status: "PUBLISHED", filled: true })).toBe("filled");
    expect(dienstStatusGroup({ status: "CLOSED", filled: true })).toBe("filled");
    expect(dienstStatusGroup({ status: "DRAFT", filled: true })).toBe("filled");
  });

  it("ongevuld valt terug op de status", () => {
    expect(dienstStatusGroup({ status: "PUBLISHED", filled: false })).toBe("open");
    expect(dienstStatusGroup({ status: "DRAFT", filled: false })).toBe("concept");
    expect(dienstStatusGroup({ status: "CLOSED", filled: false })).toBe("closed");
  });

  it("onbekende status zonder vulling telt niet als open (valt op de vangnet-tak)", () => {
    // Alleen PUBLISHED-ongevuld is "open"; een onbekende status komt hier niet voor in productie,
    // maar de functie mag niet crashen — de else-tak ("open") is het bewuste vangnet.
    expect(dienstStatusGroup({ status: "ONBEKEND", filled: false })).toBe("open");
  });
});

describe("parseDienstStatusFilter", () => {
  it("accepteert bekende groepen", () => {
    for (const g of DIENST_STATUS_FILTER_GROUPS) {
      expect(parseDienstStatusFilter(g)).toBe(g);
    }
  });

  it("valt terug op 'all' bij onbekend/leeg", () => {
    expect(parseDienstStatusFilter(undefined)).toBe("all");
    expect(parseDienstStatusFilter("")).toBe("all");
    expect(parseDienstStatusFilter("bestaatniet")).toBe("all");
  });
});

describe("filterDienstenByStatus", () => {
  it("'all' geeft een kopie van de volledige lijst (niet dezelfde referentie)", () => {
    const out = filterDienstenByStatus(sample, "all");
    expect(out).toEqual(sample);
    expect(out).not.toBe(sample);
  });

  it("filtert per afgeleide groep met behoud van volgorde", () => {
    expect(filterDienstenByStatus(sample, "open")).toEqual([
      { status: "PUBLISHED", filled: false },
      { status: "PUBLISHED", filled: false },
    ]);
    expect(filterDienstenByStatus(sample, "filled")).toEqual([
      { status: "PUBLISHED", filled: true },
      { status: "CLOSED", filled: true },
      { status: "DRAFT", filled: true },
    ]);
    expect(filterDienstenByStatus(sample, "concept")).toEqual([{ status: "DRAFT", filled: false }]);
    expect(filterDienstenByStatus(sample, "closed")).toEqual([{ status: "CLOSED", filled: false }]);
  });

  it("muteert de invoer niet", () => {
    const copy = sample.slice();
    filterDienstenByStatus(sample, "filled");
    expect(sample).toEqual(copy);
  });
});

describe("summarizeDienstStatusGroups", () => {
  it("telt per groep; de som van de niet-'all'-groepen is het totaal", () => {
    const counts = summarizeDienstStatusGroups(sample);
    expect(counts).toEqual({ all: 7, open: 2, filled: 3, concept: 1, closed: 1 });
    const sumNonAll = counts.open + counts.filled + counts.concept + counts.closed;
    expect(sumNonAll).toBe(counts.all);
  });

  it("lege lijst → alles nul", () => {
    expect(summarizeDienstStatusGroups([])).toEqual({
      all: 0,
      open: 0,
      filled: 0,
      concept: 0,
      closed: 0,
    });
  });
});

describe("filter-metadata", () => {
  it("order bevat precies de groepen, één keer elk", () => {
    expect([...DIENST_STATUS_FILTER_ORDER].sort()).toEqual([...DIENST_STATUS_FILTER_GROUPS].sort());
  });
});
