// Gedeelde `fetch`-met-timeout voor uitgaande koppelingen (billing/e-mail/rate-limit).
//
// PROBLEEM: een kale `fetch` naar een externe dienst (Mollie/Stripe/Resend/Upstash) heeft geen
// deadline. Reageert de tegenpartij traag of hangt hij, dan blijft de server-request onbeperkt
// openstaan — een beschikbaarheids-/resource-exhaustion-risico onder last. De verifier-helper
// (`http-verify.ts`) loste dit al op met een AbortController; deze helper trekt dat patroon door
// naar alle andere uitgaande koppelingen, zodat het op één plek staat en injecteerbaar blijft
// voor tests (`fetchImpl`).

/** Fout bij een verlopen deadline. Gescheiden type zodat callers timeout kunnen onderscheiden. */
export class HttpTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label}: time-out na ${timeoutMs} ms.`);
    this.name = "HttpTimeoutError";
  }
}

/** Veilige ondergrens/bovengrens voor een timeout (ms). Voorkomt een 0-ms of absurd lange deadline. */
export const MIN_HTTP_TIMEOUT_MS = 1_000;
export const MAX_HTTP_TIMEOUT_MS = 60_000;
/** Standaard-deadline als een adapter niets opgeeft. */
export const DEFAULT_HTTP_TIMEOUT_MS = 10_000;

/**
 * Leest een timeout uit een env-variabele en klemt hem in het veilige bereik. Ongeldige of
 * ontbrekende waarden vallen terug op `fallback` (die zelf ook geklemd wordt).
 */
export function resolveHttpTimeoutMs(
  raw: string | undefined,
  fallback: number = DEFAULT_HTTP_TIMEOUT_MS,
): number {
  const clamp = (n: number) => Math.min(MAX_HTTP_TIMEOUT_MS, Math.max(MIN_HTTP_TIMEOUT_MS, n));
  const parsed = raw !== undefined ? Number(raw) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return clamp(Math.round(parsed));
  return clamp(Math.round(fallback));
}

export interface FetchWithTimeoutOptions {
  /** Injecteerbaar voor tests; default global fetch. */
  fetchImpl?: typeof fetch;
  /** Deadline in ms; wordt geklemd op [MIN, MAX]. Default DEFAULT_HTTP_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Naam voor de foutmelding (bv. "Mollie"). */
  label?: string;
}

/**
 * Doet een `fetch` met een harde deadline via AbortController. Bij overschrijding wordt de request
 * afgebroken en een `HttpTimeoutError` geworpen; andere netwerkfouten worden ongewijzigd
 * doorgegeven. De timer wordt altijd opgeruimd. Callers behandelen `!res.ok` zelf (zoals voorheen).
 *
 * NB: eventueel al aanwezige `init.signal` wordt vervangen door de interne timeout-signal — geen van
 * onze adapters geeft zelf een signal mee, dus dit is bewust en houdt de helper eenvoudig.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = resolveHttpTimeoutMs(
    options.timeoutMs !== undefined ? String(options.timeoutMs) : undefined,
  );
  const label = options.label ?? "HTTP";

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await doFetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (timedOut || (err instanceof Error && err.name === "AbortError")) {
      throw new HttpTimeoutError(label, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
