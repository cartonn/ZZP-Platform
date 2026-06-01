// Gedeelde HTTP-helper voor de echte verificatiekoppelingen (DUO/BIG/iDIN). Houdt de
// driver-implementaties dun: één plek voor auth, timeout, JSON-contract en foutafhandeling.
// `fetchImpl` is injecteerbaar zodat dit zonder netwerk testbaar is.

import { z } from "zod";

export class VerifierNotConfiguredError extends Error {
  constructor(name: string) {
    super(`${name}-koppeling is niet geconfigureerd (stel basis-URL + API-sleutel in via env).`);
    this.name = "VerifierNotConfiguredError";
  }
}

export class VerifierRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerifierRequestError";
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
  timeoutMs?: number;
  /** Injecteerbaar voor tests; default global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Doet een geconfigureerde POST naar een verificatie-endpoint en valideert het antwoord.
 * Werpt VerifierNotConfiguredError als de env ontbreekt (zodat de mock-fallback elders helder is),
 * en VerifierRequestError bij netwerk-/HTTP-/contractfouten.
 */
export async function verifyViaHttp(
  config: VerifyEndpointConfig,
  body: Record<string, unknown>,
): Promise<RawVerifyResponse> {
  if (!config.baseUrl || !config.apiKey) {
    throw new VerifierNotConfiguredError(config.name);
  }
  const doFetch = config.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await doFetch(`${config.baseUrl.replace(/\/$/, "")}${config.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    throw new VerifierRequestError(
      e instanceof Error && e.name === "AbortError"
        ? `${config.name}: time-out bij het benaderen van de koppeling.`
        : `${config.name}: kon de koppeling niet bereiken.`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new VerifierRequestError(`${config.name}: koppeling gaf status ${res.status}.`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new VerifierRequestError(`${config.name}: ongeldig antwoord (geen JSON).`);
  }

  const parsed = verifyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new VerifierRequestError(
      `${config.name}: antwoord voldoet niet aan het verwachte contract.`,
    );
  }
  return parsed.data;
}
