// "A Well-Known URL for Changing Passwords" (W3C, https://w3c.github.io/webappsec-change-password-url/):
// één pure bron van waarheid voor het `/.well-known/change-password`-vindpunt.
//
// Waarom: wachtwoordmanagers (Safari/iCloud-sleutelhanger, Chrome, 1Password, Bitwarden) tonen een
// "Wijzig wachtwoord"-knop wanneer ze een zwak of in een datalek voorkomend wachtwoord detecteren, en
// navigeren die knop naar `<origin>/.well-known/change-password`. De standaard schrijft voor dat die
// URL de gebruiker **doorverwijst** (3xx) naar de echte wachtwoord-wijzigen-pagina. Zonder dit
// vindpunt gokt de manager (vaak de homepage) en belandt de gebruiker niet op de juiste pagina —
// zeker omdat onze pagina op het niet-voor-de-hand-liggende pad `/account/wachtwoord` staat.
//
// Dit is de natuurlijke tegenhanger van de al ingebouwde HIBP gelekt-wachtwoord-controle
// (`src/lib/services/password-breach.ts`): detecteert een manager een gecompromitteerd wachtwoord, dan
// deep-linkt dit vindpunt de gebruiker rechtstreeks naar het herstelpad.
//
// Puur/testbaar: de vertrouwde origin komt als argument binnen (server-side waarheid, CLAUDE.md regel
// 1 — nooit uit een client-beïnvloedbare header gebouwd; de aanroeper levert `resolvePublicOrigin`).

/** Het interne pad van de wachtwoord-wijzigen-pagina (achter de inlogmuur). */
export const CHANGE_PASSWORD_PATH = "/account/wachtwoord";

/**
 * HTTP-status voor het vindpunt. 303 See Other: de manager doet een GET op de wachtwoord-wijzigen-
 * pagina, ongeacht hoe hij het vindpunt opvroeg — semantisch correct voor "ga naar deze pagina".
 */
export const CHANGE_PASSWORD_REDIRECT_STATUS = 303;

export interface ChangePasswordRedirect {
  status: typeof CHANGE_PASSWORD_REDIRECT_STATUS;
  /** Absolute Location voor de redirect, op dezelfde vertrouwde origin. */
  location: string;
}

/**
 * Bouwt de redirect naar de wachtwoord-wijzigen-pagina op basis van de vertrouwde publieke origin.
 * De Location is absoluut op diezelfde origin — nooit uit een client-header afgeleid, zodat het
 * vindpunt niet naar een vreemd domein te sturen is (host-header-poisoning, OWASP A01).
 *
 * @param canonicalOrigin Vertrouwde origin zonder trailing slash (bv. https://app.zzp-platform.nl).
 */
export function buildChangePasswordRedirect(canonicalOrigin: string): ChangePasswordRedirect {
  const base = canonicalOrigin.replace(/\/+$/, "");
  return {
    status: CHANGE_PASSWORD_REDIRECT_STATUS,
    location: `${base}${CHANGE_PASSWORD_PATH}`,
  };
}
