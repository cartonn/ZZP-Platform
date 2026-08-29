// `Clear-Site-Data` bij een expliciete logout — purge van browser-side residu.
//
// Waarom: dit platform is een PWA met een service-worker (public/sw.js, cache `zzp-shell-v3`) die
// genavigeerde — dus auth-gated — pagina's in de Cache-Storage bewaart, plus client-storage
// (localStorage: thema/PWA-install-hint). Op een gedeelde of publieke computer zou een volgende
// gebruiker die gecachte pagina's/gegevens na het uitloggen nog kunnen inzien. `Clear-Site-Data`
// laat de browser dat residu wissen op het moment dat de post-logout `/login`-navigatie binnenkomt.
//
// Directives: `"cache"` (HTTP-cache) + `"storage"` (localStorage/sessionStorage/IndexedDB,
// service-worker-registraties én de Cache-Storage-API — dáár zit het gevoelige residu). Bewust
// NIET `"cookies"`: NextAuth verwijdert de sessiecookie al expliciet bij signOut, en het clearen
// van álle cookies in dezelfde response als waarin het inlogformulier zijn CSRF-cookie zet, kan de
// eerstvolgende login breken. De themavoorkeur (localStorage) valt terug op de systeemvoorkeur —
// niet-gevoelig en opnieuw instelbaar; op een gedeelde machine is een schone lei juist gewenst.
//
// Alleen bij een EXPLICIETE logout (marker-queryparam), niet bij een verlopen/onderbroken sessie:
// die redirect draagt geen marker en raakt de gebruiker zijn eigen tabblad, geen beveiligingswinst.
// Noot: browsers honoreren `Clear-Site-Data` alleen over een veilige (HTTPS) verbinding — in
// productie (Railway) actief, lokaal over http genegeerd (dat is prima; het is prod-hardening).

/** Waarde voor de `Clear-Site-Data`-responseheader bij logout. */
export const CLEAR_SITE_DATA_LOGOUT = '"cache", "storage"';

/** Queryparam die een post-logout `/login`-navigatie markeert. */
export const LOGOUT_MARKER_PARAM = "uitgelogd";
/** Waarde van de marker. */
export const LOGOUT_MARKER_VALUE = "1";

/** Pad waar de post-logout-navigatie op landt (moet publiek zijn — zie route-guards). */
export const LOGOUT_LANDING_PATH = "/login";

/**
 * Bouwt de `redirectTo` voor `signOut(...)`: voegt de logout-marker toe aan het doelpad, met behoud
 * van een eventuele bestaande querystring (bv. `?changed=1` na een wachtwoordwijziging). Puur.
 */
export function logoutRedirect(target: string = LOGOUT_LANDING_PATH): string {
  const [path, existing = ""] = target.split("?");
  const params = new URLSearchParams(existing);
  params.set(LOGOUT_MARKER_PARAM, LOGOUT_MARKER_VALUE);
  return `${path || LOGOUT_LANDING_PATH}?${params.toString()}`;
}

/**
 * Bepaalt of de response de `Clear-Site-Data`-header moet dragen: alleen op de landings-navigatie
 * (`/login`) mét de logout-marker. Puur/testbaar; gewired in src/middleware.ts.
 */
export function shouldClearSiteDataOnLogout(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  return (
    pathname === LOGOUT_LANDING_PATH &&
    searchParams.get(LOGOUT_MARKER_PARAM) === LOGOUT_MARKER_VALUE
  );
}
