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
  ].join("; ");
}
