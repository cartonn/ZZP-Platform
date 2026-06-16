import { describe, expect, it } from "vitest";
import {
  APPLICATION_OUTCOME_MIN_SAMPLE,
  summarizeApplicationOutcomes,
  type ApplicationOutcomeInput,
} from "@/lib/application-outcomes";

function app(
  status: ApplicationOutcomeInput["status"],
  hasCollaboration = false,
): ApplicationOutcomeInput {
  return { status, hasCollaboration };
}

describe("summarizeApplicationOutcomes", () => {
  it("geeft nullen + null-percentages terug voor een lege lijst", () => {
    const out = summarizeApplicationOutcomes([]);
    expect(out).toEqual({
      total: 0,
      open: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      seen: 0,
      collaborations: 0,
      responseRate: null,
      acceptanceRate: null,
    });
  });

  it("telt per status en rekent open = NEW + VIEWED + SHORTLIST", () => {
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.total).toBe(5);
    expect(out.open).toBe(3);
    expect(out.shortlisted).toBe(1);
    expect(out.accepted).toBe(1);
    expect(out.rejected).toBe(1);
  });

  it("telt 'seen' als alles behalve NEW", () => {
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.seen).toBe(4);
  });

  it("telt samenwerkingen die uit reacties voortkwamen", () => {
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED", true),
      app("ACCEPTED", false),
      app("REJECTED", false),
    ]);
    expect(out.collaborations).toBe(1);
  });

  it("responseRate = bekeken / totaal, afgerond, op de steekproefdrempel", () => {
    // 4 reacties (= drempel), 3 bekeken -> 75%
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("REJECTED"),
    ]);
    expect(out.total).toBe(APPLICATION_OUTCOME_MIN_SAMPLE);
    expect(out.responseRate).toBe(75);
  });

  it("responseRate is null onder de steekproefdrempel", () => {
    const out = summarizeApplicationOutcomes([app("VIEWED"), app("VIEWED"), app("VIEWED")]);
    expect(out.responseRate).toBeNull();
  });

  it("acceptanceRate = geaccepteerd / beoordeeld (geaccepteerd + afgewezen)", () => {
    // open reacties tellen niet mee in de noemer: 2 geaccepteerd, 2 afgewezen -> 50%
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED"),
      app("ACCEPTED"),
      app("REJECTED"),
      app("REJECTED"),
      app("NEW"),
      app("SHORTLIST"),
    ]);
    expect(out.acceptanceRate).toBe(50);
  });

  it("acceptanceRate is null wanneer er te weinig beoordeelde reacties zijn", () => {
    // 10 reacties maar slechts 3 beoordeeld -> onder de drempel
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED"),
      app("REJECTED"),
      app("REJECTED"),
      app("NEW"),
      app("NEW"),
      app("VIEWED"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("SHORTLIST"),
      app("SHORTLIST"),
    ]);
    expect(out.acceptanceRate).toBeNull();
    // responseRate gebruikt het totaal en haalt de drempel wél
    expect(out.responseRate).not.toBeNull();
  });

  it("rondt percentages commercieel af", () => {
    // 6 reacties, 5 bekeken -> 83.33 -> 83
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.responseRate).toBe(83);
  });

  it("respecteert een aangepaste minSample", () => {
    const out = summarizeApplicationOutcomes([app("ACCEPTED"), app("REJECTED")], 2);
    expect(out.responseRate).toBe(100);
    expect(out.acceptanceRate).toBe(50);
  });

  it("muteert de invoer niet", () => {
    const input = Object.freeze([app("ACCEPTED"), app("NEW")]);
    expect(() => summarizeApplicationOutcomes(input)).not.toThrow();
    expect(input).toHaveLength(2);
  });
});
