import { describe, expect, it } from "vitest";
import { defineStateMachine, StateTransitionError } from "@/lib/state-machine";

type S = "A" | "B" | "C";
const sm = defineStateMachine<S>("Test", {
  A: ["B"],
  B: ["C", "A"],
  C: [],
});

describe("defineStateMachine", () => {
  it("staat geldige overgangen toe", () => {
    expect(sm.can("A", "B")).toBe(true);
    expect(sm.can("B", "C")).toBe(true);
    expect(sm.can("B", "A")).toBe(true);
  });

  it("weigert ongeldige overgangen", () => {
    expect(sm.can("A", "C")).toBe(false);
    expect(sm.can("C", "A")).toBe(false);
  });

  it("assert gooit StateTransitionError bij een ongeldige overgang", () => {
    expect(() => sm.assert("A", "B")).not.toThrow();
    expect(() => sm.assert("A", "C")).toThrowError(StateTransitionError);
    try {
      sm.assert("C", "A");
    } catch (err) {
      expect(err).toBeInstanceOf(StateTransitionError);
      expect((err as StateTransitionError).entity).toBe("Test");
      expect((err as StateTransitionError).from).toBe("C");
      expect((err as StateTransitionError).to).toBe("A");
    }
  });

  it("next geeft de toegestane vervolgtoestanden", () => {
    expect(sm.next("B")).toEqual(["C", "A"]);
    expect(sm.next("C")).toEqual([]);
  });

  it("isTerminal herkent eindtoestanden", () => {
    expect(sm.isTerminal("C")).toBe(true);
    expect(sm.isTerminal("A")).toBe(false);
  });

  it("isState is een runtime guard voor bekende toestanden", () => {
    expect(sm.isState("A")).toBe(true);
    expect(sm.isState("X")).toBe(false);
    expect(sm.isState(42)).toBe(false);
  });

  it("weigert een definitie met een overgang naar een onbekende toestand", () => {
    expect(() =>
      // @ts-expect-error — opzettelijk ongeldige doeltoestand
      defineStateMachine<S>("Bad", { A: ["Z"], B: [], C: [] }),
    ).toThrowError(/onbekende toestand/);
  });
});
