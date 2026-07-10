import { resolvePublicOrigin } from "@/lib/public-url";
import { buildSecurityTxt, resolveSecurityContacts } from "@/lib/security-txt";

// /.well-known/security.txt (RFC 9116) — server-gerenderd meldpunt voor gecoördineerde
// kwetsbaarheidsmelding. Nooit gecachet: de Expires-datum wordt per request uit `now` afgeleid
// (blijft zo altijd geldig) en een gewijzigd SECURITY_CONTACT werkt na een redeploy meteen door.
// Dit pad bevat een punt en valt daarmee buiten de middleware-matcher: geen login-redirect, publiek
// bereikbaar zoals /robots.txt. Bron van waarheid: src/lib/security-txt.ts.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const headers = new Headers(request.headers);
  const origin = resolvePublicOrigin(
    headers.get("x-forwarded-host") ?? headers.get("host"),
    headers.get("x-forwarded-proto"),
  );
  const body = buildSecurityTxt({
    contacts: resolveSecurityContacts(process.env.SECURITY_CONTACT, origin),
    canonicalOrigin: origin,
    now: new Date(),
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
