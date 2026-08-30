// RFC 4648 base32 (het alfabet dat authenticator-apps — Google Authenticator, 1Password, Aegis —
// verwachten voor het TOTP-geheim in een otpauth://-URI). Bewust geen externe dependency: puur en
// deterministisch te testen. Encode zonder padding, uppercase; decode is tolerant voor spaties,
// kleine letters en '='-padding maar weigert elk teken buiten het alfabet (geen stille corruptie).

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Omgekeerde lookup: teken → 5-bits waarde. Onbekende tekens blijven undefined → afgewezen.
const CHAR_TO_VALUE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i += 1) CHAR_TO_VALUE[ALPHABET.charAt(i)] = i;

/** Codeer bytes naar een base32-string (RFC 4648, hoofdletters, zonder padding). */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET.charAt((value >>> (bits - 5)) & 31);
      bits -= 5;
    }
  }

  // Resterende bits (< 5) links uitgevuld tot één laatste teken.
  if (bits > 0) {
    output += ALPHABET.charAt((value << (5 - bits)) & 31);
  }

  return output;
}

/**
 * Decodeer een base32-string naar bytes. Tolerant: spaties en '='-padding worden genegeerd en de
 * invoer wordt naar hoofdletters genormaliseerd. Werpt bij een teken buiten het alfabet zodat een
 * corrupt geheim nooit stil tot verkeerde bytes leidt.
 */
export function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const char of cleaned) {
    const v = CHAR_TO_VALUE[char];
    if (v === undefined) {
      throw new Error("Ongeldig base32-teken.");
    }
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(out);
}
