// Tijdelijke wachtwoorden voor admin-aangemaakte accounts (bulk-onboarding). Cryptografisch
// willekeurig, leesbaar (geen verwarrende tekens), met gegarandeerd elke tekensoort. De admin
// deelt het tijdelijke wachtwoord veilig met de gebruiker; e-mail-uitnodiging is productievervolg.

import { randomInt } from "node:crypto";

// Geen 0/O/1/l/I om overtypen te voorkomen.
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(alphabet: string): string {
  return alphabet.charAt(randomInt(alphabet.length));
}

/**
 * Genereert een sterk tijdelijk wachtwoord van `length` tekens (min. 12), met ten minste één
 * kleine letter, hoofdletter, cijfer en symbool. De posities worden willekeurig geschud.
 */
export function generateTempPassword(length = 14): string {
  const len = Math.max(12, length);
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  for (let i = chars.length; i < len; i++) chars.push(pick(ALL));
  // Fisher-Yates shuffle met crypto-randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }
  return chars.join("");
}
