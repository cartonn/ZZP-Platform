// Veilige client-IP-bepaling voor rate-limiting en securitylogging (AVG).
//
// PROBLEEM (OWASP A07 — brute-force-/rate-limit-bypass): `X-Forwarded-For` is een door de client
// vrij te vervalsen header. De vorige implementatie nam de LINKER (eerste) entry — precies de
// waarde die de client zélf kan zetten. Een aanvaller zette per request een andere
// `X-Forwarded-For` en gaf zich zo voor elke request uit als een nieuw IP, wat élke IP-gebonden
// rate limiter omzeilt (o.a. de login-brute-force-guard, `${ip}:${email}` in src/auth.ts).
//
// OPLOSSING: een vertrouwde reverse proxy (Railway) APPENDT het echte, waargenomen client-IP RECHTS
// aan de keten. De betrouwbare waarde is dus de `hops`-de entry vanaf rechts, waarbij `hops` het
// aantal vertrouwde proxies is (`TRUSTED_PROXY_HOP_COUNT`, default 1 voor Railway). Nooit de linker
// (client-gestuurde) entry. Een client die extra linker-entries injecteert verschuift de keuze niet:
// die entries staan links van de door de proxy toegevoegde waarde en worden genegeerd.

export const DEFAULT_TRUSTED_PROXY_HOPS = 1;

/**
 * Aantal vertrouwde proxies vóór de app. Bepaalt hoeveel entries vanaf rechts in `X-Forwarded-For`
 * het echte client-IP staat (Railway: 1). Een ongeldige/ontbrekende waarde valt terug op de default.
 * Nooit < 1 — bij 0 zou de client-gestuurde linkerkant weer meetellen.
 */
export function resolveTrustedProxyHops(raw = process.env.TRUSTED_PROXY_HOP_COUNT): number {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1) return n;
  return DEFAULT_TRUSTED_PROXY_HOPS;
}

/**
 * Bepaalt het client-IP uit de forwarding-headers. Neemt de `hops`-de entry vanaf RECHTS uit
 * `X-Forwarded-For` (de door de vertrouwde proxy toegevoegde, niet-vervalsbare waarde), NOOIT de
 * linker (client-gestuurde) entry. Valt terug op `X-Real-IP` en dan op `null`. Pure functie:
 * los testbaar, geen request/IO.
 */
export function clientIpFrom(
  xForwardedFor: string | null | undefined,
  xRealIp: string | null | undefined,
  hops: number = resolveTrustedProxyHops(),
): string | null {
  const entries = (xForwardedFor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (entries.length > 0) {
    const safeHops = Math.max(1, hops);
    // Klem op de linkerrand: heeft de keten minder entries dan verwachte hops (bv. lokaal/dev,
    // of een direct verzoek), dan is de meest-linkse entry het best beschikbare waargenomen IP.
    const idx = Math.max(0, entries.length - safeHops);
    return entries[idx] ?? null;
  }
  const real = xRealIp?.trim();
  return real && real.length > 0 ? real : null;
}

/** Gemak-wrapper voor route handlers met een `Request`. Terugval-string voor de rate-limit-key. */
export function clientIpFromRequest(request: Request, fallback = "unknown"): string {
  return (
    clientIpFrom(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")) ??
    fallback
  );
}
