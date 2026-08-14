import { describe, expect, it } from "vitest";
import type { PasswordBreachResult } from "@/lib/services/password-breach";
import {
  BREACH_PROBE_PASSWORD,
  runPasswordBreachSelfTest,
  safePasswordBreachDetail,
  type PasswordBreachProbeSpec,
} from "@/lib/services/password-breach-selftest";

function activeSpec(overrides: Partial<PasswordBreachProbeSpec> = {}): PasswordBreachProbeSpec {
  return {
    active: true,
    driverMode: "hibp",
    run: async (): Promise<PasswordBreachResult> => ({
      breached: true,
      skipped: false,
      count: 9_999_999,
    }),
    ...overrides,
  };
}

describe("runPasswordBreachSelfTest", () => {
  it("meldt niets-getest wanneer er geen controle actief is (noop)", async () => {
    const report = await runPasswordBreachSelfTest({ active: false, driverMode: "noop" });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.driverMode).toBe("noop");
    expect(report.detail).toContain("niets getest");
  });

  it("slaagt wanneer de actieve controle het bekend-gelekte test-wachtwoord herkent (breached)", async () => {
    const report = await runPasswordBreachSelfTest(activeSpec());

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.detail).toContain("herkend");
  });

  it("faalt wanneer de controle fail-open terugviel (skipped → niet bereikbaar)", async () => {
    const report = await runPasswordBreachSelfTest(
      activeSpec({ run: async () => ({ breached: false, skipped: true, count: 0 }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Niet bereikbaar");
  });

  it("faalt wanneer een bereikbare controle het gelekte wachtwoord NIET herkent (breached:false)", async () => {
    const report = await runPasswordBreachSelfTest(
      activeSpec({ run: async () => ({ breached: false, skipped: false, count: 0 }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("NIET herkend");
  });

  it("markeert een actieve controle zonder probe defensief als fout", async () => {
    const report = await runPasswordBreachSelfTest(activeSpec({ run: undefined }));

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });

  it("vangt een throw op en toont alleen de error-naam, nooit het rauwe bericht", async () => {
    const report = await runPasswordBreachSelfTest(
      activeSpec({
        run: async () => {
          const err = new Error("connect ECONNREFUSED api.pwnedpasswords.com:443");
          err.name = "AbortError";
          throw err;
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("AbortError");
  });
});

describe("BREACH_PROBE_PASSWORD", () => {
  it("is een niet-lege, publieke probe-string (geen gebruikersgegeven)", () => {
    expect(typeof BREACH_PROBE_PASSWORD).toBe("string");
    expect(BREACH_PROBE_PASSWORD.length).toBeGreaterThan(0);
  });
});

describe("safePasswordBreachDetail", () => {
  it("toont voor een Error alleen de naam", () => {
    const err = new Error("https://api.pwnedpasswords.com/range/XXXXX");
    err.name = "TypeError";
    expect(safePasswordBreachDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safePasswordBreachDetail("boom")).toBe("Error");
  });
});
