import { describe, expect, it } from "vitest";
import { scoreRingStrokeClass } from "@/components/ui/score-ring";

describe("scoreRingStrokeClass", () => {
  it("is success (zegelgroen) vanaf 75", () => {
    expect(scoreRingStrokeClass(75)).toBe("stroke-success");
    expect(scoreRingStrokeClass(90)).toBe("stroke-success");
    expect(scoreRingStrokeClass(100)).toBe("stroke-success");
  });

  it("is neutraal in de middenband 60–74", () => {
    expect(scoreRingStrokeClass(60)).toBe("stroke-muted-foreground");
    expect(scoreRingStrokeClass(67)).toBe("stroke-muted-foreground");
    expect(scoreRingStrokeClass(74)).toBe("stroke-muted-foreground");
  });

  it("is warning (amber) onder 60 — 55% kleurt niet meer groen", () => {
    expect(scoreRingStrokeClass(59)).toBe("stroke-warning");
    expect(scoreRingStrokeClass(55)).toBe("stroke-warning");
    expect(scoreRingStrokeClass(0)).toBe("stroke-warning");
  });

  it("klemt en rondt af buiten 0–100", () => {
    expect(scoreRingStrokeClass(74.6)).toBe("stroke-success"); // rondt naar 75
    expect(scoreRingStrokeClass(150)).toBe("stroke-success");
    expect(scoreRingStrokeClass(-10)).toBe("stroke-warning");
  });
});
