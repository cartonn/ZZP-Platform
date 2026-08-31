import { describe, expect, it } from "vitest";
import {
  TOTP_DIGITS,
  generateTotp,
  generateTotpSecret,
  otpauthUri,
  verifyTotp,
  verifyTotpStep,
} from "./totp";
import { base32Encode } from "./base32";

// RFC 6238 Appendix B testvector: seed "12345678901234567890" (ASCII) in base32, SHA1, 8 digits.
// Wij gebruiken 6 digits — de laatste 6 cijfers van de gepubliceerde 8-cijferige waarde.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

describe("verifyTotp / generateTotp", () => {
  it("reproduceert de RFC 6238-testvector (T=59 → 94287082 → laatste 6)", () => {
    const at = new Date(59 * 1000);
    expect(generateTotp(RFC_SECRET, { now: at })).toBe("287082");
    expect(verifyTotp(RFC_SECRET, "287082", { now: at, window: 0 })).toBe(true);
  });

  it("reproduceert een tweede RFC-vector (T=1111111109 → 07081804 → laatste 6)", () => {
    const at = new Date(1111111109 * 1000);
    expect(generateTotp(RFC_SECRET, { now: at })).toBe("081804");
  });

  it("accepteert een code binnen het ±1-venster (klokafwijking)", () => {
    const now = new Date(1_700_000_000 * 1000);
    const prev = new Date(now.getTime() - 30_000);
    const prevCode = generateTotp(RFC_SECRET, { now: prev });
    expect(verifyTotp(RFC_SECRET, prevCode, { now, window: 1 })).toBe(true);
  });

  it("weigert een code buiten het venster", () => {
    const now = new Date(1_700_000_000 * 1000);
    const old = new Date(now.getTime() - 5 * 60_000);
    const oldCode = generateTotp(RFC_SECRET, { now: old });
    expect(verifyTotp(RFC_SECRET, oldCode, { now, window: 1 })).toBe(false);
  });

  it("weigert een verkeerde code en niet-6-cijferige invoer", () => {
    const now = new Date(1_700_000_000 * 1000);
    expect(verifyTotp(RFC_SECRET, "000000", { now })).toBe(false);
    expect(verifyTotp(RFC_SECRET, "12345", { now })).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", { now })).toBe(false);
    expect(verifyTotp(RFC_SECRET, "", { now })).toBe(false);
  });

  it("negeert spaties in de ingevoerde code", () => {
    const now = new Date(59 * 1000);
    expect(verifyTotp(RFC_SECRET, "287 082", { now, window: 0 })).toBe(true);
  });
});

// verifyTotpStep geeft de exact gematchte tijdteller (step) terug — de bouwsteen voor replay-preventie
// in de login-poort (RFC 6238 §5.2): die onthoudt de hoogst-verbruikte step en weigert hergebruik.
describe("verifyTotpStep", () => {
  it("geeft de step van het huidige venster terug bij een geldige code", () => {
    const now = new Date(1_700_000_000 * 1000);
    const expectedStep = Math.floor(now.getTime() / 1000 / 30);
    const code = generateTotp(RFC_SECRET, { now });
    expect(verifyTotpStep(RFC_SECRET, code, { now, window: 0 })).toBe(expectedStep);
  });

  it("geeft de step van het vórige venster terug (klokafwijking binnen ±1)", () => {
    const now = new Date(1_700_000_000 * 1000);
    const prev = new Date(now.getTime() - 30_000);
    const prevStep = Math.floor(prev.getTime() / 1000 / 30);
    const prevCode = generateTotp(RFC_SECRET, { now: prev });
    expect(verifyTotpStep(RFC_SECRET, prevCode, { now, window: 1 })).toBe(prevStep);
  });

  it("geeft null terug bij een foute of niet-6-cijferige code", () => {
    const now = new Date(1_700_000_000 * 1000);
    expect(verifyTotpStep(RFC_SECRET, "000000", { now })).toBeNull();
    expect(verifyTotpStep(RFC_SECRET, "12345", { now })).toBeNull();
    expect(verifyTotpStep(RFC_SECRET, "", { now })).toBeNull();
  });

  it("verifyTotp blijft de boolean-variant (true wanneer een step matcht)", () => {
    const now = new Date(59 * 1000);
    expect(verifyTotp(RFC_SECRET, "287082", { now, window: 0 })).toBe(true);
    expect(verifyTotpStep(RFC_SECRET, "287082", { now, window: 0 })).not.toBeNull();
  });
});

describe("generateTotpSecret", () => {
  it("levert een base32-geheim en verse geheimen verschillen", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).toMatch(/^[A-Z2-7]+$/);
    expect(a).not.toBe(b);
  });

  it("een verse code op een vers geheim heeft de juiste lengte en verifieert", () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(code).toHaveLength(TOTP_DIGITS);
    expect(verifyTotp(secret, code)).toBe(true);
  });
});

describe("otpauthUri", () => {
  it("bevat geheim, issuer en de vaste TOTP-parameters", () => {
    const uri = otpauthUri({ secret: "ABCD", accountName: "jan@bedrijf.nl", issuer: "Handslag" });
    expect(uri).toContain("otpauth://totp/Handslag%3Ajan%40bedrijf.nl");
    expect(uri).toContain("secret=ABCD");
    expect(uri).toContain("issuer=Handslag");
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
