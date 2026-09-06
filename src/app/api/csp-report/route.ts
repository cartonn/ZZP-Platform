// CSP-violatie-ontvanger. De browser POST't hier naartoe wanneer een bron door de
// Content-Security-Policy wordt geblokkeerd (via `report-uri`/`report-to`, zie src/lib/csp.ts +
// src/middleware.ts). Doel: in productie zichtbaar krijgen wat de policy blokkeert — zodat we
// (a) injectiepogingen zien en (b) de policy veilig kunnen verstrakken (de 'unsafe-inline'-
// fallback laten vallen) zodra we bevestigen dat legitieme code niet meer geblokkeerd wordt.
//
// Ongeauthenticeerd (de browser stuurt de ping zonder sessie), dus:
//   - rate-limited per IP (log-/CPU-flood tegengaan),
//   - PII-veilig genormaliseerd vóór het loggen (zie parseCspReport),
//   - altijd 204 (de browser verwacht geen body en mag niet gaan herproberen).

import { cspReportRateLimiter } from "@/lib/rate-limit";
import { readLimitedText } from "@/lib/http/read-limited-text";
import { logger } from "@/lib/observability/logger";
import { parseCspReport } from "@/lib/observability/csp-report";
import { clientIpFromRequest } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

// Body-limiet: een CSP-rapport is klein. Een grotere payload negeren we (geen misbruik-oppervlak).
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request): Promise<Response> {
  const noContent = new Response(null, { status: 204 });

  // Rate-limit vóór het lezen/parsen van de body: een flood mag geen werk veroorzaken. Het IP komt
  // via de spoof-bestendige helper (rechter X-Forwarded-For-hop), niet de client-linkerkant.
  const rl = await cspReportRateLimiter.check(clientIpFromRequest(request));
  if (!rl.allowed) return new Response(null, { status: 429 });

  // Gestreamde body-limiet: kapt de body af zodra hij de grens overschrijdt, óók bij een chunked
  // request zónder Content-Length (`request.text()` zou dan alles eerst bufferen). null = te groot
  // of onleesbaar; een lege body heeft niets te loggen.
  const raw = await readLimitedText(request, MAX_BODY_BYTES);
  if (!raw) return noContent;

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noContent; // onparseerbaar; niets te loggen
  }

  const violations = parseCspReport(payload);
  for (const v of violations) {
    // warn: een violatie is een signaal (of een injectiepoging of policy-te-strak), geen fout.
    // De logger redacteert PII-achtige velden nogmaals; de payload is al genormaliseerd.
    logger.warn("csp-violation", { ...v });
  }

  return noContent;
}
