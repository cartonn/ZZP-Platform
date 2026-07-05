import { describe, it, expect } from "vitest";
import {
  classifyCandidateProximity,
  proximityLabel,
  PROXIMITY_VARIANT,
  PROXIMITY_NEAR_MAX,
  PROXIMITY_MODERATE_MAX,
} from "@/lib/candidate-proximity";

describe("classifyCandidateProximity", () => {
  it("geeft null voor een volledig remote opdracht (reistijd is niet van belang)", () => {
    expect(
      classifyCandidateProximity({
        jobWorkMode: "REMOTE",
        jobLocation: "Amsterdam",
        candidateLocation: "Groningen",
      }),
    ).toBeNull();
  });

  it("geeft null als de opdrachtplaats onbekend is (niet te schatten)", () => {
    expect(
      classifyCandidateProximity({
        jobWorkMode: "ONSITE",
        jobLocation: null,
        candidateLocation: "Amsterdam",
      }),
    ).toBeNull();
  });

  it("geeft null als de kandidaatplaats onbekend is", () => {
    expect(
      classifyCandidateProximity({
        jobWorkMode: "HYBRID",
        jobLocation: "Amsterdam",
        candidateLocation: "Onbekenddorp",
      }),
    ).toBeNull();
  });

  it("dezelfde stad telt als dichtbij (0 min)", () => {
    const p = classifyCandidateProximity({
      jobWorkMode: "ONSITE",
      jobLocation: "Amsterdam",
      candidateLocation: "amsterdam", // hoofdletterongevoelig
    });
    expect(p).not.toBeNull();
    expect(p!.minutes).toBe(0);
    expect(p!.level).toBe("near");
  });

  it("een naburige stad valt binnen de dichtbij-drempel", () => {
    const p = classifyCandidateProximity({
      jobWorkMode: "ONSITE",
      jobLocation: "Amsterdam",
      candidateLocation: "Haarlem",
    });
    expect(p).not.toBeNull();
    expect(p!.minutes).toBeLessThanOrEqual(PROXIMITY_NEAR_MAX);
    expect(p!.level).toBe("near");
  });

  it("een middellange rit valt in de moderate-bucket", () => {
    const p = classifyCandidateProximity({
      jobWorkMode: "HYBRID",
      jobLocation: "Amsterdam",
      candidateLocation: "Utrecht",
    });
    expect(p).not.toBeNull();
    expect(p!.minutes).toBeGreaterThan(PROXIMITY_NEAR_MAX);
    expect(p!.minutes).toBeLessThanOrEqual(PROXIMITY_MODERATE_MAX);
    expect(p!.level).toBe("moderate");
  });

  it("een lange rit valt in de far-bucket", () => {
    const p = classifyCandidateProximity({
      jobWorkMode: "ONSITE",
      jobLocation: "Amsterdam",
      candidateLocation: "Groningen",
    });
    expect(p).not.toBeNull();
    expect(p!.minutes).toBeGreaterThan(PROXIMITY_MODERATE_MAX);
    expect(p!.level).toBe("far");
  });
});

describe("proximityLabel + variant", () => {
  it("bouwt een leesbaar label met geschatte minuten", () => {
    expect(proximityLabel({ minutes: 18, level: "near" })).toBe("Dichtbij · ~18 min");
    expect(proximityLabel({ minutes: 52, level: "moderate" })).toBe("Reistijd · ~52 min");
    expect(proximityLabel({ minutes: 130, level: "far" })).toBe("Ver weg · ~130 min");
  });

  it("koppelt elk niveau aan een badge-variant", () => {
    expect(PROXIMITY_VARIANT.near).toBe("success");
    expect(PROXIMITY_VARIANT.moderate).toBe("muted");
    expect(PROXIMITY_VARIANT.far).toBe("warning");
  });
});
