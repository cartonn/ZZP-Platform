// Trusted public-origin resolver (server-side truth — CLAUDE.md regel 1).
//
// Uitgaande links die per e-mail/redirect het platform verlaten (wachtwoord-reset-links,
// welkomst-inloglinks, betaal-return-/webhook-URLs) mogen NOOIT uit de door de client
// beïnvloedbare `Host`/`X-Forwarded-Host`-header worden gebouwd. Anders kan een aanvaller met
// een vervalste host een reset aanvragen voor een slachtoffer en de reset-mail een geldig token
// naar het aanvallerdomein laten wijzen (host-header/reset-poisoning, CWE-640, OWASP A01/A07).
//
// Vandaar: de geconfigureerde `AUTH_URL`/`NEXTAUTH_URL` is de bron van waarheid. Alleen als die
// (lokaal/dev) ontbreekt, valt de resolver terug op de request-headers. De middleware
// (`getPublicOrigin`) hanteert exact deze volgorde; dit is de gedeelde variant voor server actions.

/**
 * Bepaalt de vertrouwde publieke origin (zonder trailing slash). Puur/testbaar: de geconfigureerde
 * waarde en de header-waarden komen als argument binnen.
 *
 * @param headerHost   `x-forwarded-host` ?? `host` uit de request (of null).
 * @param headerProto  `x-forwarded-proto` uit de request (of null).
 * @param configured   Standaard `AUTH_URL` ?? `NEXTAUTH_URL`. Als gezet: headers worden GENEGEERD.
 */
export function resolvePublicOrigin(
  headerHost: string | null | undefined,
  headerProto: string | null | undefined,
  configured: string | undefined = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
): string {
  const trimmed = configured?.trim();
  if (trimmed) return trimmed.replace(/\/+$/, "");
  const host = headerHost?.trim() || "localhost:3000";
  const proto = headerProto?.trim() || "http";
  return `${proto}://${host}`;
}

/**
 * Async-gemak: leest `next/headers` en past {@link resolvePublicOrigin} toe. Gebruik dit in server
 * actions/route handlers die een absolute, naar-buiten-gaande URL nodig hebben.
 */
export async function publicOrigin(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return resolvePublicOrigin(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto"),
  );
}
