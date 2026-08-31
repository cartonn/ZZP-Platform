// Content-Security-Policy-opbouw (missie A — productie zonder 'unsafe-inline' voor scripts).
// Pure functies; de middleware genereert per request een nonce en zet de policy op zowel de
// request (zodat Next zijn eigen framework-scripts de nonce geeft) als de response.
//
// Productie: script-src met nonce + 'strict-dynamic'. De fallbacks 'unsafe-inline' en https:
// staan er bewust bij voor verouderde browsers — moderne browsers negeren ze zodra een nonce
// aanwezig is (CSP3), oude browsers zonder nonce-ondersteuning vallen erop terug.
// Development: géén nonce in de policy — react-refresh/HMR injecteert inline scripts zonder
// nonce, en een policy mét nonce laat browsers 'unsafe-inline' juist negeren. Dev blijft dus
// op de oude permissieve policy (incl. 'unsafe-eval' en ws: voor HMR).

/** Genereert een base64-nonce van 128 bits; werkt in Edge- én Node-runtime (Web Crypto). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Endpoint dat violatie-rapporten ontvangt (zie src/app/api/csp-report/route.ts). */
export const CSP_REPORT_PATH = "/api/csp-report";
/** Naam van de Reporting-API-endpointgroep (moet matchen met de Reporting-Endpoints-header). */
export const CSP_REPORT_GROUP = "csp-endpoint";

/** Bouwt de volledige CSP-headerwaarde. `nonce` wordt alleen in productie toegepast. */
export function buildCsp(opts: { nonce: string; isDev: boolean }): string {
  const scriptSrc = opts.isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${opts.nonce}' 'strict-dynamic' 'unsafe-inline' https:`;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // Styles houden 'unsafe-inline': Next/styled-jsx injecteert stylesheets zonder nonce en
    // style-injectie is geen scriptuitvoering; gedocumenteerde, gangbare afweging.
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    `connect-src 'self'${opts.isDev ? " ws:" : ""}`,
    "worker-src 'self'", // service worker (PWA)
    "manifest-src 'self'",
    "form-action 'self'",
    // Violatie-rapportage: `report-to` (modern, gekoppeld aan de Reporting-Endpoints-header in de
    // middleware) met `report-uri` als fallback voor browsers die report-to nog niet ondersteunen.
    // Beide wijzen naar hetzelfde eigen endpoint. Zo zien we in productie wat de policy blokkeert —
    // nodig om de 'unsafe-inline'-fallback later veilig te laten vallen én om injectie te detecteren.
    `report-to ${CSP_REPORT_GROUP}`,
    `report-uri ${CSP_REPORT_PATH}`,
    // Belt-and-suspenders bij HSTS (Strict-Transport-Security, preload): upgrade een eventueel
    // per ongeluk absoluut-http subresource stil naar https i.p.v. een mixed-content-blok. Alleen
    // in productie — development draait over http en zou anders lokale assets/HMR breken.
    ...(opts.isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Waarde voor de `Reporting-Endpoints`-responseheader (moderne Reporting API). Koppelt de
 * groepsnaam uit de `report-to`-directive aan de ontvanger-URL. Puur/testbaar.
 */
export function reportingEndpointsHeader(): string {
  return `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;
}
