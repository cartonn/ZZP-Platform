// Parser/normalisator voor client-side foutrapporten (pure, testbaar). De browser POST't een
// gevangen React-/runtime-fout naar /api/client-error; hier reduceren we die payload tot een
// veilige, PII-arme vorm vóór het loggen/rapporteren.
//
// PRIVACY (AVG): een fout uit de browser kan PII lekken — de pagina-URL kan een deel-token in de
// query dragen, een stacktrace kan URL's met query-strings bevatten, een message kan gebruikers-
// invoer bevatten. We normaliseren daarom AGRESSIEF: de pagina-URL → alleen het pad (geen query/
// fragment), álle query-strings uit URL's in de stack/componentStack worden gestript, en alle
// vrije tekst wordt hard afgekapt. De logger maskeert daarbovenop nog e-mails. Puur: geen I/O,
// muteert de input niet.

/** Genormaliseerde, PII-arme weergave van één client-fout — veilig om te loggen/rapporteren. */
export interface NormalizedClientError {
  /** Fout-naam (bv. "TypeError"). Afgekapt; leeg → "Error". */
  name: string;
  /** Foutbericht, afgekapt op MAX_MESSAGE_LEN. */
  message: string;
  /** Stacktrace zonder query-strings, afgekapt op MAX_STACK_LEN. Null als afwezig. */
  stack: string | null;
  /** React component-stack (welke component crashte), afgekapt. Null als afwezig. */
  componentStack: string | null;
  /** Pad van de pagina waar de fout optrad (zonder query/fragment). Null als afwezig. */
  path: string | null;
  /** Next.js-foutdigest (koppelt client- aan server-fout), afgekapt. Null als afwezig. */
  digest: string | null;
}

/** Harde plafonds: nooit meer dan dit verwerken/loggen per veld. */
export const MAX_MESSAGE_LEN = 500;
export const MAX_STACK_LEN = 4000;
export const MAX_COMPONENT_STACK_LEN = 2000;
export const MAX_NAME_LEN = 100;
export const MAX_DIGEST_LEN = 100;

// Routes die een GEHEIM in het PAD dragen (niet in de query). De waarde per prefix is het aantal
// pad-segmenten ná de prefix dat je mag behouden; alles daarna wordt geredigeerd. Zonder deze scrub
// zou een render-crash op zo'n pagina het token via `location.href` naar de logs/Sentry lekken —
// account-overname (reset-token) of gevoelige-documenten-lek (deel-token). logger.redact scrubt op
// sleutelnaam, niet op een hex-token binnen een pad-waarde, dus we moeten het hier hard weghalen.
// LET OP: voeg elke nieuwe token-in-pad-route hier toe.
const SECRET_PATH_KEEP_AFTER_PREFIX: Record<string, number> = {
  "wachtwoord-herstellen": 0, // /wachtwoord-herstellen/<reset-token>  → token weg
  vertrouwen: 1, // /vertrouwen/<profileId>/<deel-token> → profileId blijft, token weg
};

const REDACTED_SEGMENT = "[redacted]";

/**
 * Redigeert geheime pad-segmenten van bekende token-in-pad-routes (zie SECRET_PATH_KEEP_AFTER_PREFIX).
 * Puur: laat een pad zonder geheim segment ongewijzigd.
 */
export function scrubSecretPathSegments(path: string): string {
  // "/a/b" → ["", "a", "b"]; segments[1] is het eerste pad-segment.
  const segments = path.split("/");
  const first = segments[1];
  if (!first || !(first in SECRET_PATH_KEEP_AFTER_PREFIX)) return path;
  // Redact vanaf (prefix-positie 1) + (te behouden segmenten) + 1.
  const redactStart = SECRET_PATH_KEEP_AFTER_PREFIX[first]! + 2;
  for (let i = redactStart; i < segments.length; i += 1) {
    if (segments[i]) segments[i] = REDACTED_SEGMENT;
  }
  return segments.join("/");
}

/** Reduceert één http(s)-URL tot origin+pad zonder query/fragment én met geredigeerde geheime segmenten. */
function sanitizeUrl(url: string): string {
  const cut = url.search(/[?#]/);
  const base = cut === -1 ? url : url.slice(0, cut);
  try {
    const parsed = new URL(base);
    return `${parsed.origin}${scrubSecretPathSegments(parsed.pathname)}`;
  } catch {
    return base;
  }
}

/** Sanitize elke http(s)-URL in een vrije-tekst-string: query/fragment weg + geheime segmenten weg. */
function stripUrlQueries(text: string): string {
  // Match een http(s)-URL tot de eerste whitespace/haakje/aanhaling.
  return text.replace(/https?:\/\/[^\s)'"]+/g, (url) => sanitizeUrl(url));
}

/** Kap een string af op `max` tekens met een ellipsis-marker. */
function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** Leest een string-veld veilig uit; leeg/niet-string → null. */
function readString(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Reduceert een pagina-URL tot alleen het pad (dropt host/query/fragment → geen tokens/PII) en
 * redigeert geheime pad-segmenten (reset-/deel-tokens) zodat die nooit in de log/Sentry belanden.
 */
export function toPagePath(raw: unknown): string | null {
  const value = readString(raw);
  if (!value) return null;
  let path: string | null;
  try {
    path = new URL(value).pathname || "/";
  } catch {
    // Relatief pad of onparseerbaar: strip zelf fragment + query.
    const withoutHash = value.split("#", 1)[0] ?? "";
    path = withoutHash.split("?", 1)[0] || null;
  }
  return path ? scrubSecretPathSegments(path) : null;
}

/**
 * Normaliseert een reeds-gedeserialiseerde payload (JSON-waarde) naar een veilige client-fout.
 * Vereist minstens een `message` óf een `name` om betekenisvol te zijn; anders → null.
 */
export function parseClientError(payload: unknown): NormalizedClientError | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const body = payload as Record<string, unknown>;

  const name = readString(body.name);
  const message = readString(body.message);
  const stack = readString(body.stack);
  const componentStack = readString(body.componentStack);

  // Zonder een naam én een bericht valt er niets zinnigs te rapporteren.
  if (!name && !message) return null;

  return {
    name: name ? truncate(name, MAX_NAME_LEN) : "Error",
    message: message ? truncate(message, MAX_MESSAGE_LEN) : "(geen bericht)",
    stack: stack ? truncate(stripUrlQueries(stack), MAX_STACK_LEN) : null,
    componentStack: componentStack
      ? truncate(stripUrlQueries(componentStack), MAX_COMPONENT_STACK_LEN)
      : null,
    path: toPagePath(body.url),
    digest: readString(body.digest)
      ? truncate(readString(body.digest) as string, MAX_DIGEST_LEN)
      : null,
  };
}

/**
 * Bouwt een echte Error uit een genormaliseerde client-fout, zodat de externe reporter (Sentry)
 * een volwaardige exception met de client-stacktrace ontvangt i.p.v. een kaal object.
 */
export function toReportableError(normalized: NormalizedClientError): Error {
  const error = new Error(normalized.message);
  error.name = normalized.name;
  error.stack = normalized.stack ?? undefined;
  return error;
}
