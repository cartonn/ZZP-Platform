import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptTwoFactorSecret, encryptTwoFactorSecret } from "./secret-crypto";

describe("secret-crypto (AES-256-GCM)", () => {
  const prevKey = process.env.TWOFA_ENC_KEY;
  const prevAuth = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.TWOFA_ENC_KEY = "test-2fa-enc-key-abcdefghijklmnop";
    delete process.env.AUTH_SECRET;
  });
  afterEach(() => {
    if (prevKey === undefined) delete process.env.TWOFA_ENC_KEY;
    else process.env.TWOFA_ENC_KEY = prevKey;
    if (prevAuth === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = prevAuth;
  });

  it("round-trip: ontsleutelt terug naar het oorspronkelijke geheim", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    expect(decryptTwoFactorSecret(encryptTwoFactorSecret(secret))).toBe(secret);
  });

  it("gebruikt een verse IV: dezelfde invoer levert verschillende ciphertext", () => {
    const a = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP");
    const b = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP");
    expect(a).not.toBe(b);
    expect(decryptTwoFactorSecret(a)).toBe(decryptTwoFactorSecret(b));
  });

  it("de opgeslagen waarde bevat het geheim niet in platte tekst", () => {
    const stored = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP");
    expect(stored.startsWith("v1.")).toBe(true);
    expect(stored).not.toContain("JBSWY3DPEHPK3PXP");
  });

  it("werpt bij een gemanipuleerde ciphertext (GCM-authenticatie)", () => {
    const stored = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP");
    const parts = stored.split(".");
    const tampered = Buffer.from(parts[3]!, "base64");
    tampered[0] = tampered[0]! ^ 0xff;
    parts[3] = tampered.toString("base64");
    expect(() => decryptTwoFactorSecret(parts.join("."))).toThrow();
  });

  it("werpt bij een onbekend formaat/versie", () => {
    expect(() => decryptTwoFactorSecret("v2.a.b.c")).toThrow();
    expect(() => decryptTwoFactorSecret("kapot")).toThrow();
  });

  it("valt terug op AUTH_SECRET als TWOFA_ENC_KEY ontbreekt", () => {
    delete process.env.TWOFA_ENC_KEY;
    process.env.AUTH_SECRET = "fallback-auth-secret-1234567890ab";
    const stored = encryptTwoFactorSecret("JBSWY3DPEHPK3PXP");
    expect(decryptTwoFactorSecret(stored)).toBe("JBSWY3DPEHPK3PXP");
  });
});
