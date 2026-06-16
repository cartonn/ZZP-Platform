import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { buildCsp, generateNonce } from "@/lib/csp";
import { isAdminPath, isFranchisePath, roleForPath } from "@/lib/route-guards";

const { auth } = NextAuth(authConfig);

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP-nonce-pipeline (missie A): per request een nonce. De policy gaat op de REQUEST-headers
 * (zo geeft Next zijn eigen framework-/hydratiescripts de nonce mee) én op de response. De
 * layout leest x-nonce voor het inline theme-script. Redirects hebben geen document en dus
 * geen CSP nodig.
 */
function nextWithCsp(request: Request): NextResponse {
  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Pad meegeven zodat de app-shell breedte per route kan bepalen (bv. schermvullend dashboard).
  requestHeaders.set("x-pathname", new URL(request.url).pathname);
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function getPublicOrigin(request: Request, fallbackOrigin: string) {
  const configuredOrigin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return fallbackOrigin;

  const protocol =
    request.headers.get("x-forwarded-proto") ?? new URL(fallbackOrigin).protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/wachtwoord-vergeten" ||
    pathname.startsWith("/wachtwoord-herstellen/") ||
    pathname === "/api/health" ||
    pathname.startsWith("/zzp/") ||
    pathname.startsWith("/vertrouwen/") || // publiek vertrouwensdossier (token-beveiligd, geen sessie)
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/tasks/") // eigen token-guard (CRON_SECRET), geen sessie
  );
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return nextWithCsp(request);

  const origin = getPublicOrigin(request, request.nextUrl.origin);
  if (!request.auth?.user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", new URL(`${pathname}${search}`, origin).toString());
    return NextResponse.redirect(loginUrl);
  }

  // Geschorst (of anderszins niet-actief) account met nog geldige sessie: stuur naar een duidelijke
  // schorsingspagina i.p.v. een doodlopende foutpagina (requireActor gooit anders 403 op /dashboard).
  // De /geschorst-pagina zelf + uitloggen blijven bereikbaar.
  const suspended = request.auth.user.status !== "ACTIVE";
  if (suspended && pathname !== "/geschorst" && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/geschorst", origin));
  }
  // Een actief account hoort niet op de schorsingspagina te blijven hangen.
  if (!suspended && pathname === "/geschorst") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // Geforceerde wachtwoordwijziging (bv. na bulk-import): blokkeer alle routes behalve de
  // wijzigpagina en uitloggen, tot de gebruiker zijn eigen wachtwoord heeft ingesteld.
  const changePath = "/account/wachtwoord";
  if (
    request.auth.user.mustChangePassword &&
    pathname !== changePath &&
    !pathname.startsWith("/api/auth")
  ) {
    return NextResponse.redirect(new URL(changePath, origin));
  }

  // Defense-in-depth: /admin alleen voor ADMIN (pagina's + actions checken ook).
  // NB: segmentgrens — anders matcht "/admin" ook "/administratie" (de boekhoudpagina).
  if (isAdminPath(pathname) && request.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // /franchise alleen voor de Franchiser (tenant-admin). De platform-admin houdt toezicht
  // via /admin/franchises; tenant-scoping leunt op de eigen tenantId van de Franchiser.
  if (isFranchisePath(pathname) && request.auth.user.role !== "FRANCHISER") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // Overige enkel-rol-gated pagina's (buiten /admin & /franchise) krijgen dezelfde nette redirect
  // i.p.v. de crashpagina die een ongevangen AuthorizationError oplevert (B1). Spiegelt de
  // `requireRole(<één rol>)` op die pagina's; die blijft als defense-in-depth staan.
  const requiredRole = roleForPath(pathname);
  if (requiredRole && request.auth.user.role !== requiredRole) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return nextWithCsp(request);
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
