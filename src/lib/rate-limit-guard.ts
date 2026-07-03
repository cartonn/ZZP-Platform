// Gedeelde rem-en-respons voor route-handlers (export-/PDF-/dossier-routes). Zo delen alle
// financiële-download-routes exact dezelfde 429-logica en -respons in plaats van de check te
// dupliceren. De check zelf (RateLimiter) is elders getest; deze wrapper vertaalt het resultaat
// naar een klaar-voor-gebruik HTTP 429 (met Retry-After) of null (mag door).

import { NextResponse } from "next/server";
import type { RateLimiter } from "@/lib/rate-limit";

/**
 * Voert één rate-limit-check uit voor `key` op `limiter`.
 * @returns een 429-`NextResponse` (met `Retry-After`-header in seconden) zodra de limiet is
 *          overschreden, anders `null` — de caller gaat dan gewoon door.
 */
export async function enforceRateLimit(
  limiter: RateLimiter,
  key: string,
  message = "Te veel verzoeken. Probeer het later opnieuw.",
): Promise<NextResponse | null> {
  const { allowed, retryAfterMs } = await limiter.check(key);
  if (allowed) return null;
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) },
    },
  );
}
