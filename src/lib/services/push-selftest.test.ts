import { describe, expect, it, vi } from "vitest";
import { runPushSelfTest } from "@/lib/services/push-selftest";
import type { VapidValidationResult } from "@/lib/push/vapid-validate";

const configured = (outcome: VapidValidationResult["outcome"]): (() => VapidValidationResult) => {
  return () => ({ outcome, configState: "configured" });
};

describe("runPushSelfTest", () => {
  it("niet geconfigureerd (off) → ok, inactief, niets getest (geen vals groen)", () => {
    const report = runPushSelfTest({ configState: "off" });
    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.outcome).toBe("off");
    expect(report.detail).toMatch(/niets getest/i);
  });

  it("halve activering (partial) → fout, inactief", () => {
    const report = runPushSelfTest({ configState: "partial" });
    expect(report.ok).toBe(false);
    expect(report.active).toBe(false);
    expect(report.outcome).toBe("partial");
  });

  it("geen validate() bij een geconfigureerd kanaal → fout (nooit vals groen)", () => {
    const report = runPushSelfTest({ configState: "configured" });
    expect(report.ok).toBe(false);
    expect(report.active).toBe(true);
    expect(report.detail).toMatch(/geen validatie/i);
  });

  it("geldig sleutelpaar → ok, actief", () => {
    const validate = vi.fn(configured("valid"));
    const report = runPushSelfTest({ configState: "configured", validate });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.outcome).toBe("valid");
  });

  it.each(["invalid-public", "invalid-private", "invalid-subject", "mismatched"] as const)(
    "misconfiguratie %s → fout, actief, met veilige toelichting",
    (outcome) => {
      const report = runPushSelfTest({ configState: "configured", validate: configured(outcome) });
      expect(report.ok).toBe(false);
      expect(report.active).toBe(true);
      expect(report.outcome).toBe(outcome);
      expect(report.detail && report.detail.length).toBeGreaterThan(0);
    },
  );

  it("mismatched heeft een expliciete 403-waarschuwing in de toelichting", () => {
    const report = runPushSelfTest({
      configState: "configured",
      validate: configured("mismatched"),
    });
    expect(report.detail).toMatch(/403/);
  });

  it("roept validate() niet aan wanneer het kanaal niet geconfigureerd is", () => {
    const validate = vi.fn(configured("valid"));
    runPushSelfTest({ configState: "off", validate });
    runPushSelfTest({ configState: "partial", validate });
    expect(validate).not.toHaveBeenCalled();
  });
});
