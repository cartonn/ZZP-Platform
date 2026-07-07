import { describe, expect, it } from "vitest";
import {
  isMockVerificationAllowed,
  mockVerificationBlocked,
  MOCK_VERIFICATION_BLOCKED_MESSAGE,
} from "@/lib/services/verification-policy";

describe("isMockVerificationAllowed", () => {
  it("staat mock toe buiten productie (dev/test/e2e)", () => {
    expect(isMockVerificationAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isMockVerificationAllowed({ NODE_ENV: "test" })).toBe(true);
    expect(isMockVerificationAllowed({})).toBe(true); // NODE_ENV ongezet
  });

  it("BLOKKEERT mock in productie zonder demo-dataset of opt-in (fail-closed default)", () => {
    expect(isMockVerificationAllowed({ NODE_ENV: "production" })).toBe(false);
  });

  it("staat mock toe in productie mét expliciete demo-dataset (SEED_DEMO=true)", () => {
    expect(isMockVerificationAllowed({ NODE_ENV: "production", SEED_DEMO: "true" })).toBe(true);
  });

  it("staat mock toe in productie mét expliciete opt-in (ALLOW_MOCK_VERIFICATION=true)", () => {
    expect(
      isMockVerificationAllowed({ NODE_ENV: "production", ALLOW_MOCK_VERIFICATION: "true" }),
    ).toBe(true);
  });

  it("een niet-'true' opt-in-waarde telt niet als opt-in", () => {
    expect(
      isMockVerificationAllowed({ NODE_ENV: "production", ALLOW_MOCK_VERIFICATION: "1" }),
    ).toBe(false);
    expect(isMockVerificationAllowed({ NODE_ENV: "production", SEED_DEMO: "1" })).toBe(false);
  });
});

describe("mockVerificationBlocked", () => {
  const prod = { NODE_ENV: "production" };

  it("blokkeert een MOCK-resultaat op echte productie-data", () => {
    expect(mockVerificationBlocked("MOCK", prod)).toBe(true);
  });

  it("blokkeert een echt registerresultaat NOOIT (DUO/BIG/IDIN passeren altijd)", () => {
    expect(mockVerificationBlocked("DUO", prod)).toBe(false);
    expect(mockVerificationBlocked("BIG", prod)).toBe(false);
    expect(mockVerificationBlocked("IDIN", prod)).toBe(false);
  });

  it("blokkeert een MOCK-resultaat niet buiten productie / met demo / met opt-in", () => {
    expect(mockVerificationBlocked("MOCK", { NODE_ENV: "development" })).toBe(false);
    expect(mockVerificationBlocked("MOCK", { NODE_ENV: "production", SEED_DEMO: "true" })).toBe(
      false,
    );
    expect(
      mockVerificationBlocked("MOCK", { NODE_ENV: "production", ALLOW_MOCK_VERIFICATION: "true" }),
    ).toBe(false);
  });

  it("de weigerboodschap lekt geen interne details", () => {
    expect(MOCK_VERIFICATION_BLOCKED_MESSAGE).not.toMatch(/mock|MOCK|env|process|production/);
  });
});
