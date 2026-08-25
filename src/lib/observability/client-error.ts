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

import { scrubSecretPathSegments, stripUrlQueries } from "@/lib/observability/url-scrub";

// De URL-/pad-scrubbing woont in url-scrub.ts (gedeeld met de Sentry-event-scrubber). Re-export
// zodat bestaande importeurs `scrubSecretPathSegments` via dit pad kunnen blijven gebruiken.
export { scrubSecretPathSegments };

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
    // Strip URL-query's/fragmenten óók uit de message: een browser-foutbericht kan een volledige URL
    // met een token echoën (bv. een gefaalde fetch die de request-URL teruggeeft). Zonder deze scrub
    // bereikt dat token de logger (alleen e-mail-gemaskeerd) én Sentry als exception-`value` (buiten
    // de breadcrumb-scrub om). Zelfde behandeling als stack/componentStack. AVG art. 5(1)(f).
    message: message ? truncate(stripUrlQueries(message), MAX_MESSAGE_LEN) : "(geen bericht)",
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
