import { describe, expect, it } from "vitest";
import { createECDH } from "node:crypto";
import { validateVapid } from "@/lib/push/vapid-validate";

/** Genereert een geldig P-256 VAPID-sleutelpaar (base64url), met een 32-byte private scalar. */
function generatePair(): { publicKey: string; privateKey: string } {
  for (;;) {
    const ecdh = createECDH("prime256v1");
    ecdh.generateKeys();
    const priv = ecdh.getPrivateKey();
    // Zeldzaam kan de scalar leidende nul-bytes hebben (< 32 bytes); dan opnieuw voor een schone test.
    if (priv.length !== 32) continue;
    return {
      publicKey: ecdh.getPublicKey().toString("base64url"),
      privateKey: priv.toString("base64url"),
    };
  }
}

describe("validateVapid", () => {
  it("beide sleutels afwezig → off", () => {
    expect(validateVapid(undefined, undefined, undefined)).toEqual({
      outcome: "off",
      configState: "off",
    });
    expect(validateVapid("", "  ", undefined).outcome).toBe("off");
  });

  it("precies één sleutel → partial", () => {
    const { publicKey, privateKey } = generatePair();
    expect(validateVapid(publicKey, undefined, undefined).outcome).toBe("partial");
    expect(validateVapid(undefined, privateKey, undefined).outcome).toBe("partial");
  });

  it("een geldig, bij elkaar horend paar → valid", () => {
    const { publicKey, privateKey } = generatePair();
    const result = validateVapid(publicKey, privateKey, "mailto:support@zzp-platform.nl");
    expect(result).toEqual({ outcome: "valid", configState: "configured" });
  });

  it("een leeg/ongezet subject is geldig (runtime valt terug op een default)", () => {
    const { publicKey, privateKey } = generatePair();
    expect(validateVapid(publicKey, privateKey, undefined).outcome).toBe("valid");
    expect(validateVapid(publicKey, privateKey, "  ").outcome).toBe("valid");
  });

  it("een https:-subject is geldig", () => {
    const { publicKey, privateKey } = generatePair();
    expect(validateVapid(publicKey, privateKey, "https://zzp-platform.nl/contact").outcome).toBe(
      "valid",
    );
  });

  it("mismatched paar (publieke uit paar A, private uit paar B) → mismatched", () => {
    const a = generatePair();
    const b = generatePair();
    const result = validateVapid(a.publicKey, b.privateKey, "mailto:support@zzp-platform.nl");
    expect(result.outcome).toBe("mismatched");
    expect(result.configState).toBe("configured");
  });

  it("publieke sleutel met verkeerd formaat → invalid-public", () => {
    const { privateKey } = generatePair();
    // Te kort / geen 65-byte ongecomprimeerd punt.
    expect(validateVapid("bogus-public", privateKey, undefined).outcome).toBe("invalid-public");
  });

  it("publieke sleutel van 65 bytes zonder 0x04-prefix → invalid-public", () => {
    const { privateKey } = generatePair();
    const wrongPrefix = Buffer.alloc(65, 1).toString("base64url"); // 65 bytes, prefix 0x01
    expect(validateVapid(wrongPrefix, privateKey, undefined).outcome).toBe("invalid-public");
  });

  it("private sleutel leeg na decode → invalid-private", () => {
    const { publicKey } = generatePair();
    // "=" decodeert base64url naar 0 bytes.
    expect(validateVapid(publicKey, "=", undefined).outcome).toBe("invalid-private");
  });

  it("ongeldig subject bij een geldig paar → invalid-subject", () => {
    const { publicKey, privateKey } = generatePair();
    expect(validateVapid(publicKey, privateKey, "ftp://nope").outcome).toBe("invalid-subject");
    expect(validateVapid(publicKey, privateKey, "support@zzp-platform.nl").outcome).toBe(
      "invalid-subject",
    );
  });

  it("controleert het paar vóór het subject niet — sleutel-formaat gaat voor", () => {
    // Een kapotte publieke sleutel meldt invalid-public, ook met een ongeldig subject.
    expect(validateVapid("bogus", "bogus", "ftp://nope").outcome).toBe("invalid-public");
  });

  it("geeft nooit een (deel van een) sleutel terug", () => {
    const { publicKey, privateKey } = generatePair();
    const result = validateVapid(publicKey, privateKey, "mailto:x@y.nl");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(publicKey);
    expect(serialized).not.toContain(privateKey);
  });
});
