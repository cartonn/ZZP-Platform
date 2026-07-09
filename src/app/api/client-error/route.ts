// Client-fout-ontvanger. De browser POST't hier naartoe wanneer een React-error-boundary
// (error.tsx / global-error.tsx) een gevangen fout heeft. Doel: browser-crashes zichtbaar krijgen
// in productie-monitoring — server-fouten bereiken de reporter al via Next's onRequestError-grens,
// maar een client-side render-crash verdween tot nu toe in de browser-console van de gebruiker.
//
// Ongeauthenticeerd (de error-boundary stuurt de ping mogelijk zonder geldige sessie), dus:
//   - rate-limited per IP (log-/CPU-flood door een fout-loop tegengaan),
//   - PII-veilig genormaliseerd vóór het rapporteren (zie parseClientError),
//   - via reportError → Sentry (indien SENTRY_DSN) of gestructureerd gelogd,
//   - altijd 204 (de browser verwacht geen body en mag niet gaan herproberen).

import { clientErrorRateLimiter } from "@/lib/rate-limit";
import { parseClientError, toReportableError } from "@/lib/observability/client-error";
import { reportError } from "@/lib/observability/report";
import { clientIpFromRequest } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

// Body-limiet: een client-foutrapport is klein (naam/bericht/stack). Grotere payload negeren we.
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request): Promise<Response> {
  const noContent = new Response(null, { status: 204 });

  // Rate-limit vóór het lezen/parsen van de body: een flood mag geen werk veroorzaken. Het IP komt
  // via de spoof-bestendige helper (rechter X-Forwarded-For-hop), niet de client-linkerkant.
  const rl = await clientErrorRateLimiter.check(clientIpFromRequest(request));
  if (!rl.allowed) return new Response(null, { status: 429 });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return noContent;
  }
  if (!raw || raw.length > MAX_BODY_BYTES) return noContent;

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noContent; // onparseerbaar; niets te rapporteren
  }

  const normalized = parseClientError(payload);
  if (!normalized) return noContent; // geen betekenisvolle fout

  // reportError slikt alles: rapportage mag de response nooit laten falen. De extra context is
  // PII-arm (pad, digest, componentStack zijn genormaliseerd); de logger redacteert daarbovenop.
  await reportError(toReportableError(normalized), {
    source: "client-error",
    requestPath: normalized.path ?? undefined,
    extra: {
      componentStack: normalized.componentStack,
      digest: normalized.digest,
    },
  });

  return noContent;
}
