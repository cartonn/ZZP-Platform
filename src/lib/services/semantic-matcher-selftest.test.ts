import { describe, expect, it } from "vitest";
import {
  isPlausibleProbe,
  runSemanticMatcherSelfTest,
  safeSemanticMatcherDetail,
} from "@/lib/services/semantic-matcher-selftest";
import type { SemanticMatcherProbeResult } from "@/lib/services/semantic-matcher";

describe("isPlausibleProbe", () => {
  it("accepteert zelf-gelijkenis ~1 met discriminatie t.o.v. een ongerelateerd paar", () => {
    expect(isPlausibleProbe({ operational: true, selfScore: 1, crossScore: 0.2 })).toBe(true);
    expect(isPlausibleProbe({ operational: true, selfScore: 0.95, crossScore: 0.3 })).toBe(true);
  });

  it("wijst een te lage zelf-gelijkenis af", () => {
    expect(isPlausibleProbe({ operational: true, selfScore: 0.5, crossScore: 0.1 })).toBe(false);
  });

  it("wijst af zonder discriminatie (cross >= self)", () => {
    expect(isPlausibleProbe({ operational: true, selfScore: 0.95, crossScore: 0.95 })).toBe(false);
    expect(isPlausibleProbe({ operational: true, selfScore: 0.95, crossScore: 0.98 })).toBe(false);
  });

  it("wijst scores buiten [0,1] of ontbrekende scores af", () => {
    expect(isPlausibleProbe({ operational: true, selfScore: 1.2, crossScore: 0.2 })).toBe(false);
    expect(isPlausibleProbe({ operational: true, crossScore: 0.2 })).toBe(false);
    expect(isPlausibleProbe({ operational: true })).toBe(false);
  });
});

describe("runSemanticMatcherSelfTest", () => {
  it("meldt niets-getest wanneer de lokale matcher actief is (geen vals groen)", async () => {
    const report = await runSemanticMatcherSelfTest({ active: false, driverMode: "local" });
    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.detail).toMatch(/niets externs te testen/);
  });

  it("faalt wanneer pgvector geselecteerd is maar niet operationeel", async () => {
    const report = await runSemanticMatcherSelfTest({
      active: true,
      driverMode: "pgvector",
      run: async (): Promise<SemanticMatcherProbeResult> => ({ operational: false }),
    });
    expect(report.ok).toBe(false);
    expect(report.detail).toMatch(/niet operationeel/);
    expect(report.detail).toMatch(/lokale fallback/);
  });

  it("slaagt wanneer pgvector operationeel is met een plausibele round-trip", async () => {
    const report = await runSemanticMatcherSelfTest({
      active: true,
      driverMode: "pgvector",
      run: async (): Promise<SemanticMatcherProbeResult> => ({
        operational: true,
        selfScore: 1,
        crossScore: 0.15,
      }),
    });
    expect(report.ok).toBe(true);
    expect(report.detail).toMatch(/Operationeel/);
  });

  it("faalt wanneer pgvector operationeel is maar de round-trip onplausibel is (kapot contract)", async () => {
    const report = await runSemanticMatcherSelfTest({
      active: true,
      driverMode: "pgvector",
      run: async (): Promise<SemanticMatcherProbeResult> => ({
        operational: true,
        selfScore: 0.4,
        crossScore: 0.4,
      }),
    });
    expect(report.ok).toBe(false);
    expect(report.detail).toMatch(/klopt niet/);
  });

  it("een actieve driver zonder probe telt als fout", async () => {
    const report = await runSemanticMatcherSelfTest({ active: true, driverMode: "pgvector" });
    expect(report.ok).toBe(false);
    expect(report.detail).toMatch(/Geen probe/);
  });

  it("vangt een gooiende probe af tot een veilige, PII-vrije detail (error-naam)", async () => {
    class BoomError extends Error {
      constructor() {
        super("gevoelige host https://secret.internal/query?key=abc");
        this.name = "BoomError";
      }
    }
    const report = await runSemanticMatcherSelfTest({
      active: true,
      driverMode: "pgvector",
      run: async () => {
        throw new BoomError();
      },
    });
    expect(report.ok).toBe(false);
    expect(report.detail).toBe("BoomError");
    expect(report.detail).not.toMatch(/secret\.internal/);
  });
});

describe("safeSemanticMatcherDetail", () => {
  it("geeft de error-naam terug, nooit het rauwe bericht", () => {
    const err = new Error("host=https://x/y?key=secret");
    err.name = "TypeError";
    expect(safeSemanticMatcherDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor een niet-Error", () => {
    expect(safeSemanticMatcherDetail("string")).toBe("Error");
  });
});
