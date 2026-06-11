// Token zonder opslag: HMAC-SHA256 over de freelancerProfile-id met AUTH_SECRET als sleutel.
// Deterministisch: zelfde profileId + secret = zelfde token. De link werkt zolang:
//   1. het profiel PUBLIC is (server-side gecontroleerd bij weergave), en
//   2. de AUTH_SECRET ongewijzigd is.
//
// BEWUSTE BEPERKING (v1): er is geen per-token revocatie — een ZZP'er kan de link ongeldig maken
// door het profiel op PRIVATE te zetten. Echte per-token revocatie vereist een schema-uitbreiding
// (revokedTokens-tabel) en is bewust uitgesteld.

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LENGTH = 32;

/**
 * Sleutel voor deeltoken-HMAC's. Bij voorkeur een eigen SHARE_TOKEN_SECRET zodat rotatie van
 * AUTH_SECRET (sessies) niet alle gedeelde dossier-links breekt en andersom (security-review
 * H-1, 12-6-2026). Valt terug op AUTH_SECRET voor bestaande omgevingen.
 */
export function shareTokenSecret(): string {
  return process.env.SHARE_TOKEN_SECRET || process.env.AUTH_SECRET || "";
}

/**
 * Berekent het deeltoken voor een freelancerProfile-id. Het token is 32 hexadecimale tekens
 * (afgeknotte HMAC-SHA256). Deterministisch: zelfde invoer = zelfde uitvoer.
 *
 * @throws als secret leeg of ontbrekend is — een leeg secret zou een zwak maar geldig token geven.
 */
export function dossierShareToken(profileId: string, secret: string): string {
  if (!secret) throw new Error("AUTH_SECRET mag niet leeg zijn");
  const hmac = createHmac("sha256", secret);
  hmac.update(profileId);
  return hmac.digest("hex").slice(0, TOKEN_LENGTH);
}

/**
 * Timing-safe vergelijking van het verwachte token met het ontvangen token.
 * Geeft `false` als het token qua lengte verschilt (voorkomt length-oracle) of incorrect is.
 */
export function verifyDossierToken(
  profileId: string,
  receivedToken: string,
  secret: string,
): boolean {
  if (!secret) return false;
  if (receivedToken.length !== TOKEN_LENGTH) return false;
  const expected = dossierShareToken(profileId, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(receivedToken, "utf8");
  // Beide 32-char strings → gelijke byte-lengte; timingSafeEqual vereist gelijke lengte.
  return timingSafeEqual(a, b);
}
