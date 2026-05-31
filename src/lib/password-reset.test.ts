import { describe, expect, it } from "vitest";
import { hashResetToken, isResetTokenValid } from "@/lib/password-reset";

describe("hashResetToken", () => {
  it("geeft een consistente SHA-256 hex-string terug", () => {
    const result = hashResetToken("mijntoken");
    expect(result).toHaveLength(64);
    expect(result).toBe(hashResetToken("mijntoken"));
  });

  it("geeft andere hash voor ander token", () => {
    expect(hashResetToken("abc")).not.toBe(hashResetToken("xyz"));
  });
});

describe("isResetTokenValid", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  const now = new Date();

  it("geldig token: ongebruikt en nog niet verlopen", () => {
    expect(isResetTokenValid({ usedAt: null, expiresAt: future }, now)).toBe(true);
  });

  it("ongeldig: al gebruikt", () => {
    expect(isResetTokenValid({ usedAt: new Date(), expiresAt: future }, now)).toBe(false);
  });

  it("ongeldig: verlopen", () => {
    expect(isResetTokenValid({ usedAt: null, expiresAt: past }, now)).toBe(false);
  });

  it("ongeldig: verlopen én gebruikt", () => {
    expect(isResetTokenValid({ usedAt: new Date(), expiresAt: past }, now)).toBe(false);
  });

  it("grenswaarde: precies op expiry is ongeldig (expiresAt <= now)", () => {
    expect(isResetTokenValid({ usedAt: null, expiresAt: now }, now)).toBe(false);
  });
});
