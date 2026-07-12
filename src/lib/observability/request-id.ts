// HTTP request-correlatie-ID. Elke request krijgt één stabiele `x-request-id`: overgenomen van een
// upstream proxy/load-balancer (Railway/CDN zetten die vaak al) of anders server-side gegenereerd.
// De ID wordt op de response geëchood én in error-rapporten meegenomen, zodat een gebruiker-zichtbare
// fout te herleiden is naar de exacte server-log-/Sentry-regels van díe request.
//
// Puur en dependency-vrij (alleen Web Crypto). Geen PII: een opaque, willekeurig token.

export const REQUEST_ID_HEADER = "x-request-id";

// Ruime maar begrensde lengte: een UUID is 36 tekens; een upstream-ID (bv. AWS/GCP trace) kan langer
// zijn maar mag de logs/headers niet oprekken. Boven de limiet → afkappen na sanitatie.
export const MAX_REQUEST_ID_LENGTH = 64;

// Toegestane tekens: alfanumeriek + een paar veilige scheidingstekens. Dit weert header-/log-injectie
// (CR/LF), spaties en control-tekens uit een niet-vertrouwde upstream-waarde.
const ALLOWED_CHAR = /[A-Za-z0-9._-]/;

/**
 * Maakt een inkomende, mogelijk niet-vertrouwde request-ID veilig: houdt alleen toegestane tekens,
 * kapt af op de maxlengte en geeft `null` terug als er niets bruikbaars overblijft. Zo kan een
 * kwaadaardige of rommelige upstream-header nooit de logregel of response-header vervuilen.
 */
export function sanitizeRequestId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  let out = "";
  for (const ch of value) {
    if (ALLOWED_CHAR.test(ch)) {
      out += ch;
      if (out.length >= MAX_REQUEST_ID_LENGTH) break;
    }
  }
  return out.length > 0 ? out : null;
}

/**
 * Genereert een nieuwe, willekeurige request-ID. Gebruikt Web Crypto (`randomUUID`), beschikbaar in
 * zowel de Node- als de edge-runtime. Valt bij afwezigheid terug op een korte random-hex zodat er
 * altijd een ID is (correlatie mag nooit stukvallen op een ontbrekende crypto-API).
 */
export function generateRequestId(): string {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Laatste redmiddel: tijd-gebaseerd (uniciteit is hier niet kritiek, correlatie binnen één request
  // wél). Geen Math.random-afhankelijkheid voor de zekerheid van determinisme in tests.
  return `req-${Date.now().toString(36)}`;
}

/**
 * Bepaalt de request-ID voor een request: neemt een geldige upstream-waarde over (zodat de correlatie
 * doorloopt over proxy-hops) of genereert er een nieuwe. Geeft altijd een niet-lege string terug.
 */
export function resolveRequestId(incoming: string | null | undefined): string {
  return sanitizeRequestId(incoming) ?? generateRequestId();
}

/**
 * Korte, log-/UI-vriendelijke weergave van een request-ID (eerste segment / eerste tekens). Handig als
 * "foutreferentie" die een gebruiker kan doorgeven zonder de volledige ID te tonen.
 */
export function shortRequestId(id: string): string {
  const head = id.split("-")[0] ?? id;
  return head.slice(0, 8);
}
