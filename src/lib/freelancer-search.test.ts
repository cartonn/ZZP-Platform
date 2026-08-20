import { describe, expect, it } from "vitest";
import {
  applyFreelancerFilters,
  buildFreelancerSkillCatalog,
  sortFreelancers,
  type FreelancerCard,
} from "@/lib/freelancer-search";

const sanne: FreelancerCard = {
  id: "fp-1",
  userId: "u-1",
  name: "Sanne Bakker",
  headline: "React developer",
  location: "Amsterdam",
  workMode: "HYBRID",
  skillIds: ["s-1", "s-2"],
  skillLabels: ["React", "TypeScript"],
  trustLevel: "DEELS",
  availabilitySummary: "Beschikbaar t/m 2026-06-30",
  awaySummary: null,
  hourlyRate: 85,
  completeness: 80,
  trackRecord: { completedCollaborations: 3, approvedHours: 120 },
};

const jan: FreelancerCard = {
  id: "fp-2",
  userId: "u-2",
  name: "Jan de Vries",
  headline: "Backend engineer",
  location: "Rotterdam",
  workMode: "REMOTE",
  skillIds: ["s-3"],
  skillLabels: ["Node.js"],
  trustLevel: "BASIS",
  availabilitySummary: null,
  awaySummary: "Afwezig t/m 20 jun 2026",
  hourlyRate: 75,
  completeness: 40,
  trackRecord: { completedCollaborations: 0, approvedHours: 0 },
};

const cards = [sanne, jan];

describe("applyFreelancerFilters", () => {
  it("geeft alle resultaten bij lege filters", () => {
    expect(applyFreelancerFilters(cards, {})).toHaveLength(2);
  });

  it("filtert op naam (case-insensitief)", () => {
    const r = applyFreelancerFilters(cards, { query: "sanne" });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("filtert op headline", () => {
    const r = applyFreelancerFilters(cards, { query: "backend" });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-2");
  });

  it("filtert op locatie", () => {
    const r = applyFreelancerFilters(cards, { query: "rotterdam" });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-2");
  });

  it("filtert op skill-naam", () => {
    const r = applyFreelancerFilters(cards, { query: "typescript" });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("geeft leeg bij niet-overeenkomende query", () => {
    expect(applyFreelancerFilters(cards, { query: "java" })).toHaveLength(0);
  });

  it("filtert op skillId (minstens één match)", () => {
    const r = applyFreelancerFilters(cards, { skillIds: ["s-1"] });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("filtert op skillId — onbekende id geeft leeg", () => {
    expect(applyFreelancerFilters(cards, { skillIds: ["s-99"] })).toHaveLength(0);
  });

  it("filtert op skillId — meerdere ids: match bij elke hit", () => {
    const r = applyFreelancerFilters(cards, { skillIds: ["s-1", "s-3"] });
    expect(r).toHaveLength(2);
  });

  it("filtert op trustLevel DEELS", () => {
    const r = applyFreelancerFilters(cards, { trustLevel: "DEELS" });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("lege trustLevel ('') filtert niet", () => {
    expect(applyFreelancerFilters(cards, { trustLevel: "" })).toHaveLength(2);
  });

  it("filtert op beschikbaarheid — availableOnly=true sluit jan uit", () => {
    const r = applyFreelancerFilters(cards, { availableOnly: true });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("availableOnly=false doet niets", () => {
    expect(applyFreelancerFilters(cards, { availableOnly: false })).toHaveLength(2);
  });

  it("combineert meerdere filters (AND)", () => {
    const r = applyFreelancerFilters(cards, { trustLevel: "DEELS", availableOnly: true });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe("fp-1");
  });

  it("lege cards-lijst geeft leeg terug", () => {
    expect(applyFreelancerFilters([], { query: "test" })).toHaveLength(0);
  });
});

describe("sortFreelancers", () => {
  // Extra kaarten voor eenduidige sorteervolgordes.
  const piet: FreelancerCard = {
    ...jan,
    id: "fp-3",
    userId: "u-3",
    name: "Piet Klaassen",
    trustLevel: "VOLLEDIG",
    availabilitySummary: "Direct beschikbaar",
    awaySummary: null,
    hourlyRate: 100,
    trackRecord: { completedCollaborations: 5, approvedHours: 200 },
  };
  const noRate: FreelancerCard = {
    ...jan,
    id: "fp-4",
    userId: "u-4",
    name: "Anna Zonder",
    hourlyRate: null,
    availabilitySummary: null,
  };
  const all = [sanne, jan, piet, noRate];

  it("'relevance' behoudt de invoervolgorde", () => {
    expect(sortFreelancers(all, "relevance").map((c) => c.id)).toEqual([
      "fp-1",
      "fp-2",
      "fp-3",
      "fp-4",
    ]);
  });

  it("muteert de invoer niet", () => {
    const input = [...all];
    sortFreelancers(input, "rate-desc");
    expect(input.map((c) => c.id)).toEqual(["fp-1", "fp-2", "fp-3", "fp-4"]);
  });

  it("'available' zet beschikbare ZZP'ers eerst, tiebreak op vertrouwen", () => {
    const r = sortFreelancers(all, "available").map((c) => c.id);
    // Beschikbaar: piet (VOLLEDIG) vóór sanne (DEELS); daarna de niet-beschikbare op naam.
    expect(r).toEqual(["fp-3", "fp-1", "fp-4", "fp-2"]);
  });

  it("'trust' sorteert op vertrouwensniveau (hoog → laag)", () => {
    const r = sortFreelancers(all, "trust").map((c) => c.trustLevel);
    expect(r).toEqual(["VOLLEDIG", "DEELS", "BASIS", "BASIS"]);
  });

  it("'rate-asc' sorteert oplopend met 'geen tarief' achteraan", () => {
    expect(sortFreelancers(all, "rate-asc").map((c) => c.id)).toEqual([
      "fp-2", // 75
      "fp-1", // 85
      "fp-3", // 100
      "fp-4", // null → achteraan
    ]);
  });

  it("'rate-desc' sorteert aflopend met 'geen tarief' achteraan", () => {
    expect(sortFreelancers(all, "rate-desc").map((c) => c.id)).toEqual([
      "fp-3", // 100
      "fp-1", // 85
      "fp-2", // 75
      "fp-4", // null → achteraan
    ]);
  });

  it("'track-record' sorteert op afgeronde samenwerkingen (dan uren)", () => {
    expect(sortFreelancers(all, "track-record").map((c) => c.id)).toEqual([
      "fp-3", // 5
      "fp-1", // 3
      "fp-4", // 0/0 — tiebreak op naam: "Anna" vóór "Jan"
      "fp-2", // 0/0
    ]);
  });

  it("breekt gelijke sleutels deterministisch op naam", () => {
    // jan en noRate hebben beide 0/0 track record → naam beslist (Anna < Jan).
    const r = sortFreelancers([jan, noRate], "track-record").map((c) => c.id);
    expect(r).toEqual(["fp-4", "fp-2"]);
  });
});

describe("buildFreelancerSkillCatalog", () => {
  // ZZP'ers met overlappende skills zodat frequentie meetbaar is.
  const a: FreelancerCard = {
    ...sanne,
    id: "fp-a",
    skillIds: ["s-react", "s-ts"],
    skillLabels: ["React", "TypeScript"],
  };
  const b: FreelancerCard = {
    ...sanne,
    id: "fp-b",
    skillIds: ["s-react", "s-node"],
    skillLabels: ["React", "Node.js"],
  };
  const c: FreelancerCard = {
    ...sanne,
    id: "fp-c",
    skillIds: ["s-ts"],
    skillLabels: ["TypeScript"],
  };

  it("geeft een lege catalogus voor lege invoer", () => {
    expect(buildFreelancerSkillCatalog([])).toEqual([]);
  });

  it("dedupliceert vaardigheden over meerdere ZZP'ers", () => {
    const catalog = buildFreelancerSkillCatalog([a, b, c]);
    expect(catalog.map((s) => s.id).sort()).toEqual(["s-node", "s-react", "s-ts"]);
  });

  it("sorteert op frequentie (meestvoorkomend eerst) — ties alfabetisch", () => {
    const catalog = buildFreelancerSkillCatalog([a, b, c]);
    // React (2) en TypeScript (2) hebben gelijke frequentie → alfabetisch: React vóór TypeScript.
    // Node.js komt 1x voor → achteraan.
    expect(catalog.map((s) => ({ id: s.id, count: s.count }))).toEqual([
      { id: "s-react", count: 2 },
      { id: "s-ts", count: 2 },
      { id: "s-node", count: 1 },
    ]);
  });

  it("neemt de eerste ontmoette naam (skillIds/skillLabels zijn index-aligned)", () => {
    const catalog = buildFreelancerSkillCatalog([a, b]);
    const react = catalog.find((s) => s.id === "s-react")!;
    expect(react.name).toBe("React");
  });

  it("valt op de skill-id terug als een label ontbreekt", () => {
    const gap: FreelancerCard = {
      ...sanne,
      id: "fp-gap",
      skillIds: ["s-orphan"],
      skillLabels: [], // labellijst korter dan idlijst — defensief pad
    };
    const catalog = buildFreelancerSkillCatalog([gap]);
    expect(catalog).toEqual([{ id: "s-orphan", name: "s-orphan", count: 1 }]);
  });

  it("negeert lege skill-ids (defensief tegen vervuilde data)", () => {
    const dirty: FreelancerCard = {
      ...sanne,
      id: "fp-dirty",
      skillIds: ["", "s-real"],
      skillLabels: ["", "Echte skill"],
    };
    const catalog = buildFreelancerSkillCatalog([dirty]);
    expect(catalog).toEqual([{ id: "s-real", name: "Echte skill", count: 1 }]);
  });

  it("muteert de invoer niet", () => {
    const input = [a, b, c];
    const before = input.map((card) => card.skillIds.slice());
    buildFreelancerSkillCatalog(input);
    input.forEach((card, i) => expect(card.skillIds).toEqual(before[i]));
  });
});
