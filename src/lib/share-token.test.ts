import { describe, expect, it } from "vitest";
import { dossierShareToken, verifyDossierToken } from "./share-token";

const PROFILE_ID = "profile-abc-123";
const SECRET = "testsecret-super-lang-genoeg-voor-hmac";

describe("dossierShareToken", () => {
  it("is deterministisch: zelfde invoer geeft zelfde token", () => {
    const t1 = dossierShareToken(PROFILE_ID, SECRET);
    const t2 = dossierShareToken(PROFILE_ID, SECRET);
    expect(t1).toBe(t2);
  });

  it("geeft een 32-karakter hexstring", () => {
    const token = dossierShareToken(PROFILE_ID, SECRET);
    expect(token).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(token)).toBe(true);
  });

  it("geeft een ander token voor een ander profileId", () => {
    const t1 = dossierShareToken(PROFILE_ID, SECRET);
    const t2 = dossierShareToken("other-profile-456", SECRET);
    expect(t1).not.toBe(t2);
  });

  it("geeft een ander token voor een ander secret", () => {
    const t1 = dossierShareToken(PROFILE_ID, SECRET);
    const t2 = dossierShareToken(PROFILE_ID, "other-secret");
    expect(t1).not.toBe(t2);
  });

  it("werpt bij een leeg secret", () => {
    expect(() => dossierShareToken(PROFILE_ID, "")).toThrow("AUTH_SECRET mag niet leeg zijn");
  });
});

describe("verifyDossierToken", () => {
  it("goed token slaagt", () => {
    const token = dossierShareToken(PROFILE_ID, SECRET);
    expect(verifyDossierToken(PROFILE_ID, token, SECRET)).toBe(true);
  });

  it("verkeerd token faalt", () => {
    const token = dossierShareToken(PROFILE_ID, SECRET);
    const wrong = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyDossierToken(PROFILE_ID, wrong, SECRET)).toBe(false);
  });

  it("ander profileId faalt", () => {
    const token = dossierShareToken(PROFILE_ID, SECRET);
    expect(verifyDossierToken("other-profile-456", token, SECRET)).toBe(false);
  });

  it("leeg secret retourneert false (gooit niet)", () => {
    const token = dossierShareToken(PROFILE_ID, SECRET);
    expect(verifyDossierToken(PROFILE_ID, token, "")).toBe(false);
  });

  it("token van verkeerde lengte faalt direct", () => {
    expect(verifyDossierToken(PROFILE_ID, "te-kort", SECRET)).toBe(false);
    expect(verifyDossierToken(PROFILE_ID, "a".repeat(64), SECRET)).toBe(false);
  });
});
