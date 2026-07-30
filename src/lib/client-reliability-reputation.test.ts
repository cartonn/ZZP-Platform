import { describe, expect, it } from "vitest";
import { summarizeReliabilityReputation } from "@/lib/client-reliability-reputation";
import { type ClientReliability } from "@/lib/client-reliability";

function reliability(overrides: Partial<ClientReliability> = {}): ClientReliability {
  return {
    sampleSize: 6,
    cancellations: 0,
    lastMinute: 0,
    cancelRate: 0,
    tone: "good",
    ...overrides,
  };
}

describe("summarizeReliabilityReputation", () => {
  it("prijst een betrouwbare opdrachtgever (good) en toont cijfers", () => {
    const r = summarizeReliabilityReputation(reliability({ tone: "good" }));
    expect(r.tone).toBe("good");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/betrouwbaar in afspraken/i);
    expect(r.tip.length).toBeGreaterThan(0);
  });

  it("nudget een neutrale opdrachtgever richting minder annuleren", () => {
    const r = summarizeReliabilityReputation(
      reliability({ tone: "neutral", cancellations: 1, cancelRate: 17 }),
    );
    expect(r.tone).toBe("neutral");
    expect(r.hasStats).toBe(true);
    expect(r.tip).toMatch(/annuleer|betrouwbaarheid/i);
  });

  it("waarschuwt een vaak-annulerende opdrachtgever dat het hem vakmensen kost", () => {
    const r = summarizeReliabilityReputation(
      reliability({ tone: "warning", cancellations: 3, lastMinute: 2, cancelRate: 50 }),
    );
    expect(r.tone).toBe("warning");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/vaak annuleert/i);
    expect(r.tip).toMatch(/last-minute|reputatie te herstellen/i);
  });

  it("geeft bij te weinig historie (unknown) een opbouwende boodschap zonder cijfers", () => {
    const r = summarizeReliabilityReputation(
      reliability({ tone: "unknown", sampleSize: 1, cancelRate: null }),
    );
    expect(r.tone).toBe("unknown");
    expect(r.hasStats).toBe(false);
    expect(r.headline).toMatch(/nog geen/i);
    expect(r.tip).toMatch(/eerste toezeggingen/i);
  });

  it("houdt de tone identiek aan de invoer (geen eigen herclassificatie)", () => {
    for (const tone of ["good", "neutral", "warning", "unknown"] as const) {
      expect(summarizeReliabilityReputation(reliability({ tone })).tone).toBe(tone);
    }
  });
});
