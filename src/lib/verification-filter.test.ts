import { describe, expect, it } from "vitest";
import {
  countByType,
  filterVerificationQueue,
  isVerificationFilterActive,
  parseVerificationFilter,
  type FilterableCredential,
} from "@/lib/verification-filter";

function cred(over: Partial<FilterableCredential> = {}): FilterableCredential {
  return {
    type: "VOG",
    title: "VOG zorg",
    issuer: "Justis",
    freelancerName: "Sanne de Vries",
    ...over,
  };
}

describe("parseVerificationFilter", () => {
  it("normaliseert de zoekterm (trim + lowercase) en leest het type", () => {
    expect(parseVerificationFilter({ q: "  Sanne ", type: "DIPLOMA" })).toEqual({
      q: "sanne",
      type: "DIPLOMA",
    });
  });

  it("valt terug op geen filter bij ontbrekende/ongeldige waarden", () => {
    expect(parseVerificationFilter({})).toEqual({ q: "", type: null });
    expect(parseVerificationFilter({ type: "ONZIN" })).toEqual({ q: "", type: null });
  });

  it("neemt de eerste waarde bij een herhaalde param", () => {
    expect(parseVerificationFilter({ type: ["VOG", "DIPLOMA"] })).toEqual({ q: "", type: "VOG" });
  });
});

describe("isVerificationFilterActive", () => {
  it("is alleen actief bij een zoekterm of type", () => {
    expect(isVerificationFilterActive({ q: "", type: null })).toBe(false);
    expect(isVerificationFilterActive({ q: "x", type: null })).toBe(true);
    expect(isVerificationFilterActive({ q: "", type: "VOG" })).toBe(true);
  });
});

describe("filterVerificationQueue", () => {
  const items = [
    cred({ title: "VOG zorg", type: "VOG", freelancerName: "Sanne de Vries", issuer: "Justis" }),
    cred({
      title: "Diploma HBO-V",
      type: "DIPLOMA",
      freelancerName: "Emma Visser",
      issuer: "Hogeschool",
    }),
    cred({
      title: "BIG-registratie",
      type: "LICENSE",
      freelancerName: "Lars Bakker",
      issuer: "CIBG",
    }),
  ];

  it("geeft de lijst ongewijzigd terug zonder actieve filter (zelfde referentie)", () => {
    expect(filterVerificationQueue(items, { q: "", type: null })).toBe(items);
  });

  it("zoekt op titel, uitgever en ZZP'er-naam (case-insensitief)", () => {
    expect(filterVerificationQueue(items, { q: "emma", type: null })).toHaveLength(1);
    expect(filterVerificationQueue(items, { q: "cibg", type: null })[0]!.title).toBe(
      "BIG-registratie",
    );
    expect(filterVerificationQueue(items, { q: "vog", type: null })[0]!.type).toBe("VOG");
  });

  it("filtert op certificaattype", () => {
    const out = filterVerificationQueue(items, { q: "", type: "DIPLOMA" });
    expect(out).toHaveLength(1);
    expect(out[0]!.freelancerName).toBe("Emma Visser");
  });

  it("combineert zoekterm en type (AND)", () => {
    expect(filterVerificationQueue(items, { q: "sanne", type: "DIPLOMA" })).toHaveLength(0);
    expect(filterVerificationQueue(items, { q: "sanne", type: "VOG" })).toHaveLength(1);
  });

  it("behoudt de invoervolgorde en muteert de invoer niet", () => {
    const copy = [...items];
    const out = filterVerificationQueue(items, { q: "a", type: null });
    expect(items).toEqual(copy);
    // volgorde van de overgebleven items volgt de invoer
    const idx = out.map((c) => items.indexOf(c));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });

  it("verdraagt een null-issuer", () => {
    const withNull = [cred({ issuer: null, title: "Losse opleiding", freelancerName: "Tom" })];
    expect(filterVerificationQueue(withNull, { q: "losse", type: null })).toHaveLength(1);
    expect(filterVerificationQueue(withNull, { q: "justis", type: null })).toHaveLength(0);
  });
});

describe("countByType", () => {
  it("telt per type en houdt afwezige typen op 0", () => {
    const counts = countByType([
      cred({ type: "VOG" }),
      cred({ type: "VOG" }),
      cred({ type: "DIPLOMA" }),
    ]);
    expect(counts.VOG).toBe(2);
    expect(counts.DIPLOMA).toBe(1);
    expect(counts.LICENSE).toBe(0);
    expect(counts.OTHER).toBe(0);
  });
});
