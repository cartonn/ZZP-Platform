// Gedeelde, pure URL-/pad-scrubbing (geen I/O, muteert niets). Eén bron van waarheid voor het
// weghalen van geheimen/PII uit URL's vóórdat ze in een log of bij een externe verwerker belanden:
//
//   1. query-string + fragment weg  (kan tokens/zoektermen/API-keys dragen — bv. Geoapify zet zijn
//      `apiKey` in de query-string van elke geocode/route-call),
//   2. geheime PAD-segmenten weg    (reset-/deel-tokens zitten in het pad, niet in de query, dus een
//      sleutel-gebaseerde redactie mist ze — zie SECRET_PATH_KEEP_AFTER_PREFIX).
//
// Wordt gebruikt door zowel de client-fout-normalisator (client-error.ts) als de Sentry-event-scrubber
// (sentry-options.ts, óók op de auto-breadcrumbs die volledige URL's dragen). Los van beide zodat er
// geen server→client-error-koppeling ontstaat en de logica op één plek getest is.

// Routes die een GEHEIM in het PAD dragen (niet in de query). De waarde per prefix is het aantal
// pad-segmenten ná de prefix dat je mag behouden; alles daarna wordt geredigeerd. Zonder deze scrub
// zou een URL naar zo'n pagina het token via een breadcrumb/stacktrace naar de logs/Sentry lekken —
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
export function sanitizeUrl(url: string): string {
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
export function stripUrlQueries(text: string): string {
  // Match een http(s)-URL tot de eerste whitespace/haakje/aanhaling.
  return text.replace(/https?:\/\/[^\s)'"]+/g, (url) => sanitizeUrl(url));
}
