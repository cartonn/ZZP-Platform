import { describe, expect, it } from "vitest";
import {
  FEASIBILITY_PILL,
  hoursFeasibilityPill,
  hoursProgressTone,
} from "@/lib/tax/urencriterium-progress";

describe("hoursProgressTone", () => {
  it("groen zodra het criterium gehaald is (ook als de prognose niet meer relevant is)", () => {
    expect(hoursProgressTone({ met: true, projectedMet: false })).toBe("bg-success");
    expect(hoursProgressTone({ met: true, projectedMet: true })).toBe("bg-success");
  });

  it("primair wanneer nog niet gehaald maar de prognose de grens haalt (op koers)", () => {
    expect(hoursProgressTone({ met: false, projectedMet: true })).toBe("bg-primary");
  });

  it("neutraal bij achterstand (niet gehaald, prognose haalt de grens niet)", () => {
    expect(hoursProgressTone({ met: false, projectedMet: false })).toBe("bg-muted-foreground");
  });
});

describe("hoursFeasibilityPill", () => {
  it("geen pill zonder activiteit, ongeacht de haalbaarheid", () => {
    expect(hoursFeasibilityPill({ noActivity: true, feasibility: "onhaalbaar" })).toBeUndefined();
    expect(hoursFeasibilityPill({ noActivity: true, feasibility: "haalbaar" })).toBeUndefined();
  });

  it("geen pill bij een positieve stand (gehaald / op koers)", () => {
    expect(hoursFeasibilityPill({ noActivity: false, feasibility: "gehaald" })).toBeUndefined();
    expect(hoursFeasibilityPill({ noActivity: false, feasibility: "op-koers" })).toBeUndefined();
  });

  it("toont de juiste pill bij achterstand", () => {
    expect(hoursFeasibilityPill({ noActivity: false, feasibility: "haalbaar" })).toEqual({
      label: "Nog haalbaar",
      variant: "accent",
    });
    expect(hoursFeasibilityPill({ noActivity: false, feasibility: "ambitieus" })).toEqual({
      label: "Ambitieus tempo",
      variant: "warning",
    });
    expect(hoursFeasibilityPill({ noActivity: false, feasibility: "onhaalbaar" })).toEqual({
      label: "Dit jaar niet meer",
      variant: "danger",
    });
  });

  it("de pill-map dekt exact de drie achterstand-standen (geen gehaald/op-koers)", () => {
    expect(Object.keys(FEASIBILITY_PILL).sort()).toEqual(["ambitieus", "haalbaar", "onhaalbaar"]);
  });
});
