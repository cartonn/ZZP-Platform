// Pure, testbare helper voor `experimental.serverActions.allowedOrigins` (next.config.mjs).
//
// Waarom apart: next.config.mjs is plain-ESM die Next bij build/boot draait (geen tsconfig-alias,
// geen bundling) en kan dus niet uit `@/lib` importeren. Deze .mjs-helper is wél door vitest
// importeerbaar, zodat de parse-/normalisatielogica met unit-tests gedekt is i.p.v. ongetest in de
// config te leven — hetzelfde patroon als scripts/shutdown-config.mjs.
//
// Achtergrond: Next.js 15 vergelijkt bij ELKE Server Action de `Origin`-header met de (X-Forwarded-)
// Host als CSRF-mitigatie. Achter een reverse proxy (Railway) of bij een eigen domein kan die
// vergelijking mismatchen — dan faalt élke mutatie (documentupload, cascade, alle server actions)
// met een 403 "Invalid Server Actions request". `allowedOrigins` is puur ADDITIEF: het verzwakt de
// default same-origin-check niet, het staat expliciet extra vertrouwde hosts toe. Bron van de host:
// de al-geconfigureerde `AUTH_URL`/`NEXTAUTH_URL` (zelfde bron van waarheid als public-url.ts), plus
// een optionele `SERVER_ACTIONS_ALLOWED_ORIGINS` (komma-gescheiden) voor multi-domein (apex + www,
// of een migratie tussen het Railway-domein en een eigen domein). Leeg → `[]` → default gedrag
// ongewijzigd (inert, CLAUDE.md §8: een ontbrekende go-live-config breekt de boot nooit).

/**
 * Normaliseer één opgegeven origin-waarde naar een kale host (`host` of `host:port`, geen scheme/pad).
 * Accepteert zowel een volledige URL (`https://app.example.com/x`) als een kale host
 * (`app.example.com`, `*.example.com`). Een lege of onparseerbare waarde levert `null`.
 *
 * Next.js' `allowedOrigins` verwacht host-patronen zonder scheme; een meegegeven scheme/pad wordt
 * daarom afgepeld. Wildcard-hosts (`*.example.com`) blijven intact (Next ondersteunt die).
 *
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function normalizeOrigin(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  // Volledige URL met scheme → pak de host (incl. poort).
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    try {
      const host = new URL(trimmed).host;
      return host ? host.toLowerCase() : null;
    } catch {
      return null;
    }
  }
  // Kale host (evt. met poort/pad/wildcard): strip een eventueel pad en lowercase de host.
  const withoutPath = trimmed.split("/")[0];
  return withoutPath ? withoutPath.toLowerCase() : null;
}

/**
 * Bepaalt de lijst vertrouwde host-origins waarvandaan Server Actions mogen worden aangeroepen.
 * Combineert `AUTH_URL`/`NEXTAUTH_URL` (canonieke publieke origin) met de expliciete, komma-
 * gescheiden `SERVER_ACTIONS_ALLOWED_ORIGINS`. Genormaliseerd naar kale hosts, ontdubbeld en
 * gesorteerd (deterministisch). Leeg wanneer niets is geconfigureerd — dan blijft Next's default
 * same-origin-gedrag ongewijzigd.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {string[]}
 */
export function resolveAllowedOrigins(env = process.env) {
  const hosts = new Set();
  const add = (value) => {
    const host = normalizeOrigin(value);
    if (host) hosts.add(host);
  };

  add(env.AUTH_URL);
  add(env.NEXTAUTH_URL);
  for (const part of (env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",")) {
    add(part);
  }

  return [...hosts].sort();
}
