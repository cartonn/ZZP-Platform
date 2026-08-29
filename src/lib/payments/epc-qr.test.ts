import { describe, it, expect } from "vitest";
import { buildEpcPayload, encodeQrMatrix, buildSepaQr } from "./epc-qr";

const VALID_IBAN = "NL91ABNA0417164300";

describe("buildEpcPayload", () => {
  it("bouwt een spec-geldige EPC069-12-payload met de juiste rubrieken op volgorde", () => {
    const payload = buildEpcPayload({
      name: "Sanne de Vries",
      iban: VALID_IBAN,
      amountCents: 123456,
      remittance: "Factuur ZZP-2026-0007",
    });
    expect(payload).not.toBeNull();
    expect(payload!.split("\n")).toEqual([
      "BCD",
      "002",
      "1",
      "SCT",
      "",
      "Sanne de Vries",
      "NL91ABNA0417164300",
      "EUR1234.56",
      "",
      "",
      "Factuur ZZP-2026-0007",
    ]);
  });

  it("formatteert het bedrag exact uit hele centen (geen float-drift)", () => {
    expect(
      buildEpcPayload({ name: "X", iban: VALID_IBAN, amountCents: 5, remittance: "r" }),
    ).toContain("\nEUR0.05\n");
    expect(
      buildEpcPayload({ name: "X", iban: VALID_IBAN, amountCents: 100, remittance: "r" }),
    ).toContain("\nEUR1.00\n");
    expect(
      buildEpcPayload({ name: "X", iban: VALID_IBAN, amountCents: 999999, remittance: "r" }),
    ).toContain("\nEUR9999.99\n");
  });

  it("normaliseert de IBAN (spaties weg, hoofdletters) in de payload", () => {
    const payload = buildEpcPayload({
      name: "X",
      iban: "nl91 abna 0417 1643 00",
      amountCents: 1000,
      remittance: "r",
    });
    expect(payload).toContain("\nNL91ABNA0417164300\n");
  });

  it("weigert een ongeldige IBAN", () => {
    expect(
      buildEpcPayload({
        name: "X",
        iban: "NL00BANK0000000000",
        amountCents: 1000,
        remittance: "r",
      }),
    ).toBeNull();
    expect(buildEpcPayload({ name: "X", iban: "", amountCents: 1000, remittance: "r" })).toBeNull();
  });

  it("weigert een leeg/whitespace-only naamveld", () => {
    expect(
      buildEpcPayload({ name: "   ", iban: VALID_IBAN, amountCents: 1000, remittance: "r" }),
    ).toBeNull();
  });

  it("weigert een bedrag buiten bereik of niet-geheel", () => {
    for (const amountCents of [0, -100, 1.5, 100_000_000_000]) {
      expect(
        buildEpcPayload({ name: "X", iban: VALID_IBAN, amountCents, remittance: "r" }),
      ).toBeNull();
    }
  });

  it("kapt de naam op 70 en het betaalkenmerk op 140 tekens", () => {
    const payload = buildEpcPayload({
      name: "N".repeat(120),
      iban: VALID_IBAN,
      amountCents: 1000,
      remittance: "R".repeat(200),
    });
    const lines = payload!.split("\n");
    expect(lines[5]).toBe("N".repeat(70));
    expect(lines[10]).toBe("R".repeat(140));
  });

  it("neutraliseert regeleindes/control-tekens zodat de EPC-regelstructuur niet kan breken", () => {
    const payload = buildEpcPayload({
      name: "Kwaad\nBCD\nSCT",
      iban: VALID_IBAN,
      amountCents: 1000,
      remittance: "ref\r\nEUR9999.99",
    });
    // Exact 11 regels — injectie voegt geen regels toe.
    expect(payload!.split("\n")).toHaveLength(11);
    expect(payload!.split("\n")[5]).toBe("Kwaad BCD SCT");
    expect(payload!.split("\n")[10]).toBe("ref EUR9999.99");
  });
});

describe("encodeQrMatrix", () => {
  it("levert een deterministische, vierkante byte-modus-matrix met een gevuld pad", () => {
    const payload = buildEpcPayload({
      name: "Sanne de Vries",
      iban: VALID_IBAN,
      amountCents: 123456,
      remittance: "Factuur ZZP-2026-0007",
    })!;
    const a = encodeQrMatrix(payload);
    const b = encodeQrMatrix(payload);
    expect(a.size).toBeGreaterThanOrEqual(21);
    expect(a.size % 2).toBe(1); // QR-matrices zijn altijd oneven van maat
    expect(a.darkPath.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });
});

describe("buildSepaQr", () => {
  it("bouwt een QR bij geldige invoer en null bij een ongeldige IBAN", () => {
    const qr = buildSepaQr({
      name: "Sanne de Vries",
      iban: VALID_IBAN,
      amountCents: 123456,
      remittance: "Factuur ZZP-2026-0007",
    });
    expect(qr).not.toBeNull();
    expect(qr!.size).toBeGreaterThanOrEqual(21);
    expect(qr!.darkPath).toContain("h1v1h-1z");
    expect(
      buildSepaQr({ name: "X", iban: "ongeldig", amountCents: 1000, remittance: "r" }),
    ).toBeNull();
  });
});
