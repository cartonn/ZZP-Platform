import { afterEach, describe, expect, it } from "vitest";
import webpush from "web-push";
import { probeWebPushVapid } from "@/lib/push/web-push";

// De probe leest de VAPID-sleutels uit process.env; elke test zet ze en ruimt ze daarna op.
const KEYS = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"] as const;

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  setEnv({});
});

describe("probeWebPushVapid", () => {
  it("bevestigt subject, signering én keypair voor een echt gegenereerd VAPID-paar", () => {
    const pair = webpush.generateVAPIDKeys();
    setEnv({ VAPID_PUBLIC_KEY: pair.publicKey, VAPID_PRIVATE_KEY: pair.privateKey });

    const result = probeWebPushVapid();

    expect(result.subjectValid).toBe(true);
    expect(result.signed).toBe(true);
    expect(result.keypairMatches).toBe(true);
  });

  it("accepteert een geldig mailto:-subject", () => {
    const pair = webpush.generateVAPIDKeys();
    setEnv({
      VAPID_PUBLIC_KEY: pair.publicKey,
      VAPID_PRIVATE_KEY: pair.privateKey,
      VAPID_SUBJECT: "mailto:support@voorbeeld.nl",
    });

    expect(probeWebPushVapid().subjectValid).toBe(true);
  });

  it("markeert een ongeldig VAPID_SUBJECT (geen mailto:/https:)", () => {
    const pair = webpush.generateVAPIDKeys();
    setEnv({
      VAPID_PUBLIC_KEY: pair.publicKey,
      VAPID_PRIVATE_KEY: pair.privateKey,
      VAPID_SUBJECT: "support-zonder-schema",
    });

    expect(probeWebPushVapid().subjectValid).toBe(false);
  });

  it("detecteert een keypair-mismatch (public en private uit verschillende paren)", () => {
    const a = webpush.generateVAPIDKeys();
    const b = webpush.generateVAPIDKeys();
    setEnv({ VAPID_PUBLIC_KEY: a.publicKey, VAPID_PRIVATE_KEY: b.privateKey });

    const result = probeWebPushVapid();

    // De sleutels zijn elk welgevormd (signering lukt), maar horen niet bij elkaar.
    expect(result.keypairMatches).toBe(false);
  });

  it("degradeert veilig (geen throw) bij misvormde sleutels", () => {
    setEnv({ VAPID_PUBLIC_KEY: "geen-geldige-sleutel", VAPID_PRIVATE_KEY: "ook-niet" });

    const result = probeWebPushVapid();

    expect(result.signed).toBe(false);
    expect(result.keypairMatches).toBe(false);
  });

  it("degradeert veilig bij ontbrekende sleutels", () => {
    setEnv({});

    const result = probeWebPushVapid();

    expect(result.signed).toBe(false);
    expect(result.keypairMatches).toBe(false);
  });
});
