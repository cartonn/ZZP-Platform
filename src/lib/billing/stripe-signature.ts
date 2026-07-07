// Stripe-webhookhandtekening verifiëren zonder de Stripe-SDK. Stripe ondertekent elke webhook met
// een HMAC-SHA256 over `${timestamp}.${rawBody}` en zet dat in de `Stripe-Signature`-header als
// `t=<unix>,v1=<hex>` (mogelijk meerdere v1-handtekeningen bij een sleutelrotatie). We verifiëren
// timing-safe én controleren de timestamp-tolerantie tegen replay. Puur en deterministisch (klok
// injecteerbaar via `now`), zodat het volledig getest kan worden.

import { createHmac, timingSafeEqual } from "node:crypto";

export interface StripeSignatureOptions {
  /** Maximale leeftijd (seconden) van de webhook-timestamp tegen replay. Default 300 (Stripe-advies). */
  toleranceSeconds?: number;
  /** Huidige tijd in ms (injecteerbaar voor tests). Default Date.now(). */
  now?: number;
}

/** Parset een `Stripe-Signature`-header naar de timestamp en de v1-handtekening(en). */
export function parseStripeSignatureHeader(
  header: string | null,
): { timestamp: number; signatures: string[] } | null {
  if (!header) return null;
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "t") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }
  if (timestamp === null || signatures.length === 0) return null;
  return { timestamp, signatures };
}

/**
 * Verifieert of `raw` (de exacte, ongeparste request-body) hoort bij een geldige Stripe-handtekening
 * onder `secret` (het webhook-signing-secret, `whsec_...`). Geeft `false` bij een ontbrekende/ongeldige
 * header, een verlopen timestamp of een niet-kloppende handtekening — nooit een exception.
 */
export function verifyStripeSignature(
  raw: string,
  signatureHeader: string | null,
  secret: string,
  opts: StripeSignatureOptions = {},
): boolean {
  if (!secret) return false;
  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const toleranceSeconds = opts.toleranceSeconds ?? 300;
  const nowSeconds = Math.floor((opts.now ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${parsed.timestamp}.${raw}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");

  return parsed.signatures.some((candidate) => {
    const candidateBuf = Buffer.from(candidate, "utf8");
    return candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf);
  });
}
