// Herstelcodes: eenmalige back-upcodes voor het geval een gebruiker zijn authenticator-app kwijt is.
// Er worden er standaard 10 gegenereerd; alleen de bcrypt-hash gaat de database in (nooit de code
// zelf). Format: vier groepen van vier tekens uit een verwarring-arm alfabet (geen 0/O/1/I/L),
// hoofdletters, met koppeltekens voor leesbaarheid — bv. `7F3K-9QRW-2XMH-5DPT`.

import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export const RECOVERY_CODE_COUNT = 10;
const GROUPS = 4;
const GROUP_LEN = 4;
// Crockford-achtig alfabet zonder visueel dubbelzinnige tekens.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Genereer één willekeurige, geformatteerde herstelcode. */
function generateOne(): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g += 1) {
    let group = "";
    for (let i = 0; i < GROUP_LEN; i += 1) {
      group += ALPHABET[randomInt(ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/** Genereer een verse set herstelcodes (platte tekst — toon één keer, sla alleen de hash op). */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) codes.push(generateOne());
  return codes;
}

/**
 * Normaliseer invoer voor opslag/vergelijking: verwijder spaties/koppeltekens en zet om naar
 * hoofdletters, zodat `7f3k 9qrw...` en `7F3K-9QRW-...` identiek matchen.
 */
export function normalizeRecoveryCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/** Hash een (genormaliseerde) herstelcode voor opslag. */
export function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(normalizeRecoveryCode(code), 10);
}

/** Vergelijk een ingevoerde code met een opgeslagen hash (timing-veilig via bcrypt). */
export function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalizeRecoveryCode(code), hash);
}

/** Heuristiek: is deze invoer géén 6-cijferige TOTP-code (en dus mogelijk een herstelcode)? */
export function looksLikeRecoveryCode(input: string): boolean {
  return !/^\d{6}$/.test(input.replace(/\s/g, ""));
}
