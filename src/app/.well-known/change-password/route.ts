import { resolvePublicOrigin } from "@/lib/public-url";
import { buildChangePasswordRedirect } from "@/lib/change-password-url";

// /.well-known/change-password (W3C "A Well-Known URL for Changing Passwords") — verwijst een
// wachtwoordmanager door naar de echte wachtwoord-wijzigen-pagina (/account/wachtwoord). Nooit
// gecachet: een gewijzigde AUTH_URL werkt na een redeploy meteen door. Dit pad valt (via de punt in
// `.well-known`) buiten de middleware-matcher: geen login-redirect, publiek bereikbaar zoals
// /.well-known/security.txt en /robots.txt. Bron van waarheid: src/lib/change-password-url.ts.
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const headers = new Headers(request.headers);
  const origin = resolvePublicOrigin(
    headers.get("x-forwarded-host") ?? headers.get("host"),
    headers.get("x-forwarded-proto"),
  );
  const { status, location } = buildChangePasswordRedirect(origin);

  return new Response(null, {
    status,
    headers: {
      Location: location,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
