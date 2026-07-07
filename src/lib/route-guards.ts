// Pure route-matchers voor de middleware. Apart en getest omdat een naïeve
// `pathname.startsWith("/admin")` óók `/administratie` matcht (de boekhoudpagina van
// ZZP'er/opdrachtgever) — dat stuurde niet-admins ten onrechte naar /dashboard.

import { type UserRole } from "@/lib/enums";

/**
 * Inlogvrije (publieke) routes. Bewust een expliciete allowlist: de middleware redirect al het
 * andere naar /login. De health-/readinessprobes horen hier — zonder dat zou een Railway/monitoring-
 * probe naar /login geredirect worden en permanent falen rapporteren. Beide lekken alleen booleans +
 * een 7-tekens commit-SHA (geen PII/secrets).
 */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/wachtwoord-vergeten" ||
    pathname.startsWith("/wachtwoord-herstellen/") ||
    pathname === "/api/health" ||
    pathname === "/api/readiness" ||
    pathname.startsWith("/zzp/") ||
    pathname.startsWith("/vertrouwen/") || // publiek vertrouwensdossier (token-beveiligd, geen sessie)
    // /ontwerp en /ontwerp-lab zijn NIET publiek: het is een intern design-lab (inloggen vereist).
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/tasks/") || // eigen token-guard (CRON_SECRET), geen sessie
    // CSP-violatie-ontvanger: de browser POST't hier zonder (of ná verlies van) een sessie, óók
    // vanaf publieke pagina's (login). Eigen rate-limit-guard; logt alleen genormaliseerde,
    // PII-arme velden. Achter de inlogmuur zou een report naar /login worden geredirect en nooit
    // aankomen.
    pathname === "/api/csp-report" ||
    // Client-fout-ontvanger: de error-boundary POST't hier vanuit de browser zonder (of ná verlies
    // van) een sessie, óók vanaf publieke pagina's en bij een root-layout-crash. Eigen rate-limit-
    // guard; rapporteert alleen genormaliseerde, PII-arme velden. Achter de inlogmuur zou het rapport
    // naar /login worden geredirect en nooit aankomen — precies de crashes die dit zichtbaar maakt.
    pathname === "/api/client-error" ||
    // Betaal-provider-webhook (Mollie): de provider pingt zonder sessie-cookie. De handler
    // vertrouwt de request-body nooit blind — hij vraagt de betaalstatus opnieuw op bij de
    // provider (bron van waarheid) en antwoordt altijd 200 zonder data te lekken. Stond ten
    // onrechte achter de inlogmuur, waardoor een live webhook naar /login zou worden geredirect
    // en abonnementen na betaling nooit zouden activeren.
    pathname === "/api/billing/webhook"
  );
}

/** Hoort dit pad bij het admin-paneel? Matcht op de segmentgrens, niet op losse prefix. */
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Hoort dit pad bij de franchise-werkplek (Franchiser of admin)? Segmentgrens-match. */
export function isFranchisePath(pathname: string): boolean {
  return pathname === "/franchise" || pathname.startsWith("/franchise/");
}

/** Segmentgrens-match: pad === base, of pad begint met `base + "/"`. */
function onSegment(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

/**
 * De exclusief vereiste rol voor een rol-gated pagina BUITEN /admin en /franchise (die hebben hun
 * eigen guard in de middleware). null = niet enkel-rol-gated (gedeelde of binnen-app publieke route).
 *
 * Spiegelt de `requireRole(<één rol>)` op de betreffende page.tsx, zodat de middleware al een nette
 * redirect kan geven i.p.v. de crashpagina die een ongevangen AuthorizationError oplevert (B1). De
 * pagina's houden hun eigen `requireRole` als defense-in-depth.
 *
 * Let op de GEDEELDE ouders die hier bewust NIET volledig in staan: `/opdrachten` (lijst/detail),
 * `/facturen` (lijst/detail), `/samenwerkingen` en `/academie` (overzicht + les bekijken) zijn voor
 * meerdere rollen — alleen specifieke subpagina's zijn enkel-rol-gated.
 */
export function roleForPath(pathname: string): UserRole | null {
  const path = pathname.split(/[?#]/)[0] ?? pathname;

  // FREELANCER-only
  if (
    onSegment(path, "/beschikbaarheid") ||
    onSegment(path, "/certificaten") ||
    onSegment(path, "/documenten") ||
    onSegment(path, "/profiel") ||
    onSegment(path, "/reacties") ||
    path === "/facturen/nieuw" // /facturen-lijst en /facturen/[id] zijn gedeeld
  ) {
    return "FREELANCER";
  }

  // CLIENT-only
  if (
    onSegment(path, "/bedrijf") ||
    onSegment(path, "/kandidaten") ||
    onSegment(path, "/favorieten") ||
    path === "/opdrachten/nieuw" || // /opdrachten-lijst en /opdrachten/[id] zijn gedeeld
    /^\/opdrachten\/[^/]+\/bewerken$/.test(path)
  ) {
    return "CLIENT";
  }

  // ADMIN-only buiten /admin: alleen academie-beheer (het overzicht + een les bekijken is gedeeld)
  if (
    path === "/academie/nieuw" ||
    /^\/academie\/[^/]+\/bewerken$/.test(path) ||
    /^\/academie\/[^/]+\/lessen\/nieuw$/.test(path) ||
    /^\/academie\/[^/]+\/[^/]+\/bewerken$/.test(path)
  ) {
    return "ADMIN";
  }

  return null;
}
