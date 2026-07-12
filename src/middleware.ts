import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { buildCsp, generateNonce, reportingEndpointsHeader } from "@/lib/csp";
import {
  buildMaintenancePage,
  isMaintenanceEnabled,
  maintenanceAllowsAdmin,
  maintenanceMessage,
  maintenanceRetryAfterSeconds,
  shouldServeMaintenance,
} from "@/lib/maintenance";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/request-id";
import { isAdminPath, isFranchisePath, isPublicPath, roleForPath } from "@/lib/route-guards";

const { auth } = NextAuth(authConfig);

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP-nonce-pipeline (missie A): per request een nonce. De policy gaat op de REQUEST-headers
 * (zo geeft Next zijn eigen framework-/hydratiescripts de nonce mee) én op de response. De
 * layout leest x-nonce voor het inline theme-script. Redirects hebben geen document en dus
 * geen CSP nodig.
 */
function nextWithCsp(request: Request, requestId: string): NextResponse {
  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Pad meegeven zodat de app-shell breedte per route kan bepalen (bv. schermvullend dashboard).
  requestHeaders.set("x-pathname", new URL(request.url).pathname);
  requestHeaders.set("content-security-policy", csp);
  // Correlatie-ID (in de handler bepaald): op de forwarded request-headers (route handlers/
  // instrumentation lezen 'm zo) én op de response (zichtbaar in de Network-tab, koppelbaar aan de
  // server-logs/Sentry van díe request).
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("Content-Security-Policy", csp);
  // Reporting API: koppelt de `report-to`-groep uit de policy aan het ontvanger-endpoint. De
  // `report-uri`-fallback in de policy werkt zonder deze header; oudere browsers gebruiken die.
  response.headers.set("Reporting-Endpoints", reportingEndpointsHeader());
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

/**
 * Onderhoudsmodus: geeft — indien aan — een rustige 503-pagina i.p.v. de app. Draait vóór álle
 * andere routering (auth, rol-guards) zodat óók publieke pagina's (login) offline gaan; alleen de
 * gezondheids-probes blijven bereikbaar (zie MAINTENANCE_EXEMPT_PATHS) zodat de host-healthcheck de
 * container niet neerhaalt. Ingelogde ADMINs mogen er standaard door (MAINTENANCE_ALLOW_ADMIN).
 */
function maintenanceResponse(
  pathname: string,
  isAdmin: boolean,
  requestId: string,
): NextResponse | null {
  const enabled = isMaintenanceEnabled(process.env.MAINTENANCE_MODE);
  if (!enabled) return null;
  const allowAdmin = maintenanceAllowsAdmin(process.env.MAINTENANCE_ALLOW_ADMIN);
  if (!shouldServeMaintenance({ enabled, pathname, isAdmin, allowAdmin })) return null;

  const html = buildMaintenancePage({
    message: maintenanceMessage(process.env.MAINTENANCE_MESSAGE),
  });
  return new NextResponse(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(maintenanceRetryAfterSeconds(process.env.MAINTENANCE_RETRY_AFTER)),
      "x-robots-tag": "noindex, nofollow",
      [REQUEST_ID_HEADER]: requestId,
    },
  });
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));

  const maintenance = maintenanceResponse(
    pathname,
    request.auth?.user?.role === "ADMIN",
    requestId,
  );
  if (maintenance) return maintenance;

  if (isPublicPath(pathname)) return nextWithCsp(request, requestId);

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

  return nextWithCsp(request, requestId);
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
