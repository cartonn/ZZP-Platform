import { describe, expect, it } from "vitest";
import {
  RECOVERY_CODE_COUNT,
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  normalizeRecoveryCode,
  verifyRecoveryCode,
} from "./recovery-codes";

describe("recovery-codes", () => {
  it("genereert het gevraagde aantal unieke, correct geformatteerde codes", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    for (const code of codes) {
      expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){3}$/);
      // Verwarring-arm alfabet: geen 0/O/1/I/L.
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("normaliseert spaties, koppeltekens en kleine letters", () => {
    expect(normalizeRecoveryCode("7f3k-9qrw 2xmh5dpt")).toBe("7F3K9QRW2XMH5DPT");
  });

  it("hash + verify slaagt op de juiste code (ook door de mens gevarieerd getypt)", async () => {
    const [code] = generateRecoveryCodes(1);
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code, hash)).toBe(true);
    expect(await verifyRecoveryCode(code.toLowerCase().replace(/-/g, " "), hash)).toBe(true);
  });

  it("verify faalt op een verkeerde code", async () => {
    const hash = await hashRecoveryCode("ABCD-EFGH-JKMN-PQRS");
    expect(await verifyRecoveryCode("ABCD-EFGH-JKMN-PQRT", hash)).toBe(false);
  });

  it("de hash bevat de code niet in platte tekst", async () => {
    const code = "ABCD-EFGH-JKMN-PQRS";
    const hash = await hashRecoveryCode(code);
    expect(hash).not.toContain(normalizeRecoveryCode(code));
  });

  it("onderscheidt een 6-cijferige TOTP van een herstelcode", () => {
    expect(looksLikeRecoveryCode("123456")).toBe(false);
    expect(looksLikeRecoveryCode("12 34 56")).toBe(false);
    expect(looksLikeRecoveryCode("ABCD-EFGH-JKMN-PQRS")).toBe(true);
  });
});
