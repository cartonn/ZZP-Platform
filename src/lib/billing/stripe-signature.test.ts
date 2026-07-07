import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { parseStripeSignatureHeader, verifyStripeSignature } from "@/lib/billing/stripe-signature";

const SECRET = "whsec_testsecret";

/** Bouwt een geldige Stripe-Signature-header voor `raw` op tijdstip `t` (seconden). */
function signHeader(raw: string, t: number, secret = SECRET): string {
  const sig = createHmac("sha256", secret).update(`${t}.${raw}`, "utf8").digest("hex");
  return `t=${t},v1=${sig}`;
}

describe("parseStripeSignatureHeader", () => {
  it("leest timestamp en v1-handtekening(en)", () => {
    const parsed = parseStripeSignatureHeader("t=100,v1=abc,v1=def");
    expect(parsed).toEqual({ timestamp: 100, signatures: ["abc", "def"] });
  });

  it("negeert onbekende schema's (v0) en whitespace", () => {
    const parsed = parseStripeSignatureHeader(" t=100 , v1=abc , v0=xyz ");
    expect(parsed).toEqual({ timestamp: 100, signatures: ["abc"] });
  });

  it("geeft null zonder timestamp of zonder v1", () => {
    expect(parseStripeSignatureHeader(null)).toBeNull();
    expect(parseStripeSignatureHeader("v1=abc")).toBeNull();
    expect(parseStripeSignatureHeader("t=100")).toBeNull();
    expect(parseStripeSignatureHeader("t=nietnum,v1=abc")).toBeNull();
  });
});

describe("verifyStripeSignature", () => {
  const raw = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const t = 1_700_000_000;
  const now = t * 1000;

  it("accepteert een geldige, verse handtekening", () => {
    expect(verifyStripeSignature(raw, signHeader(raw, t), SECRET, { now })).toBe(true);
  });

  it("weigert een verkeerd secret", () => {
    expect(verifyStripeSignature(raw, signHeader(raw, t, "whsec_ander"), SECRET, { now })).toBe(
      false,
    );
  });

  it("weigert een gewijzigde body (handtekening past niet meer)", () => {
    const header = signHeader(raw, t);
    expect(verifyStripeSignature(raw + "x", header, SECRET, { now })).toBe(false);
  });

  it("weigert een verlopen timestamp (replay buiten tolerantie)", () => {
    const header = signHeader(raw, t);
    expect(verifyStripeSignature(raw, header, SECRET, { now: now + 600_000 })).toBe(false);
  });

  it("accepteert binnen de tolerantie", () => {
    const header = signHeader(raw, t);
    expect(verifyStripeSignature(raw, header, SECRET, { now: now + 200_000 })).toBe(true);
  });

  it("weigert een ontbrekende header of leeg secret", () => {
    expect(verifyStripeSignature(raw, null, SECRET, { now })).toBe(false);
    expect(verifyStripeSignature(raw, signHeader(raw, t), "", { now })).toBe(false);
  });
});
