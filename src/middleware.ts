import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function getPublicOrigin(request: Request, fallbackOrigin: string) {
  const configuredOrigin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return fallbackOrigin;

  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(fallbackOrigin).protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/api/health" ||
    pathname.startsWith("/zzp/") ||
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

  // Geforceerde wachtwoordwijziging (bv. na bulk-import): blokkeer alle routes behalve de
  // wijzigpagina en uitloggen, tot de gebruiker zijn eigen wachtwoord heeft ingesteld.
  const changePath = "/account/wachtwoord";
  if (request.auth.user.mustChangePassword && pathname !== changePath && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL(changePath, origin));
  }

  // Defense-in-depth: /admin alleen voor ADMIN (pagina's + actions checken ook).
  if (pathname.startsWith("/admin") && request.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
