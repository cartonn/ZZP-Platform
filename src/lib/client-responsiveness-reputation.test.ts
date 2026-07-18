import { describe, expect, it } from "vitest";
import { summarizeResponsivenessReputation } from "@/lib/client-responsiveness-reputation";
import { type ClientResponsiveness } from "@/lib/client-responsiveness";

function responsiveness(overrides: Partial<ClientResponsiveness> = {}): ClientResponsiveness {
  return {
    sampleSize: 6,
    handled: 6,
    pending: 0,
    handledPct: 100,
    oldestPendingDays: null,
    stalePending: 0,
    tone: "good",
    ...overrides,
  };
}

describe("summarizeResponsivenessReputation", () => {
  it("prijst een opdrachtgever die reacties snel oppakt (good) met cijfers", () => {
    const r = summarizeResponsivenessReputation(responsiveness({ tone: "good" }));
    expect(r.tone).toBe("good");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/snel oppakt/i);
    expect(r.tip.length).toBeGreaterThan(0);
  });

  it("nudget een neutrale opdrachtgever richting snellere opvolging", () => {
    const r = summarizeResponsivenessReputation(
      responsiveness({ tone: "neutral", handledPct: 65 }),
    );
    expect(r.tone).toBe("neutral");
    expect(r.hasStats).toBe(true);
    expect(r.tip).toMatch(/paar dagen|snelle opvolging/i);
  });

  it("waarschuwt een opdrachtgever dat blijven-liggen kandidaten kost", () => {
    const r = summarizeResponsivenessReputation(
      responsiveness({ tone: "warning", handledPct: 40, pending: 4, stalePending: 3 }),
    );
    expect(r.tone).toBe("warning");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/laat liggen/i);
    expect(r.tip).toMatch(/kandidaten|herstellen/i);
  });

  it("geeft bij te weinig historie (unknown) een opbouwende boodschap zonder cijfers", () => {
    const r = summarizeResponsivenessReputation(
      responsiveness({
        tone: "unknown",
        sampleSize: 1,
        handled: 1,
        pending: 0,
        handledPct: null,
      }),
    );
    expect(r.tone).toBe("unknown");
    expect(r.hasStats).toBe(false);
    expect(r.headline).toMatch(/nog geen/i);
    expect(r.tip).toMatch(/snel op/i);
  });
});
