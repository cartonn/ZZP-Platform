// Gestructureerde, PII-veilige JSON-logger voor productie. Server-side, geen
// dependencies (alleen Node/console). Elke regel is één JSON-object zodat log-
// aggregators (Railway, Datadog) per veld kunnen filteren. PII en secret-achtige
// velden worden vóór het schrijven geredacteerd (zie `redact`), zodat een ongeluk
// in een call-site nooit een wachtwoord, token of e-mailadres naar de log lekt.

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

// Niveau-ordening: een log onder de drempel doet niets.
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL: LogLevel = "info";

// Sleutels waarvan de waarde altijd wordt vervangen door "[redacted]". Match is
// case-insensitive op substring; "auth" matcht daardoor ook "authorization".
// `phone`/`telefoon` staan hier als substring zodat samengestelde sleutels
// (contactPhone, telefoonnummer) óók geraakt worden. E-mail wordt NIET via de sleutel
// geredacteerd maar via het waarde-patroon (maskEmails) gemaskeerd — zo blijft het
// domein leesbaar voor debugging terwijl het lokale deel verdwijnt.
const REDACT_KEY_SUBSTRINGS = [
  "password",
  "secret",
  "token",
  "authorization",
  "auth",
  "cookie",
  "apikey",
  "api_key",
  "dsn",
  "iban",
  "bsn",
  "ssn",
  "creditcard",
  "cvv",
  "phone",
  "telefoon",
] as const;

// Sleutels die als PII gelden maar via een SUBSTRING te veel valse treffers geven
// ("name" zou anders ook filename/username/hostname/eventName redacten). Deze worden
// case-insensitive op EXACTE gelijkheid getoetst, zodat alleen de PII-dragende sleutel
// zelf ("name", "naam", "adres", …) wordt geredacteerd en debug-sleutels intact blijven.
// LET OP: compound naamsleutels moeten hier EXPLICIET staan (exacte match, geen substring). Voeg elke
// nieuwe PII-naamkolom/-veld toe; de test `logger.pii-name-coverage.test.ts` dwingt af dat elk
// Prisma-schemaveld op `Name`/`Naam` óf hier staat óf bewust als niet-PII is uitgezonderd, zodat een
// toekomstig naamveld de CI breekt i.p.v. stil door de logger/Sentry-scrub te lekken (AVG art. 5(1)(f)).
const REDACT_KEY_EXACT = new Set([
  "name",
  "naam",
  "voornaam",
  "achternaam",
  "volledigenaam",
  "fullname",
  "displayname",
  "contactname",
  "contactnaam",
  // Compound PII-naamvelden die dit platform daadwerkelijk gebruikt in de identiteits-/diploma-/
  // BIG-verificatieflows (result- en inputvelden + DB-kolommen). Exacte match: raakt geen
  // niet-PII-sleutels als filename/skillName.
  "verifiedname",
  "verifiedlegalname",
  "accountname",
  "providedname",
  "holdername",
  "organizationname",
  "adres",
  "address",
  "woonadres",
]);

// Eenvoudig e-mailpatroon. Global zodat álle voorkomens in een string worden gemaskeerd.
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Maximale recursiediepte tegen oneindige recursie/cycles. Voorbij deze diepte
// wordt de waarde vervangen door "[depth-limited]".
const MAX_DEPTH = 5;

const REDACTED = "[redacted]";
const DEPTH_LIMITED = "[depth-limited]";

/** Leest de actieve drempel per call uit env. Onbekend/ontbrekend → default "info". */
function thresholdLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return DEFAULT_LEVEL;
}

/**
 * True als een key gevoelig is: óf exact een PII-sleutel (name/naam/adres/…), óf een
 * substring-match op een secret-/contact-achtige naam. Beide case-insensitive.
 */
function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (REDACT_KEY_EXACT.has(lower)) return true;
  return REDACT_KEY_SUBSTRINGS.some((needle) => lower.includes(needle));
}

/** Maskeert het lokale deel van elk e-mailadres in een string: "jan@firma.nl" → "j***@firma.nl".
 *  Geëxporteerd zodat een caller die een string in een PERSISTENTE sink (DB-veld) schrijft — buiten de
 *  logger om — dezelfde e-mailmaskering kan toepassen (bv. `OrphanedStorageObject.lastError`). */
export function maskEmails(value: string): string {
  return value.replace(EMAIL_PATTERN, (match) => {
    const at = match.indexOf("@");
    const local = match.slice(0, at);
    const domain = match.slice(at);
    const first = local.length > 0 ? local[0] : "";
    return `${first}***${domain}`;
  });
}

/** True voor een plain object (niet null, geen array, geen class-instance/Date). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Recursieve redactie van één waarde, met diepte-cap. */
function redactValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return DEPTH_LIMITED;

  if (typeof value === "string") return maskEmails(value);

  // Date → veilige ISO-string; andere niet-plain objecten laten we als-is.
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redactValue(val, depth + 1);
    }
    return out;
  }

  // Primitieven (number, boolean, null, undefined) en niet-plain objecten: ongewijzigd.
  return value;
}

/** Redacteert PII/secret-achtige velden recursief. Puur — muteert de input niet. */
export function redact(fields: LogFields): LogFields {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactValue(val, 1);
  }
  return out;
}

/** Schrijft één gestructureerde JSON-regel naar de juiste console-stream, als level >= drempel. */
export function log(level: LogLevel, message: string, fields?: LogFields): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[thresholdLevel()]) return;

  const time = new Date().toISOString();
  // warn én error gaan naar stderr (console.error); debug/info naar stdout.
  const sink = level === "error" || level === "warn" ? console.error : console.log;

  // Ook de message zelf door de e-mailmasker halen: een call-site die per ongeluk een
  // e-mailadres in de tekst interpoleert (`Reset mislukt voor ${email}`) lekt anders PII
  // buiten het geredacteerde `fields`-object om (AVG art. 5(1)(f)).
  const safeMessage = maskEmails(message);

  let line: string;
  try {
    line = JSON.stringify({ level, msg: safeMessage, time, ...redact(fields ?? {}) });
  } catch {
    // Serialisatie faalde (bv. circulaire structuur): nooit naar de caller gooien;
    // val terug op een veilige, gegarandeerd serialiseerbare regel.
    line = JSON.stringify({ level, msg: safeMessage, time, _logError: "serialize-failed" });
  }

  sink(line);
}

export const logger = {
  debug(message: string, fields?: LogFields): void {
    log("debug", message, fields);
  },
  info(message: string, fields?: LogFields): void {
    log("info", message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    log("warn", message, fields);
  },
  error(message: string, fields?: LogFields): void {
    log("error", message, fields);
  },
};
