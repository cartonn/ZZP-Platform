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
 * Is dit host-patroon zó breed dat het de CSRF-origin-check feitelijk uitschakelt? `allowedOrigins`
 * is bedoeld als een korte lijst concrete, vertrouwde hosts (evt. één begrensde `*.<domein>.<tld>`-
 * wildcard). Een kale `*` of een wildcard op een heel TLD (`*.com`, `*.local`) laat Next élke
 * cross-origin Server Action door — dat verzet de anti-CSRF-poort voor de héle app (documentupload,
 * cascade, alle mutaties). Zulke waarden mogen nooit stil vertrouwd worden. OWASP A01 (Broken Access
 * Control / CSRF); spiegelt CLAUDE.md §8: een gevaarlijke config faalt zichtbaar i.p.v. stil-gevaarlijk.
 *
 * Bewust conservatief: we eisen minstens twee labels ná de `*.` (dus `*.example.com` mag, `*.com`
 * niet). Publieke suffixen met twee labels (`*.co.uk`) laten we passeren — die volledig afvangen
 * vergt de Public Suffix List; de catastrofale gevallen (kale `*`, heel-TLD) zijn hiermee gedekt.
 *
 * @param {string | null | undefined} host  al genormaliseerd (zie normalizeOrigin)
 * @returns {boolean}
 */
export function isOverbroadOriginPattern(host) {
  if (!host) return false;
  const hostOnly = host.split(":")[0]; // poort telt niet mee voor de patroonbreedte
  if (hostOnly === "*") return true; // kale catch-all: vertrouwt élke origin
  if (!hostOnly.includes("*")) return false; // concrete host: prima
  if (!hostOnly.startsWith("*.")) return true; // wildcard alleen geldig als leidend `*.`-label
  const rest = hostOnly.slice(2);
  if (rest.includes("*")) return true; // meer dan één wildcard-label
  const labels = rest.split(".").filter(Boolean);
  return labels.length < 2; // `*.com` / `*.local` / `*.` → te breed
}

/**
 * Bepaalt de lijst vertrouwde host-origins waarvandaan Server Actions mogen worden aangeroepen.
 * Combineert `AUTH_URL`/`NEXTAUTH_URL` (canonieke publieke origin) met de expliciete, komma-
 * gescheiden `SERVER_ACTIONS_ALLOWED_ORIGINS`. Genormaliseerd naar kale hosts, ontdubbeld en
 * gesorteerd (deterministisch). Leeg wanneer niets is geconfigureerd — dan blijft Next's default
 * same-origin-gedrag ongewijzigd.
 *
 * Te brede patronen (kale `*`, heel-TLD-wildcard) worden fail-closed geweigerd én zichtbaar gelogd:
 * een misconfig schakelt zo niet stil de anti-CSRF-poort uit, maar breekt ook de boot niet (§8).
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {string[]}
 */
export function resolveAllowedOrigins(env = process.env) {
  const hosts = new Set();
  const add = (value) => {
    const host = normalizeOrigin(value);
    if (!host) return;
    if (isOverbroadOriginPattern(host)) {
      // eslint-disable-next-line no-console -- config draait vóór de logger bestaat (next.config.mjs)
      console.warn(
        `[server-actions] origin-patroon "${host}" genegeerd: te breed — dit zou de CSRF-origin-` +
          `check voor álle Server Actions uitschakelen. Gebruik een concrete host of ` +
          `"*.<jouwdomein>.<tld>".`,
      );
      return;
    }
    hosts.add(host);
  };

  add(env.AUTH_URL);
  add(env.NEXTAUTH_URL);
  for (const part of (env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",")) {
    add(part);
  }

  return [...hosts].sort();
}
