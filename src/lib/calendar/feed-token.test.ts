import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { agendaFeedToken, verifyAgendaFeedToken, agendaFeedPath } from "./feed-token";
import { dossierShareToken } from "@/lib/share-token";

const USER_ID = "user-abc-123";
const SECRET = "testsecret-super-lang-genoeg-voor-hmac";

describe("agendaFeedToken", () => {
  it("is deterministisch: zelfde invoer geeft zelfde token", () => {
    expect(agendaFeedToken(USER_ID, SECRET)).toBe(agendaFeedToken(USER_ID, SECRET));
  });

  it("geeft een 32-karakter hexstring", () => {
    const token = agendaFeedToken(USER_ID, SECRET);
    expect(token).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(token)).toBe(true);
  });

  it("geeft een ander token voor een andere gebruiker", () => {
    expect(agendaFeedToken(USER_ID, SECRET)).not.toBe(agendaFeedToken("user-other-456", SECRET));
  });

  it("geeft een ander token voor een ander secret", () => {
    expect(agendaFeedToken(USER_ID, SECRET)).not.toBe(agendaFeedToken(USER_ID, "ander-secret"));
  });

  it("is namespace-gescheiden van het dossier-deeltoken", () => {
    // Zelfde id + secret, ander doel → mag nooit hetzelfde token zijn (geen cross-use).
    expect(agendaFeedToken(USER_ID, SECRET)).not.toBe(dossierShareToken(USER_ID, SECRET));
  });

  it("werpt bij een leeg secret", () => {
    expect(() => agendaFeedToken(USER_ID, "")).toThrow();
  });
});

describe("verifyAgendaFeedToken", () => {
  it("een geldig token slaagt", () => {
    const token = agendaFeedToken(USER_ID, SECRET);
    expect(verifyAgendaFeedToken(USER_ID, token, SECRET)).toBe(true);
  });

  it("een token van een andere gebruiker faalt", () => {
    const token = agendaFeedToken("user-other-456", SECRET);
    expect(verifyAgendaFeedToken(USER_ID, token, SECRET)).toBe(false);
  });

  it("een dossier-deeltoken faalt als agenda-token (namespace-scheiding)", () => {
    const dossier = dossierShareToken(USER_ID, SECRET);
    expect(verifyAgendaFeedToken(USER_ID, dossier, SECRET)).toBe(false);
  });

  it("faalt bij verkeerd secret", () => {
    const token = agendaFeedToken(USER_ID, SECRET);
    expect(verifyAgendaFeedToken(USER_ID, token, "ander-secret")).toBe(false);
  });

  it("faalt bij leeg/ontbrekend token of secret", () => {
    const token = agendaFeedToken(USER_ID, SECRET);
    expect(verifyAgendaFeedToken(USER_ID, "", SECRET)).toBe(false);
    expect(verifyAgendaFeedToken(USER_ID, token, "")).toBe(false);
  });

  it("faalt bij een token met afwijkende lengte (geen length-oracle)", () => {
    expect(verifyAgendaFeedToken(USER_ID, "te-kort", SECRET)).toBe(false);
    expect(verifyAgendaFeedToken(USER_ID, "a".repeat(64), SECRET)).toBe(false);
  });
});

describe("agendaFeedPath", () => {
  const prevShare = process.env.SHARE_TOKEN_SECRET;
  const prevAuth = process.env.AUTH_SECRET;

  beforeAll(() => {
    process.env.SHARE_TOKEN_SECRET = SECRET;
  });
  afterAll(() => {
    if (prevShare === undefined) delete process.env.SHARE_TOKEN_SECRET;
    else process.env.SHARE_TOKEN_SECRET = prevShare;
    if (prevAuth === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = prevAuth;
  });

  it("bevat een punt (feed.ics) zodat de middleware het pad publiek laat", () => {
    const path = agendaFeedPath(USER_ID);
    expect(path).not.toBeNull();
    expect(path).toContain("feed.ics");
  });

  it("bevat de gebruiker en een geldig, verifieerbaar token", () => {
    const path = agendaFeedPath(USER_ID)!;
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("u")).toBe(USER_ID);
    const token = params.get("t")!;
    expect(verifyAgendaFeedToken(USER_ID, token, SECRET)).toBe(true);
  });

  it("geeft null zonder geconfigureerd secret (feed uitgeschakeld)", () => {
    delete process.env.SHARE_TOKEN_SECRET;
    delete process.env.AUTH_SECRET;
    expect(agendaFeedPath(USER_ID)).toBeNull();
  });
});
