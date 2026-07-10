import { describe, it, expect } from "vitest";
import {
  isIdleReady,
  summarizeRosterCapacity,
  rosterCapacityHeadline,
  type RosterCapacityInput,
} from "./roster-capacity";

function zzper(over: Partial<RosterCapacityInput> = {}): RosterCapacityInput {
  return {
    engageabilityStatus: "ACTIEF",
    availability: "AVAILABLE",
    activeCollaborations: 0,
    ...over,
  };
}

describe("isIdleReady", () => {
  it("is vrij inzetbaar bij ACTIEF + beschikbaar + geen lopende opdracht", () => {
    expect(isIdleReady(zzper())).toBe(true);
    expect(isIdleReady(zzper({ availability: "LIMITED" }))).toBe(true);
  });

  it("is niet vrij inzetbaar met een lopende opdracht", () => {
    expect(isIdleReady(zzper({ activeCollaborations: 1 }))).toBe(false);
  });

  it("is niet vrij inzetbaar als niet inzetbaar", () => {
    expect(isIdleReady(zzper({ engageabilityStatus: "AANDACHT" }))).toBe(false);
    expect(isIdleReady(zzper({ engageabilityStatus: "INACTIEF" }))).toBe(false);
  });

  it("is niet vrij inzetbaar als niet beschikbaar", () => {
    expect(isIdleReady(zzper({ availability: "UNAVAILABLE" }))).toBe(false);
  });
});

describe("summarizeRosterCapacity", () => {
  it("telt een leeg roster naar nul", () => {
    expect(summarizeRosterCapacity([])).toEqual({
      total: 0,
      idleReady: 0,
      placed: 0,
      needsAttention: 0,
      unavailable: 0,
    });
  });

  it("partitioneert in vier elkaar uitsluitende buckets die samen total vormen", () => {
    const items = [
      zzper(), // idleReady
      zzper({ availability: "LIMITED" }), // idleReady
      zzper({ activeCollaborations: 2 }), // placed
      zzper({ engageabilityStatus: "AANDACHT" }), // needsAttention
      zzper({ engageabilityStatus: "INACTIEF" }), // needsAttention
      zzper({ availability: "UNAVAILABLE" }), // unavailable
    ];
    const s = summarizeRosterCapacity(items);
    expect(s).toEqual({
      total: 6,
      idleReady: 2,
      placed: 1,
      needsAttention: 2,
      unavailable: 1,
    });
    expect(s.idleReady + s.placed + s.needsAttention + s.unavailable).toBe(s.total);
  });

  it("laat 'nu ingezet' winnen van een aandachtspunt (werkt telt niet als vrije capaciteit)", () => {
    const s = summarizeRosterCapacity([
      zzper({ engageabilityStatus: "AANDACHT", activeCollaborations: 1 }),
    ]);
    expect(s.placed).toBe(1);
    expect(s.needsAttention).toBe(0);
  });
});

describe("rosterCapacityHeadline", () => {
  it("is null bij een leeg roster", () => {
    expect(rosterCapacityHeadline(summarizeRosterCapacity([]))).toBeNull();
  });

  it("benoemt vrije capaciteit als die er is", () => {
    const s = summarizeRosterCapacity([zzper(), zzper()]);
    expect(rosterCapacityHeadline(s)).toContain("2 vakmensen nu vrij inzetbaar");
  });

  it("gebruikt enkelvoud bij één vrij-inzetbare", () => {
    const s = summarizeRosterCapacity([zzper()]);
    expect(rosterCapacityHeadline(s)).toContain("1 vakmens nu vrij inzetbaar");
  });

  it("wijst op aandacht als er geen vrije capaciteit is maar wel pijplijn", () => {
    const s = summarizeRosterCapacity([zzper({ engageabilityStatus: "INACTIEF" })]);
    expect(rosterCapacityHeadline(s)).toContain("aandacht vóór plaatsing");
  });

  it("meldt dat iedereen ingezet is", () => {
    const s = summarizeRosterCapacity([zzper({ activeCollaborations: 1 })]);
    expect(rosterCapacityHeadline(s)).toBe("Iedereen in je roster is nu ingezet.");
  });

  it("meldt geen vrije capaciteit bij enkel niet-beschikbare vakmensen", () => {
    const s = summarizeRosterCapacity([zzper({ availability: "UNAVAILABLE" })]);
    expect(rosterCapacityHeadline(s)).toBe("Geen vrij-inzetbare vakmensen op dit moment.");
  });
});
