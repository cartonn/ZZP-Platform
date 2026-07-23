import { describe, expect, it } from "vitest";
import { MailConnectivityError } from "@/lib/services/mail-sender";
import {
  runMailConnectivitySelfTest,
  safeMailConnectivityDetail,
} from "@/lib/services/mail-connectivity-selftest";

describe("safeMailConnectivityDetail", () => {
  it("toont het veilige bericht van een MailConnectivityError", () => {
    expect(safeMailConnectivityDetail(new MailConnectivityError("Resend: status 401"))).toBe(
      "Resend: status 401",
    );
  });

  it("toont alleen de error-NAAM van een gewone fout (nooit het rauwe bericht)", () => {
    const err = new Error("geheim endpoint https://intern/keys");
    err.name = "TypeError";
    expect(safeMailConnectivityDetail(err)).toBe("TypeError");
  });

  it("valt terug op 'Error' voor een niet-Error-waarde", () => {
    expect(safeMailConnectivityDetail("boem")).toBe("Error");
  });
});

describe("runMailConnectivitySelfTest", () => {
  it("meldt 'niets getest' (ok) wanneer het kanaal inactief is (noop)", async () => {
    const report = await runMailConnectivitySelfTest({ active: false, driverMode: "noop" });
    expect(report).toMatchObject({ ok: true, active: false, driverMode: "noop" });
    expect(report.detail).toContain("niets getest");
  });

  it("draait de probe niet wanneer inactief", async () => {
    let called = false;
    await runMailConnectivitySelfTest({
      active: false,
      driverMode: "noop",
      run: async () => {
        called = true;
      },
    });
    expect(called).toBe(false);
  });

  it("rapporteert pass wanneer een actief kanaal de round-trip haalt", async () => {
    const report = await runMailConnectivitySelfTest({
      active: true,
      driverMode: "resend",
      run: async () => {},
    });
    expect(report).toMatchObject({ ok: true, active: true, driverMode: "resend" });
    expect(report.detail).toContain("read-only");
  });

  it("rapporteert fail met een veilig bericht bij een MailConnectivityError", async () => {
    const report = await runMailConnectivitySelfTest({
      active: true,
      driverMode: "smtp",
      run: async () => {
        throw new MailConnectivityError("Resend: connectiviteitscontrole faalde (status 403).");
      },
    });
    expect(report.ok).toBe(false);
    expect(report.detail).toContain("status 403");
  });

  it("rapporteert fail met alleen de error-NAAM bij een onverwachte fout", async () => {
    const report = await runMailConnectivitySelfTest({
      active: true,
      driverMode: "smtp",
      run: async () => {
        const e = new Error("smtp://user:pass@host mislukte");
        e.name = "AuthError";
        throw e;
      },
    });
    expect(report.ok).toBe(false);
    expect(report.detail).toBe("AuthError");
  });

  it("telt een actief kanaal zonder probe als fout (aanroeperfout)", async () => {
    const report = await runMailConnectivitySelfTest({ active: true, driverMode: "resend" });
    expect(report.ok).toBe(false);
    expect(report.detail).toContain("Geen probe");
  });
});
