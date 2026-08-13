// Gedeelde HTTP-helper voor de echte verificatiekoppelingen (DUO/BIG/iDIN). Houdt de
// driver-implementaties dun: één plek voor auth, timeout, retry, JSON-contract en foutafhandeling.
// `fetchImpl` is injecteerbaar zodat dit zonder netwerk testbaar is.
//
// HARDENING (2026-08-13): dit zijn de meest gevoelige uitgaande calls (officiële registers DUO/BIG/
// iDIN), maar als enige uitgaande integratie hadden ze géén env-configureerbare time-out en géén
// retry op een transiënte storing — terwijl billing/e-mail/rate-limit dat via `fetch-timeout.ts` wél
// hebben. Een enkele 5xx/429/netwerk-blip liet de diploma-/zorg-/identiteitscontrole van een
// gebruiker dan onnodig falen. Omdat een verificatie een READ-ONLY lookup is (geen zij-effect bij
// het endpoint), is een begrensde retry-met-backoff idempotent-veilig. De time-out komt nu uit de
// gedeelde `fetchWithTimeout` en is instelbaar via `VERIFY_HTTP_TIMEOUT_MS`; het aantal retries via
// `VERIFY_HTTP_RETRIES`. Alleen transiënte fouten (netwerk, time-out, 5xx, 429) worden herhaald;
// een 4xx (verkeerde auth/verzoek), een niet-JSON-antwoord of een contract-mismatch faalt meteen.

import { z } from "zod";
import {
  fetchWithTimeout,
  HttpTimeoutError,
  resolveHttpTimeoutMs,
} from "@/lib/services/fetch-timeout";

export class VerifierNotConfiguredError extends Error {
  constructor(name: string) {
    super(`${name}-koppeling is niet geconfigureerd (stel basis-URL + API-sleutel in via env).`);
    this.name = "VerifierNotConfiguredError";
  }
}

export class VerifierRequestError extends Error {
  /**
   * Transiënt = tijdelijk en veilig te herhalen (netwerkfout, time-out, 5xx, 429). Niet-transiënt
   * (verkeerde auth/verzoek 4xx, niet-JSON, contract-mismatch) heeft geen zin om te herhalen. Callers
   * die het onderscheid niet nodig hebben negeren dit veld — de foutklasse blijft ongewijzigd.
   */
  readonly transient: boolean;
  constructor(message: string, transient = false) {
    super(message);
    this.name = "VerifierRequestError";
    this.transient = transient;
  }
}

/** Het verwachte, gestandaardiseerde antwoordcontract van een verificatie-endpoint. */
export const verifyResponseSchema = z.object({
  verified: z.boolean(),
  message: z.string().optional(),
  verifiedName: z.string().nullable().optional(),
});
export type RawVerifyResponse = z.infer<typeof verifyResponseSchema>;

export interface VerifyEndpointConfig {
  /** Naam voor foutmeldingen (bv. "DUO"). */
  name: string;
  /** Basis-URL van de koppeling (env). Leeg = niet geconfigureerd. */
  baseUrl: string | undefined;
  /** API-sleutel (env). Leeg = niet geconfigureerd. */
  apiKey: string | undefined;
  /** Pad op de basis-URL, bv. "/verify". */
  path: string;
  /** Expliciete deadline in ms; overschrijft `VERIFY_HTTP_TIMEOUT_MS`. Geklemd op [1000, 60000]. */
  timeoutMs?: number;
  /** Aantal extra pogingen bij een transiënte fout; overschrijft `VERIFY_HTTP_RETRIES`. Geklemd [0, 5]. */
  retries?: number;
  /** Injecteerbaar voor tests; default global fetch. */
  fetchImpl?: typeof fetch;
  /** Injecteerbare backoff-wachtfunctie (tests → geen echte vertraging). Default `setTimeout`. */
  sleepImpl?: (ms: number) => Promise<void>;
}

/** Verify-specifieke default-deadline (behoudt het historische gedrag vóór env-configuratie). */
export const DEFAULT_VERIFY_TIMEOUT_MS = 8_000;

/** Retry-grenzen: veilig maximum zodat een storende bron de request niet minutenlang open houdt. */
export const DEFAULT_VERIFY_RETRIES = 2;
export const MAX_VERIFY_RETRIES = 5;
/** Basis voor de exponentiële backoff (attempt 0 → base, 1 → 2×base, …), begrensd door MAX_BACKOFF. */
export const VERIFY_RETRY_BASE_DELAY_MS = 250;
export const VERIFY_RETRY_MAX_DELAY_MS = 4_000;

/** Leest het aantal retries uit een env-waarde en klemt op [0, MAX_VERIFY_RETRIES]. */
export function resolveVerifyRetries(
  raw: string | undefined,
  fallback: number = DEFAULT_VERIFY_RETRIES,
): number {
  const clamp = (n: number) => Math.min(MAX_VERIFY_RETRIES, Math.max(0, n));
  const parsed = raw !== undefined ? Number(raw) : Number.NaN;
  // Eindige waarden worden geklemd (een negatief getal → 0); alleen onleesbare invoer valt terug.
  if (Number.isFinite(parsed)) return clamp(Math.floor(parsed));
  return clamp(Math.floor(fallback));
}

/** Deterministische exponentiële backoff-vertraging voor een gegeven (0-geïndexeerde) retry. */
export function verifyRetryDelayMs(attempt: number): number {
  const delay = VERIFY_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt);
  return Math.min(VERIFY_RETRY_MAX_DELAY_MS, delay);
}

/** Een HTTP-status die veilig te herhalen is: server-fouten (5xx) en rate-limiting (429). */
function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Eén poging: doet de geconfigureerde POST en valideert het antwoord. Werpt een `VerifierRequestError`
 * met `transient`-vlag zodat de retry-lus weet of herhalen zin heeft.
 */
async function attemptVerifyOnce(
  config: VerifyEndpointConfig,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<RawVerifyResponse> {
  const url = `${config.baseUrl!.replace(/\/$/, "")}${config.path}`;

  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      { fetchImpl: config.fetchImpl, timeoutMs, label: config.name },
    );
  } catch (e) {
    if (e instanceof HttpTimeoutError) {
      throw new VerifierRequestError(
        `${config.name}: time-out bij het benaderen van de koppeling.`,
        true,
      );
    }
    throw new VerifierRequestError(`${config.name}: kon de koppeling niet bereiken.`, true);
  }

  if (!res.ok) {
    throw new VerifierRequestError(
      `${config.name}: koppeling gaf status ${res.status}.`,
      isTransientStatus(res.status),
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new VerifierRequestError(`${config.name}: ongeldig antwoord (geen JSON).`, false);
  }

  const parsed = verifyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new VerifierRequestError(
      `${config.name}: antwoord voldoet niet aan het verwachte contract.`,
      false,
    );
  }
  return parsed.data;
}

/**
 * Doet een geconfigureerde POST naar een verificatie-endpoint en valideert het antwoord, met een
 * harde per-poging-time-out en begrensde retry-met-backoff bij transiënte fouten.
 *
 * Werpt `VerifierNotConfiguredError` als de env ontbreekt (zodat de mock-fallback elders helder is),
 * en `VerifierRequestError` bij netwerk-/HTTP-/contractfouten. Transiënte fouten (netwerk, time-out,
 * 5xx, 429) worden tot `retries` keer herhaald; een niet-transiënte fout (4xx, niet-JSON, contract)
 * faalt meteen zonder herhaling.
 */
export async function verifyViaHttp(
  config: VerifyEndpointConfig,
  body: Record<string, unknown>,
): Promise<RawVerifyResponse> {
  if (!config.baseUrl || !config.apiKey) {
    throw new VerifierNotConfiguredError(config.name);
  }

  const timeoutMs = resolveHttpTimeoutMs(
    config.timeoutMs !== undefined ? String(config.timeoutMs) : process.env.VERIFY_HTTP_TIMEOUT_MS,
    DEFAULT_VERIFY_TIMEOUT_MS,
  );
  const maxRetries =
    config.retries !== undefined
      ? resolveVerifyRetries(String(config.retries))
      : resolveVerifyRetries(process.env.VERIFY_HTTP_RETRIES);
  const sleep = config.sleepImpl ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let attempt = 0;
  for (;;) {
    try {
      return await attemptVerifyOnce(config, body, timeoutMs);
    } catch (err) {
      if (err instanceof VerifierRequestError && err.transient && attempt < maxRetries) {
        await sleep(verifyRetryDelayMs(attempt));
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
}
