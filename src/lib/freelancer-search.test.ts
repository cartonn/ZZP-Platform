import { describe, expect, it } from "vitest";
import { applyFreelancerFilters, type FreelancerCard } from "@/lib/freelancer-search";

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
