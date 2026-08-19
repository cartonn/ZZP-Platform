import { describe, expect, it } from "vitest";
import {
  runWebPushSelfTest,
  safeWebPushDetail,
  type WebPushProbeSpec,
} from "@/lib/services/push-selftest";
import type { WebPushProbeResult } from "@/lib/push/web-push";

const OK_PROBE: WebPushProbeResult = { subjectValid: true, signed: true, keypairMatches: true };

function configuredSpec(overrides: Partial<WebPushProbeSpec> = {}): WebPushProbeSpec {
  return {
    active: true,
    driverMode: "configured",
    run: async () => OK_PROBE,
    ...overrides,
  };
}

describe("runWebPushSelfTest", () => {
  it("meldt niets-getest wanneer web-push bewust uit staat", async () => {
    const report = await runWebPushSelfTest({ active: false, driverMode: "off" });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.driverMode).toBe("off");
    expect(report.detail).toContain("bewust uit");
  });

  it("negeert de run() van een uit-staand kanaal (geen probe bij off)", async () => {
    let called = false;
    const report = await runWebPushSelfTest({
      active: false,
      driverMode: "off",
      run: async () => {
        called = true;
        return OK_PROBE;
      },
    });

    expect(called).toBe(false);
    expect(report.ok).toBe(true);
  });

  it("markeert een halve config (partial) als fout zonder een probe te draaien", async () => {
    let called = false;
    const report = await runWebPushSelfTest({
      active: true,
      driverMode: "partial",
      run: async () => {
        called = true;
        return OK_PROBE;
      },
    });

    expect(called).toBe(false);
    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Halve VAPID-config");
  });

  it("slaagt wanneer de VAPID-probe subject, signering én keypair bevestigt", async () => {
    const report = await runWebPushSelfTest(configuredSpec());

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.detail).toContain("Operationeel");
  });

  it("faalt met een gerichte melding bij een ongeldig VAPID_SUBJECT", async () => {
    const report = await runWebPushSelfTest(
      configuredSpec({ run: async () => ({ ...OK_PROBE, subjectValid: false }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("VAPID_SUBJECT");
  });

  it("faalt met een gerichte melding wanneer de sleutels niet kunnen signeren", async () => {
    const report = await runWebPushSelfTest(
      configuredSpec({ run: async () => ({ ...OK_PROBE, signed: false }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("signeren");
  });

  it("faalt met een keypair-mismatch-melding wanneer public/private niet bij elkaar horen", async () => {
    const report = await runWebPushSelfTest(
      configuredSpec({ run: async () => ({ ...OK_PROBE, keypairMatches: false }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("hoort NIET bij");
  });

  it("controleert de subject vóór de signering (subject wint bij meerdere gebreken)", async () => {
    const report = await runWebPushSelfTest(
      configuredSpec({
        run: async () => ({ subjectValid: false, signed: false, keypairMatches: false }),
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("VAPID_SUBJECT");
  });

  it("toont voor een onverwachte fout uit de probe alleen de error-naam (geen sleutellek)", async () => {
    const report = await runWebPushSelfTest(
      configuredSpec({
        run: async () => {
          const err = new Error("VAPID_PRIVATE_KEY=super-geheime-waarde");
          err.name = "TypeError";
          throw err;
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("TypeError");
  });

  it("markeert een geconfigureerd kanaal zonder probe defensief als fout", async () => {
    const report = await runWebPushSelfTest({
      active: true,
      driverMode: "configured",
      run: undefined,
    });

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });
});

describe("safeWebPushDetail", () => {
  it("toont de error-naam, nooit het rauwe bericht", () => {
    const err = new Error("VAPID_PRIVATE_KEY=geheim");
    err.name = "RangeError";
    expect(safeWebPushDetail(err)).toBe("RangeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeWebPushDetail("boom")).toBe("Error");
  });
});
