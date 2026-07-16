import { describe, expect, it } from "vitest";
import {
  VerifierNotConfiguredError,
  VerifierRequestError,
  type RawVerifyResponse,
} from "@/lib/services/http-verify";
import {
  runVerifierSelfTest,
  safeVerifierDetail,
  type VerifierProbeSpec,
} from "@/lib/services/verify-selftest";

const ok: RawVerifyResponse = { verified: true };
const notVerified: RawVerifyResponse = { verified: false, message: "Onbekend" };

function activeSpec(overrides: Partial<VerifierProbeSpec> = {}): VerifierProbeSpec {
  return {
    key: "diploma",
    label: "DUO — diploma's",
    active: true,
    driverMode: "duo",
    run: async () => ok,
    ...overrides,
  };
}

describe("runVerifierSelfTest", () => {
  it("meldt niets-getest wanneer alle adapters op de demo-verifier draaien", async () => {
    const report = await runVerifierSelfTest([
      { key: "diploma", label: "DUO", active: false, driverMode: "mock" },
      { key: "big", label: "BIG", active: false, driverMode: "mock" },
      { key: "identity", label: "iDIN", active: false, driverMode: "mock" },
    ]);

    expect(report.ok).toBe(true);
    expect(report.anyActive).toBe(false);
    expect(report.results).toHaveLength(3);
    expect(report.results.every((r) => r.ok && !r.active)).toBe(true);
    expect(report.results[0]?.detail).toContain("Demo-verifier");
  });

  it("slaagt wanneer een actieve adapter volgens contract antwoordt (ook verified:false)", async () => {
    const report = await runVerifierSelfTest([activeSpec({ run: async () => notVerified })]);

    expect(report.ok).toBe(true);
    expect(report.anyActive).toBe(true);
    expect(report.results[0]?.ok).toBe(true);
    expect(report.results[0]?.detail).toContain("Bereikbaar");
  });

  it("faalt wanneer een actieve adapter een verzoekfout werpt, met veilig bericht", async () => {
    const report = await runVerifierSelfTest([
      activeSpec({
        run: async () => {
          throw new VerifierRequestError("DUO: koppeling gaf status 401.");
        },
      }),
    ]);

    expect(report.ok).toBe(false);
    expect(report.results[0]?.ok).toBe(false);
    expect(report.results[0]?.detail).toBe("DUO: koppeling gaf status 401.");
  });

  it("laat een inactieve adapter het geheel niet doen falen", async () => {
    const report = await runVerifierSelfTest([
      activeSpec(),
      { key: "big", label: "BIG", active: false, driverMode: "mock" },
    ]);

    expect(report.anyActive).toBe(true);
    expect(report.ok).toBe(true);
  });

  it("markeert een actieve adapter zonder probe defensief als fout", async () => {
    const report = await runVerifierSelfTest([activeSpec({ run: undefined })]);

    expect(report.ok).toBe(false);
    expect(report.results[0]?.ok).toBe(false);
    expect(report.results[0]?.detail).toContain("Geen probe");
  });

  it("aggregeert ok alleen over de actieve adapters", async () => {
    const report = await runVerifierSelfTest([
      activeSpec({ key: "diploma", driverMode: "duo", run: async () => ok }),
      activeSpec({
        key: "big",
        label: "BIG",
        driverMode: "bigregister",
        run: async () => {
          throw new VerifierRequestError("BIG: kon de koppeling niet bereiken.");
        },
      }),
      { key: "identity", label: "iDIN", active: false, driverMode: "mock" },
    ]);

    expect(report.ok).toBe(false);
    expect(report.results.find((r) => r.key === "diploma")?.ok).toBe(true);
    expect(report.results.find((r) => r.key === "big")?.ok).toBe(false);
    expect(report.results.find((r) => r.key === "identity")?.ok).toBe(true);
  });
});

describe("safeVerifierDetail", () => {
  it("toont het (veilige) bericht van bekende verifier-fouttypes", () => {
    expect(safeVerifierDetail(new VerifierRequestError("DUO: time-out."))).toBe("DUO: time-out.");
    expect(safeVerifierDetail(new VerifierNotConfiguredError("DUO"))).toContain("DUO");
  });

  it("toont voor onbekende fouten alleen de error-naam, nooit het rauwe bericht", () => {
    const err = new Error("https://secret-endpoint.example/verify?token=abc");
    err.name = "TypeError";
    expect(safeVerifierDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeVerifierDetail("boom")).toBe("Error");
  });
});
