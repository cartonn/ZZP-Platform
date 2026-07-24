import { describe, it, expect } from "vitest";
import {
  rankNextActions,
  franchiserNextActions,
  formatMissing,
  type NextAction,
} from "./next-actions";

function action(id: string, priority: number): NextAction {
  return { id, title: id, href: `/${id}`, tone: "info", priority };
}

describe("rankNextActions", () => {
  it("sorts by priority descending", () => {
    const ranked = rankNextActions([action("a", 10), action("b", 30), action("c", 20)]);
    expect(ranked.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("is stable: preserves input order for equal priority", () => {
    const ranked = rankNextActions([
      action("first", 50),
      action("second", 50),
      action("third", 50),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["first", "second", "third"]);
  });

  it("mixes equal and differing priorities stably", () => {
    const ranked = rankNextActions([
      action("a", 10),
      action("b", 20),
      action("c", 20),
      action("d", 10),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("returns an empty array for no input", () => {
    expect(rankNextActions([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [action("a", 10), action("b", 20)];
    const snapshot = input.map((x) => x.id);
    rankNextActions(input);
    expect(input.map((x) => x.id)).toEqual(snapshot);
  });
});

const allClearFranchiser = {
  companies: 2,
  publishedDiensten: 3,
  rosterFreelancers: 4,
  companiesWithoutDiensten: 0,
};

describe("franchiserNextActions", () => {
  it("toont niets wanneer de franchise volledig staat", () => {
    expect(franchiserNextActions(allClearFranchiser)).toEqual([]);
  });

  it("toont bij een lege tenant de opdrachtgever- én de roster-startstap (geen zinloze dienst-stap)", () => {
    const ranked = franchiserNextActions({
      companies: 0,
      publishedDiensten: 0,
      rosterFreelancers: 0,
      companiesWithoutDiensten: 0,
    });
    // first-client (90) boven roster (70); de dienst-stap ontbreekt want er is nog geen opdrachtgever.
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-first-client", "franchiser-roster-empty"]);
    expect(ranked[0]?.href).toBe("/franchise/opdrachtgevers/nieuw");
    expect(ranked[0]?.tone).toBe("info");
  });

  it("stuurt naar de eerste dienst zodra er een opdrachtgever is", () => {
    const ranked = franchiserNextActions({
      ...allClearFranchiser,
      publishedDiensten: 0,
      companiesWithoutDiensten: 2,
    });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-first-service"]);
    expect(ranked[0]?.href).toBe("/franchise/opdrachtgevers");
  });

  it("nudget opdrachtgevers-zonder-diensten zodra er al diensten lopen", () => {
    const ranked = franchiserNextActions({ ...allClearFranchiser, companiesWithoutDiensten: 1 });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-clients-without-service"]);
    expect(ranked[0]?.title).toContain("1 opdrachtgever");
  });

  it("toont eerste-dienst én roster bij een opdrachtgever zonder diensten en leeg roster, diensten bovenaan", () => {
    const ranked = franchiserNextActions({
      companies: 1,
      publishedDiensten: 0,
      rosterFreelancers: 0,
      companiesWithoutDiensten: 1,
    });
    // first-service (80) boven roster (70).
    expect(ranked.map((x) => x.id)).toEqual([
      "franchiser-first-service",
      "franchiser-roster-empty",
    ]);
  });

  it("toont alleen de roster-stap als diensten staan maar het roster leeg is", () => {
    const ranked = franchiserNextActions({ ...allClearFranchiser, rosterFreelancers: 0 });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-roster-empty"]);
    expect(ranked[0]?.href).toBe("/franchise/zzpers");
  });

  // De operationele attentiepunten (niet-inzetbare roster-ZZP'ers, te lang open diensten) leven op
  // item-niveau in pending-tasks.ts (franchiserTasks) — niet in deze guided-setup-aggregator. Zie
  // pending-tasks-franchiser.test.ts voor die dekking.
});

describe("formatMissing", () => {
  it("voegt tot max items samen", () => {
    expect(formatMissing(["Uurtarief", "Talen"])).toBe("Uurtarief, Talen");
  });
  it("kapt af met '+N meer'", () => {
    expect(formatMissing(["A", "B", "C", "D", "E"])).toBe("A, B, C +2 meer");
  });
  it("leeg = lege string", () => {
    expect(formatMissing([])).toBe("");
  });
});
