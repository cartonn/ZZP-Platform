// TOTP (RFC 6238) op basis van HMAC-SHA1 — het profiel dat elke gangbare authenticator-app
// (Google Authenticator, 1Password, Aegis, Authy) standaard aanneemt: 6 cijfers, tijdstap van 30 s.
// Puur op Node's `crypto`, geen externe dependency. Server-side waarheid: de verificatie draait
// uitsluitend op de server (`authorizeCredentials`), nooit client-side.

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { base32Decode, base32Encode } from "./base32";

export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_ALGORITHM = "SHA1";
// Aantal willekeurige bytes in een nieuw geheim (160 bit — RFC 4226 §4 aanbeveling voor HMAC-SHA1).
export const TOTP_SECRET_BYTES = 20;

/** Genereer een nieuw, willekeurig TOTP-geheim als base32-string (voor een QR/otpauth-URI). */
export function generateTotpSecret(bytes: number = TOTP_SECRET_BYTES): string {
  return base32Encode(randomBytes(bytes));
}

/** Bereken de tijdteller (aantal volledige perioden sinds epoch) voor een gegeven moment. */
function counterForTime(now: Date): number {
  return Math.floor(now.getTime() / 1000 / TOTP_PERIOD_SECONDS);
}

/** Zet een teller (64-bit big-endian) om naar een 8-byte buffer, zoals HOTP/TOTP vereist. */
function counterToBuffer(counter: number): Buffer {
  const buf = Buffer.alloc(8);
  // JS-bitwise werkt op 32 bit; splits in hoog/laag woord zodat tellers > 2^32 correct blijven.
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  return buf;
}

/** Genereer de HOTP/TOTP-code voor een specifieke teller (intern; getest via generateTotp). */
function hotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const hmac = createHmac("sha1", key).update(counterToBuffer(counter)).digest();
  // Dynamic truncation (RFC 4226 §5.3): laatste nibble bepaalt de offset. `readUInt8`/`readUInt32BE`
  // lezen typeveilig (nooit `undefined`) en de offset (0–15) + 4 bytes valt altijd binnen de 20-byte
  // SHA1-digest. De hoogste bit wordt gemaskeerd zodat het resultaat een niet-negatief 31-bits getal is.
  const offset = hmac.readUInt8(hmac.length - 1) & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  const code = binary % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, "0");
}

/** Genereer de TOTP-code voor een moment (default: nu). Vooral voor tests/enrollment-preview. */
export function generateTotp(secretBase32: string, opts: { now?: Date } = {}): string {
  return hotp(secretBase32, counterForTime(opts.now ?? new Date()));
}

/**
 * Verifieer een ingevoerde code tegen het geheim. Accepteert een klokafwijking van ±`window`
 * perioden (default 1 → ±30 s) zodat een net-verlopen of net-vernieuwde code nog werkt. De invoer
 * moet exact `TOTP_DIGITS` cijfers zijn; vergelijking is timing-veilig.
 */
export function verifyTotp(
  secretBase32: string,
  token: string,
  opts: { now?: Date; window?: number } = {},
): boolean {
  const cleaned = token.replace(/\s/g, "");
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(cleaned)) return false;

  const window = opts.window ?? 1;
  const center = counterForTime(opts.now ?? new Date());
  const provided = Buffer.from(cleaned);

  for (let drift = -window; drift <= window; drift += 1) {
    const candidate = Buffer.from(hotp(secretBase32, center + drift));
    // Lengtes zijn altijd gelijk (beide TOTP_DIGITS), dus timingSafeEqual is veilig te gebruiken.
    if (candidate.length === provided.length && timingSafeEqual(candidate, provided)) {
      return true;
    }
  }
  return false;
}

/**
 * Bouw de otpauth://-URI die een authenticator-app inleest (handmatig of via QR). Label en issuer
 * worden ge-encodeerd; het geheim staat als base32 in de query. Bevat geen andere gebruikersdata.
 */
export function otpauthUri(params: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secret,
    issuer: params.issuer,
    algorithm: TOTP_ALGORITHM,
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
