// Semantische tekstgelijkenis — deterministisch, geen externe afhankelijkheden.
// Gebruikt feature hashing met FNV-1a om tekstvectoren te bouwen en
// cosinusgelijkenis te berekenen. Puur, server-side, los te testen.

/** Dimensie van de ingebedde vector. */
export const EMBEDDING_DIM = 96;

/**
 * Nederlandse stopwoorden die worden uitgefilterd bij tokenisatie.
 * Klein, maar effectief voor domeinrelevante teksten.
 */
const STOPWORDS = new Set([
  "de",
  "het",
  "een",
  "en",
  "van",
  "voor",
  "met",
  "op",
  "in",
  "te",
  "aan",
  "of",
  "dat",
  "die",
  "is",
  "naar",
  "bij",
  "als",
  "om",
  "ook",
  "je",
  "ik",
  "we",
  "ze",
  "hij",
  "zij",
  "er",
  "maar",
  "niet",
  "wel",
  "zo",
  "al",
  "nu",
  "nog",
  "dan",
  "al",
  "uit",
  "door",
  "over",
  "tot",
  "zijn",
  "was",
  "heeft",
  "had",
  "kan",
  "mag",
  "moet",
  "worden",
]);

/**
 * Tokeniseert een tekst: lowercase, diacritieken verwijderen, splitsen op
 * niet-alfanumerieke tekens, tokens korter dan 2 tekens weggooien en
 * stopwoorden filteren.
 *
 * @param text - Invoertekst (willekeurig).
 * @returns Lijst van genormaliseerde tokens.
 */
export function tokenize(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  // NFD-normalisatie: basisletters en combinerende markeringen splitsen.
  // Daarna combinerende Unicode-markeringen verwijderen (diacritieken).
  const normalized = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Splitsen op alles wat geen letter of cijfer is.
  const parts = normalized.split(/[^a-z0-9]+/);

  return parts.filter((token) => {
    if (token.length < 2) return false;
    if (STOPWORDS.has(token)) return false;
    return true;
  });
}

/**
 * FNV-1a hash (32-bit) van een string.
 * Deterministisch en snel; wordt gebruikt voor feature hashing.
 *
 * @param str - Invoerstring.
 * @returns 32-bit unsigned integer hash.
 */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Vermenigvuldig met FNV prime (32-bit) — gebruik imul voor overflow-veiligheid.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Unsigned 32-bit
}

/**
 * Tweede hash voor tekenbepaling (signed hashing).
 * Gebruikt een gemengde variant om onafhankelijkheid van fnv1a32 te vergroten.
 *
 * @param str - Invoerstring.
 * @returns +1 of -1.
 */
function signHash(str: string): number {
  // Tweede hash door het token met een prefix te hashen.
  const h = fnv1a32("sign:" + str);
  return (h & 1) === 0 ? 1 : -1;
}

/**
 * Berekent een genormaliseerde feature-hash-vector van lengte `dim` voor de tekst.
 * Elke token wordt via FNV-1a geplaatst in een bucket (hash % dim) met een teken
 * bepaald door een tweede hash. Na optelling wordt L2-genormaliseerd.
 *
 * @param text - Invoertekst.
 * @param dim  - Vectordimensie (standaard EMBEDDING_DIM = 96).
 * @returns Genormaliseerde vector van lengte `dim`.
 */
export function embed(text: string, dim: number = EMBEDDING_DIM): number[] {
  const vector = new Array<number>(dim).fill(0) as number[];
  const tokens = tokenize(text);

  for (const token of tokens) {
    const bucket = fnv1a32(token) % dim;
    const sign = signHash(token);
    // Gegarandeerd aanwezig: vector is aangemaakt met `fill(0)` van lengte dim.
    (vector as number[])[bucket] = ((vector as number[])[bucket] ?? 0) + sign;
  }

  // L2-normalisatie.
  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);

  if (norm === 0) {
    return vector; // Nul-vector bij lege invoer of alleen stopwoorden.
  }

  return vector.map((val) => val / norm);
}

/**
 * Berekent de cosinusgelijkenis van twee vectoren.
 * Beide vectoren worden verondersteld L2-genormaliseerd te zijn (het dot-product
 * is dan direct de cosinus). Het resultaat wordt geklemd op [0, 1].
 *
 * @param a - Eerste vector.
 * @param b - Tweede vector.
 * @returns Cosinusgelijkenis in [0, 1]; 0 bij ongelijke lengtes of nulvector.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  // Clamp naar [0, 1]: negatief dot-product → 0.
  const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, cosine));
}

/**
 * Berekent de semantische verwantschap van twee teksten als getal in [0, 1].
 * Lege invoer aan een van beide kanten geeft 0.
 *
 * @param a - Eerste tekst.
 * @param b - Tweede tekst.
 * @returns Verwantschapsscore in [0, 1].
 */
export function textRelatedness(a: string, b: string): number {
  if (!a || !a.trim() || !b || !b.trim()) {
    return 0;
  }
  return cosineSimilarity(embed(a), embed(b));
}
