import { describe, expect, it } from "vitest";
import { RoutingConnectivityError } from "@/lib/services/routing";
import {
  runRoutingSelfTest,
  safeRoutingDetail,
  type RoutingProbeSpec,
} from "@/lib/services/routing-selftest";

function activeSpec(overrides: Partial<RoutingProbeSpec> = {}): RoutingProbeSpec {
  return {
    active: true,
    driverMode: "geoapify",
    run: async () => {},
    ...overrides,
  };
}

describe("runRoutingSelfTest", () => {
  it("meldt niets-getest wanneer routing op de offline schatter draait", async () => {
    const report = await runRoutingSelfTest({ active: false, driverMode: "offline" });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.driverMode).toBe("offline");
    expect(report.detail).toContain("Offline");
  });

  it("negeert de run() van een inactieve provider (geen externe call bij offline)", async () => {
    let called = false;
    const report = await runRoutingSelfTest({
      active: false,
      driverMode: "offline",
      run: async () => {
        called = true;
      },
    });

    expect(called).toBe(false);
    expect(report.ok).toBe(true);
  });

  it("slaagt wanneer een actieve provider de read-only controle doorstaat", async () => {
    const report = await runRoutingSelfTest(activeSpec());

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.detail).toContain("Bereikbaar");
  });

  it("faalt met een veilig bericht wanneer de provider een connectiviteitsfout werpt", async () => {
    const report = await runRoutingSelfTest(
      activeSpec({
        run: async () => {
          throw new RoutingConnectivityError("Routing-provider antwoordde met HTTP 401.", 401);
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("Routing-provider antwoordde met HTTP 401.");
  });

  it("toont voor een onverwachte fout alleen de error-naam, nooit het rauwe bericht", async () => {
    const report = await runRoutingSelfTest(
      activeSpec({
        run: async () => {
          const err = new Error("https://api.geoapify.com/v1/geocode/search?apiKey=geheim");
          err.name = "AbortError";
          throw err;
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("AbortError");
  });

  it("markeert een actieve provider zonder probe defensief als fout", async () => {
    const report = await runRoutingSelfTest(activeSpec({ run: undefined }));

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });
});

describe("safeRoutingDetail", () => {
  it("toont het (veilige) bericht van een RoutingConnectivityError", () => {
    expect(
      safeRoutingDetail(new RoutingConnectivityError("Routing-provider antwoordde met HTTP 500.")),
    ).toBe("Routing-provider antwoordde met HTTP 500.");
  });

  it("toont voor onbekende fouten alleen de error-naam", () => {
    const err = new Error("https://api.geoapify.com?apiKey=abc");
    err.name = "TypeError";
    expect(safeRoutingDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeRoutingDetail("boom")).toBe("Error");
  });
});
