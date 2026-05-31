import { describe, expect, it } from "vitest";
import {
  computeOnboardingSteps,
  isOnboardingComplete,
  type OnboardingData,
} from "@/lib/onboarding";

const allFalse: OnboardingData = {
  profileComplete: false,
  hasCredential: false,
  hasAvailability: false,
  hasApplied: false,
};

const allTrue: OnboardingData = {
  profileComplete: true,
  hasCredential: true,
  hasAvailability: true,
  hasApplied: true,
};

describe("computeOnboardingSteps", () => {
  it("geeft 4 stappen terug als alles false is", () => {
    const steps = computeOnboardingSteps(allFalse);
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => !s.completed)).toBe(true);
  });

  it("geeft 4 stappen terug als alles true is", () => {
    const steps = computeOnboardingSteps(allTrue);
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => s.completed)).toBe(true);
  });

  it("markeert de juiste stappen als voltooid bij gedeeltelijke voortgang", () => {
    const data: OnboardingData = {
      profileComplete: true,
      hasCredential: true,
      hasAvailability: true,
      hasApplied: false,
    };
    const steps = computeOnboardingSteps(data);
    expect(steps).toHaveLength(4);
    const completed = steps.filter((s) => s.completed);
    const incomplete = steps.filter((s) => !s.completed);
    expect(completed).toHaveLength(3);
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0]!.id).toBe("apply");
  });

  it("stap-ids zijn correct", () => {
    const steps = computeOnboardingSteps(allFalse);
    expect(steps.map((s) => s.id)).toEqual(["profile", "credential", "availability", "apply"]);
  });

  it("stap-hrefs zijn correct", () => {
    const steps = computeOnboardingSteps(allFalse);
    expect(steps[0]!.href).toBe("/profiel");
    expect(steps[1]!.href).toBe("/certificaten/nieuw");
    expect(steps[2]!.href).toBe("/beschikbaarheid");
    expect(steps[3]!.href).toBe("/opdrachten");
  });
});

describe("isOnboardingComplete", () => {
  it("geeft true als alle stappen voltooid zijn", () => {
    const steps = computeOnboardingSteps(allTrue);
    expect(isOnboardingComplete(steps)).toBe(true);
  });

  it("geeft false als niet alle stappen voltooid zijn", () => {
    const steps = computeOnboardingSteps(allFalse);
    expect(isOnboardingComplete(steps)).toBe(false);
  });

  it("geeft false bij 3 van 4 stappen voltooid", () => {
    const data: OnboardingData = {
      profileComplete: true,
      hasCredential: true,
      hasAvailability: true,
      hasApplied: false,
    };
    const steps = computeOnboardingSteps(data);
    expect(isOnboardingComplete(steps)).toBe(false);
  });

  it("geeft true bij lege lijst", () => {
    expect(isOnboardingComplete([])).toBe(true);
  });
});
