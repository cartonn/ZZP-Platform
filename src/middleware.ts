import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isAdminPath, isFranchisePath } from "@/lib/route-guards";

const { auth } = NextAuth(authConfig);

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
  if (isPublicPath(pathname)) return NextResponse.next();

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
