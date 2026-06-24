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
] as const;

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

/** True als een key (case-insensitive) een van de gevoelige substrings bevat. */
function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEY_SUBSTRINGS.some((needle) => lower.includes(needle));
}

/** Maskeert het lokale deel van elk e-mailadres in een string: "jan@firma.nl" → "j***@firma.nl". */
function maskEmails(value: string): string {
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

  let line: string;
  try {
    line = JSON.stringify({ level, msg: message, time, ...redact(fields ?? {}) });
  } catch {
    // Serialisatie faalde (bv. circulaire structuur): nooit naar de caller gooien;
    // val terug op een veilige, gegarandeerd serialiseerbare regel.
    line = JSON.stringify({ level, msg: message, time, _logError: "serialize-failed" });
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
