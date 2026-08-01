import { describe, expect, it } from "vitest";
import {
  CANDIDATE_EXPERIENCE_MIN_COMPLETED,
  candidateExperienceSignal,
} from "@/lib/candidate-experience";

describe("candidateExperienceSignal", () => {
  it("toont het platform-brede ervaringssignaal voor een kandidaat zonder gedeelde historie", () => {
    const signal = candidateExperienceSignal(12, false);
    expect(signal).toEqual({ completed: 12, label: "12 afgeronde klussen" });
  });

  it("gebruikt het enkelvoud bij precies één afgeronde klus", () => {
    expect(candidateExperienceSignal(1, false)).toEqual({
      completed: 1,
      label: "1 afgeronde klus",
    });
  });

  it("verbergt het signaal bij gedeelde historie (geen stapeling met de sterkere rehire-chip)", () => {
    // Zelfs met veel platform-klussen: de gedeelde-historie-chip draagt dan het signaal.
    expect(candidateExperienceSignal(50, true)).toBeNull();
  });

  it("verbergt het signaal onder de drempel (geen magere 0-pronkerij)", () => {
    expect(candidateExperienceSignal(0, false)).toBeNull();
    expect(candidateExperienceSignal(CANDIDATE_EXPERIENCE_MIN_COMPLETED - 1, false)).toBeNull();
  });

  it("kapt een niet-gehele telling defensief naar beneden af", () => {
    expect(candidateExperienceSignal(3.9, false)).toEqual({
      completed: 3,
      label: "3 afgeronde klussen",
    });
  });

  it("valt veilig terug op geen signaal bij een niet-eindige of negatieve telling", () => {
    expect(candidateExperienceSignal(Number.NaN, false)).toBeNull();
    expect(candidateExperienceSignal(Number.POSITIVE_INFINITY, false)).toBeNull();
    expect(candidateExperienceSignal(-3, false)).toBeNull();
  });
});
