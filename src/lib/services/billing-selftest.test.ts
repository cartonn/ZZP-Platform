import { describe, expect, it } from "vitest";
import { BillingConnectivityError } from "@/lib/billing/provider";
import {
  runBillingSelfTest,
  safeBillingDetail,
  type BillingProbeSpec,
} from "@/lib/services/billing-selftest";

function activeSpec(overrides: Partial<BillingProbeSpec> = {}): BillingProbeSpec {
  return {
    active: true,
    driverMode: "stripe",
    run: async () => {},
    ...overrides,
  };
}

describe("runBillingSelfTest", () => {
  it("meldt niets-getest wanneer de betaalflow op de demo (noop) draait", async () => {
    const report = await runBillingSelfTest({ active: false, driverMode: "noop" });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.driverMode).toBe("noop");
    expect(report.detail).toContain("Demo-flow");
  });

  it("negeert de run() van een inactieve provider (geen externe call bij noop)", async () => {
    let called = false;
    const report = await runBillingSelfTest({
      active: false,
      driverMode: "noop",
      run: async () => {
        called = true;
      },
    });

    expect(called).toBe(false);
    expect(report.ok).toBe(true);
  });

  it("slaagt wanneer een actieve provider de read-only controle doorstaat", async () => {
    const report = await runBillingSelfTest(activeSpec());

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.detail).toContain("Bereikbaar");
  });

  it("faalt met een veilig bericht wanneer de provider een connectiviteitsfout werpt", async () => {
    const report = await runBillingSelfTest(
      activeSpec({
        run: async () => {
          throw new BillingConnectivityError(
            "Stripe: connectiviteitscontrole mislukte (status 401).",
          );
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("Stripe: connectiviteitscontrole mislukte (status 401).");
  });

  it("toont voor een onverwachte fout alleen de error-naam, nooit het rauwe bericht", async () => {
    const report = await runBillingSelfTest(
      activeSpec({
        run: async () => {
          const err = new Error("https://api.stripe.com?key=sk_live_geheim");
          err.name = "AbortError";
          throw err;
        },
      }),
    );

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("AbortError");
  });

  it("markeert een actieve provider zonder probe defensief als fout", async () => {
    const report = await runBillingSelfTest(activeSpec({ run: undefined }));

    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });
});

describe("safeBillingDetail", () => {
  it("toont het (veilige) bericht van een BillingConnectivityError", () => {
    expect(safeBillingDetail(new BillingConnectivityError("Mollie: status 500."))).toBe(
      "Mollie: status 500.",
    );
  });

  it("toont voor onbekende fouten alleen de error-naam", () => {
    const err = new Error("https://secret-endpoint.example?token=abc");
    err.name = "TypeError";
    expect(safeBillingDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeBillingDetail("boom")).toBe("Error");
  });
});
