import { describe, expect, it } from "vitest";
import type { UploadScanResult } from "@/lib/services/upload-scanner";
import {
  eicarProbeBuffer,
  runUploadScannerSelfTest,
  safeUploadScannerDetail,
  type UploadScannerProbeSpec,
} from "@/lib/services/upload-scanner-selftest";

function activeSpec(overrides: Partial<UploadScannerProbeSpec> = {}): UploadScannerProbeSpec {
  return {
    active: true,
    driverMode: "clamav",
    failOpen: false,
    run: async (): Promise<UploadScanResult> => ({ verdict: "infected", scanner: "clamav" }),
    ...overrides,
  };
}

describe("runUploadScannerSelfTest", () => {
  it("meldt niets-getest wanneer er geen scanner actief is (noop)", async () => {
    const report = await runUploadScannerSelfTest({
      active: false,
      driverMode: "noop",
      failOpen: false,
    });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.driverMode).toBe("noop");
    expect(report.detail).toContain("niets getest");
  });

  it("slaagt wanneer de actieve scanner het EICAR-testvirus herkent (infected)", async () => {
    const report = await runUploadScannerSelfTest(activeSpec());

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.detail).toContain("herkend");
  });

  it("faalt wanneer een bereikbare scanner het EICAR-virus NIET herkent (clean → definities)", async () => {
    const report = await runUploadScannerSelfTest(
      activeSpec({ run: async () => ({ verdict: "clean", scanner: "clamav" }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("virusdefinities");
  });

  it("faalt met het foutbericht wanneer de scanner een error-verdict geeft", async () => {
    const report = await runUploadScannerSelfTest(
      activeSpec({
        run: async () => ({
          verdict: "error",
          scanner: "clamav",
          message: "Lege respons van clamd.",
        }),
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("Lege respons van clamd.");
  });

  it("faalt wanneer de scan onverwacht wordt overgeslagen (skipped)", async () => {
    const report = await runUploadScannerSelfTest(
      activeSpec({ run: async () => ({ verdict: "skipped", scanner: "clamav" }) }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("overgeslagen");
  });

  it("markeert een actieve scanner zonder probe defensief als fout", async () => {
    const report = await runUploadScannerSelfTest(activeSpec({ run: undefined }));

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });

  it("vangt een throw op en toont alleen de error-naam, nooit het rauwe bericht", async () => {
    const report = await runUploadScannerSelfTest(
      activeSpec({
        run: async () => {
          const err = new Error("connect ECONNREFUSED clamd-host:3310");
          err.name = "AbortError";
          throw err;
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("AbortError");
  });
});

describe("eicarProbeBuffer", () => {
  it("bevat de volledige EICAR-signatuur en is ascii", () => {
    const buffer = eicarProbeBuffer();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("ascii")).toBe(
      "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
    );
  });
});

describe("safeUploadScannerDetail", () => {
  it("toont voor een Error alleen de naam", () => {
    const err = new Error("https://secret-host.example:3310");
    err.name = "TypeError";
    expect(safeUploadScannerDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeUploadScannerDetail("boom")).toBe("Error");
  });
});
