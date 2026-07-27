import { describe, it, expect } from "vitest";
import {
  parseRosterFilter,
  matchesRosterFilter,
  filterRoster,
  sortRoster,
  isRosterFilterActive,
  type RosterZzper,
} from "./zzper-roster-filter";

function card(over: Partial<RosterZzper> = {}): RosterZzper {
  return {
    id: "z1",
    name: "Sanne de Vries",
    headline: "Verpleegkundige",
    location: "Utrecht",
    skillLabels: ["Wondverzorging"],
    availability: "AVAILABLE",
    engageabilityStatus: "ACTIEF",
    hasAlert: false,
    hourlyRate: 52,
    activeCollaborations: 0,
    dormancyTier: "active",
    ...over,
  };
}

describe("parseRosterFilter", () => {
  it("leest alle dimensies en normaliseert hoofdletters", () => {
    const f = parseRosterFilter({
      q: "  Sanne ",
      availability: "available",
      status: "aandacht",
      alerts: "1",
      sort: "RATE-ASC",
    });
    expect(f).toEqual({
      q: "Sanne",
      availability: "AVAILABLE",
      status: "AANDACHT",
      onlyAlerts: true,
      onlyIdle: false,
      onlyDormant: false,
      sort: "rate-asc",
    });
  });

  it("valt terug op geen-filter bij onbekende waarden en sort=recent", () => {
    const f = parseRosterFilter({ availability: "weekend", status: "vip", sort: "magic" });
    expect(f).toEqual({
      q: "",
      availability: null,
      status: null,
      onlyAlerts: false,
      onlyIdle: false,
      onlyDormant: false,
      sort: "recent",
    });
  });

  it("accepteert array-searchParams (eerste waarde) en alerts=true", () => {
    const f = parseRosterFilter({ q: ["a", "b"], alerts: "true" });
    expect(f.q).toBe("a");
    expect(f.onlyAlerts).toBe(true);
  });
});

describe("matchesRosterFilter", () => {
  const base = parseRosterFilter({});

  it("zoekt over naam, headline, locatie en skills (case-insensitief)", () => {
    expect(matchesRosterFilter(card(), { ...base, q: "sanne" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, q: "verpleeg" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, q: "utrecht" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, q: "wondverzorging" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, q: "amsterdam" })).toBe(false);
  });

  it("filtert op beschikbaarheid en inzetbaarheid", () => {
    expect(matchesRosterFilter(card(), { ...base, availability: "AVAILABLE" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, availability: "UNAVAILABLE" })).toBe(false);
    expect(matchesRosterFilter(card(), { ...base, status: "ACTIEF" })).toBe(true);
    expect(matchesRosterFilter(card(), { ...base, status: "INACTIEF" })).toBe(false);
  });

  it("toont met onlyAlerts alleen ZZP'ers met een certificaat-waarschuwing", () => {
    expect(matchesRosterFilter(card({ hasAlert: true }), { ...base, onlyAlerts: true })).toBe(true);
    expect(matchesRosterFilter(card({ hasAlert: false }), { ...base, onlyAlerts: true })).toBe(
      false,
    );
  });

  it("toont met onlyIdle alleen vrij-inzetbare ZZP'ers", () => {
    // ACTIEF + AVAILABLE + geen lopende opdracht
    expect(matchesRosterFilter(card(), { ...base, onlyIdle: true })).toBe(true);
    // wél ingezet → niet vrij
    expect(
      matchesRosterFilter(card({ activeCollaborations: 1 }), { ...base, onlyIdle: true }),
    ).toBe(false);
    // niet inzetbaar → niet vrij
    expect(
      matchesRosterFilter(card({ engageabilityStatus: "AANDACHT" }), { ...base, onlyIdle: true }),
    ).toBe(false);
    // niet beschikbaar → niet vrij
    expect(
      matchesRosterFilter(card({ availability: "UNAVAILABLE" }), { ...base, onlyIdle: true }),
    ).toBe(false);
  });

  it("toont met onlyDormant alleen re-engagement-kandidaten (cooling of dormant)", () => {
    expect(
      matchesRosterFilter(card({ dormancyTier: "dormant" }), { ...base, onlyDormant: true }),
    ).toBe(true);
    expect(
      matchesRosterFilter(card({ dormancyTier: "cooling" }), { ...base, onlyDormant: true }),
    ).toBe(true);
    expect(
      matchesRosterFilter(card({ dormancyTier: "active" }), { ...base, onlyDormant: true }),
    ).toBe(false);
  });

  it("combineert dimensies met AND", () => {
    const f = { ...base, q: "sanne", availability: "AVAILABLE" as const };
    expect(matchesRosterFilter(card(), f)).toBe(true);
    expect(matchesRosterFilter(card({ availability: "LIMITED" }), f)).toBe(false);
  });
});

describe("filterRoster", () => {
  it("geeft een deelverzameling terug en muteert de invoer niet", () => {
    const items = [card({ id: "a" }), card({ id: "b", availability: "UNAVAILABLE" })];
    const out = filterRoster(items, { ...parseRosterFilter({}), availability: "AVAILABLE" });
    expect(out.map((z) => z.id)).toEqual(["a"]);
    expect(items).toHaveLength(2);
  });
});

describe("sortRoster", () => {
  const a = card({ id: "a", name: "Anna", hourlyRate: 40 });
  const b = card({ id: "b", name: "Bram", hourlyRate: 60 });
  const c = card({ id: "c", name: "Cleo", hourlyRate: null });

  it("behoudt de server-volgorde bij recent en muteert niet", () => {
    const input = [b, a, c];
    const out = sortRoster(input, "recent");
    expect(out.map((z) => z.id)).toEqual(["b", "a", "c"]);
    expect(input.map((z) => z.id)).toEqual(["b", "a", "c"]);
  });

  it("sorteert op naam (nl)", () => {
    expect(sortRoster([c, a, b], "name").map((z) => z.id)).toEqual(["a", "b", "c"]);
  });

  it("sorteert op tarief met 'geen tarief' altijd achteraan", () => {
    expect(sortRoster([b, c, a], "rate-asc").map((z) => z.id)).toEqual(["a", "b", "c"]);
    expect(sortRoster([a, c, b], "rate-desc").map((z) => z.id)).toEqual(["b", "a", "c"]);
  });

  it("breekt gelijke tarieven deterministisch op naam→id", () => {
    const x = card({ id: "x", name: "Tess", hourlyRate: 50 });
    const y = card({ id: "y", name: "Tess", hourlyRate: 50 });
    expect(sortRoster([y, x], "rate-asc").map((z) => z.id)).toEqual(["x", "y"]);
  });
});

describe("isRosterFilterActive", () => {
  it("is false zonder filter en true zodra één dimensie actief is", () => {
    expect(isRosterFilterActive(parseRosterFilter({}))).toBe(false);
    expect(isRosterFilterActive(parseRosterFilter({ q: "x" }))).toBe(true);
    expect(isRosterFilterActive(parseRosterFilter({ availability: "AVAILABLE" }))).toBe(true);
    expect(isRosterFilterActive(parseRosterFilter({ alerts: "1" }))).toBe(true);
    expect(isRosterFilterActive(parseRosterFilter({ idle: "1" }))).toBe(true);
    expect(isRosterFilterActive(parseRosterFilter({ dormant: "1" }))).toBe(true);
    // sort alleen is geen "actief filter" (verandert de set niet)
    expect(isRosterFilterActive(parseRosterFilter({ sort: "name" }))).toBe(false);
  });
});
