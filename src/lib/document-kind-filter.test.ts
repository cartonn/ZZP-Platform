import { describe, expect, it } from "vitest";
import {
  DOCUMENT_KIND_FILTER_ORDER,
  documentKindWhere,
  parseDocumentKindFilter,
  summarizeDocumentKindGroups,
} from "@/lib/document-kind-filter";

describe("parseDocumentKindFilter", () => {
  it("accepteert geldige groepen", () => {
    expect(parseDocumentKindFilter("all")).toBe("all");
    expect(parseDocumentKindFilter("VOG")).toBe("VOG");
    expect(parseDocumentKindFilter("CREDENTIAL")).toBe("CREDENTIAL");
    expect(parseDocumentKindFilter("OTHER")).toBe("OTHER");
  });

  it("valt terug op 'all' bij onbekende, lege of malicieuze invoer", () => {
    expect(parseDocumentKindFilter(undefined)).toBe("all");
    expect(parseDocumentKindFilter("")).toBe("all");
    expect(parseDocumentKindFilter("nonsense")).toBe("all");
    expect(parseDocumentKindFilter("vog")).toBe("all"); // hoofdlettergevoelig
    expect(parseDocumentKindFilter("<script>")).toBe("all");
  });
});

describe("documentKindWhere", () => {
  it("geeft geen constraint voor 'all'", () => {
    expect(documentKindWhere("all")).toEqual({});
  });

  it("geeft een kind-constraint voor een specifieke groep", () => {
    expect(documentKindWhere("VOG")).toEqual({ kind: "VOG" });
    expect(documentKindWhere("CONTRACT")).toEqual({ kind: "CONTRACT" });
  });
});

describe("summarizeDocumentKindGroups", () => {
  it("telt per groep en zet 'all' op het totaal", () => {
    const counts = summarizeDocumentKindGroups([
      { kind: "VOG", count: 2 },
      { kind: "CREDENTIAL", count: 3 },
      { kind: "OTHER", count: 1 },
    ]);
    expect(counts.all).toBe(6);
    expect(counts.VOG).toBe(2);
    expect(counts.CREDENTIAL).toBe(3);
    expect(counts.OTHER).toBe(1);
    expect(counts.INSURANCE).toBe(0);
    expect(counts.CONTRACT).toBe(0);
  });

  it("telt onbekende kinds wel in het totaal maar in geen specifieke pill", () => {
    const counts = summarizeDocumentKindGroups([
      { kind: "LEGACY_UNKNOWN", count: 4 },
      { kind: "VOG", count: 1 },
    ]);
    expect(counts.all).toBe(5);
    expect(counts.VOG).toBe(1);
    expect(counts.OTHER).toBe(0);
  });

  it("geeft alle nullen bij lege invoer", () => {
    const counts = summarizeDocumentKindGroups([]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
});

describe("DOCUMENT_KIND_FILTER_ORDER", () => {
  it("begint met 'all' en bevat elke documentkind", () => {
    expect(DOCUMENT_KIND_FILTER_ORDER[0]).toBe("all");
    expect(DOCUMENT_KIND_FILTER_ORDER).toEqual([
      "all",
      "CREDENTIAL",
      "VOG",
      "INSURANCE",
      "CONTRACT",
      "OTHER",
    ]);
  });
});
