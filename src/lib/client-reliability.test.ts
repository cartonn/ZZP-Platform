import { describe, expect, it } from "vitest";
import { computeClientReliability, type CancellationRow } from "./client-reliability";

const WHEN = new Date("2026-06-10T12:00:00Z");

function completed(): CancellationRow {
  return { status: "COMPLETED", cancelledAt: null, byClient: false, chargeable: false };
}

function clientCancel(chargeable = false): CancellationRow {
  return { status: "CANCELLED", cancelledAt: WHEN, byClient: true, chargeable };
}

function freelancerCancel(): CancellationRow {
  return { status: "CANCELLED", cancelledAt: WHEN, byClient: false, chargeable: false };
}

describe("computeClientReliability", () => {
  describe("unknown-grens (< 3 afgewikkelde toezeggingen)", () => {
    it("geeft unknown bij lege invoer", () => {
      const result = computeClientReliability([]);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(0);
      expect(result.cancellations).toBe(0);
      expect(result.cancelRate).toBeNull();
    });

    it("geeft unknown bij 2 afgewikkelde toezeggingen", () => {
      const result = computeClientReliability([completed(), clientCancel()]);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(2);
      expect(result.cancelRate).toBeNull();
    });
  });

  describe("tellers en noemer", () => {
    it("telt afgeronde samenwerkingen + eigen annuleringen als noemer", () => {
      const result = computeClientReliability([completed(), completed(), completed()]);
      expect(result.sampleSize).toBe(3);
      expect(result.cancellations).toBe(0);
      expect(result.cancelRate).toBe(0);
      expect(result.tone).toBe("good");
    });

    it("negeert annuleringen door de ZZP'er volledig (niet in teller of noemer)", () => {
      const result = computeClientReliability([
        completed(),
        completed(),
        completed(),
        freelancerCancel(),
        freelancerCancel(),
      ]);
      expect(result.sampleSize).toBe(3); // alleen de 3 afgeronde
      expect(result.cancellations).toBe(0);
      expect(result.tone).toBe("good");
    });

    it("rekent het annuleringspercentage over afgeronde + eigen annuleringen", () => {
      // 3 afgerond + 1 eigen annulering = noemer 4, teller 1 → 25%
      const result = computeClientReliability([
        completed(),
        completed(),
        completed(),
        clientCancel(),
      ]);
      expect(result.sampleSize).toBe(4);
      expect(result.cancellations).toBe(1);
      expect(result.cancelRate).toBe(25);
    });
  });

  describe("toon-bepaling", () => {
    it("good zonder enige annulering", () => {
      const result = computeClientReliability([completed(), completed(), completed()]);
      expect(result.tone).toBe("good");
    });

    it("neutral bij een lage annuleringsgraad zonder last-minute", () => {
      // 1 op 5 = 20% (≤ 25%), geen chargeable → neutral
      const result = computeClientReliability([
        completed(),
        completed(),
        completed(),
        completed(),
        clientCancel(false),
      ]);
      expect(result.cancelRate).toBe(20);
      expect(result.lastMinute).toBe(0);
      expect(result.tone).toBe("neutral");
    });

    it("warning bij een last-minute annulering, ongeacht de graad", () => {
      const result = computeClientReliability([
        completed(),
        completed(),
        completed(),
        completed(),
        clientCancel(true),
      ]);
      expect(result.lastMinute).toBe(1);
      expect(result.cancelRate).toBe(20);
      expect(result.tone).toBe("warning");
    });

    it("warning bij een hoog annuleringspercentage (> 25%)", () => {
      // 2 op 5 = 40%, geen last-minute → warning
      const result = computeClientReliability([
        completed(),
        completed(),
        completed(),
        clientCancel(false),
        clientCancel(false),
      ]);
      expect(result.cancelRate).toBe(40);
      expect(result.lastMinute).toBe(0);
      expect(result.tone).toBe("warning");
    });

    it("blijft good bij precies de steekproefgrens zonder annuleringen", () => {
      const result = computeClientReliability([completed(), completed(), completed()]);
      expect(result.sampleSize).toBe(3);
      expect(result.tone).toBe("good");
    });
  });

  it("muteert de invoer niet", () => {
    const rows = Object.freeze([completed(), clientCancel(true)]) as CancellationRow[];
    expect(() => computeClientReliability(rows)).not.toThrow();
  });
});
