// Versleuteling-at-rest voor het TOTP-geheim. Het geheim is bewijs-genoeg-om-in-te-loggen (de tweede
// factor), dus het mag — anders dan een bcrypt-wachtwoordhash — niet in platte tekst in de database
// staan: een read-only DB-lek zou anders élk 2FA-geheim prijsgeven. We versleutelen met AES-256-GCM
// (authenticated encryption: detecteert manipulatie) onder een sleutel afgeleid van een env-secret.
//
// Sleutel: `TWOFA_ENC_KEY` als die gezet is, anders valt hij terug op `AUTH_SECRET` (zelfde patroon
// als SHARE_TOKEN_SECRET). De env-validatie waarschuwt in productie zolang de eigen sleutel ontbreekt.
// De sleutel wordt bij elke call uit het proces-env gelezen (niet op module-load) zodat tests hem
// kunnen zetten en een rotatie zonder herstart-race werkt.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";
const IV_BYTES = 12; // 96-bit nonce — de aanbevolen lengte voor GCM.

/** Leidt een 32-byte AES-256-sleutel af uit het env-secret (sha256 → vaste lengte, ongeacht invoer). */
function deriveKey(): Buffer {
  const secret = process.env.TWOFA_ENC_KEY || process.env.AUTH_SECRET;
  if (!secret) {
    // Boot-validatie eist AUTH_SECRET al af; deze guard beschermt tegen een aanroep in een
    // omgeving zonder enige sleutel (bv. een verkeerd opgezette test) i.p.v. stil een lege sleutel.
    throw new Error("Geen TWOFA_ENC_KEY of AUTH_SECRET beschikbaar voor 2FA-geheimversleuteling.");
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Versleutel een base32-TOTP-geheim naar een opslagbare string:
 * `v1.<iv-b64>.<tag-b64>.<ciphertext-b64>`. Elke call gebruikt een verse willekeurige IV.
 */
export function encryptTwoFactorSecret(plaintextBase32: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextBase32, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

/**
 * Ontsleutel een eerder met {@link encryptTwoFactorSecret} opgeslagen waarde. Werpt bij een onbekend
 * formaat/versie of bij een authenticatie-mismatch (GCM-tag) — nooit stil een verkeerd geheim.
 */
export function decryptTwoFactorSecret(stored: string): string {
  const [version, ivB64, tagB64, ciphertextB64] = stored.split(".");
  if (version !== VERSION || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Onherkenbaar 2FA-geheimformaat.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
