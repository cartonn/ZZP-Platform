// Zoekmachine-indexering: één pure bron van waarheid. Dit platform is login-gated en verwerkt
// gevoelige documenten (VOG, diploma's, ID). Voor een besloten pilot vóór go-live moet indexering
// standaard UIT staan — een privé-dienst hoort niet in Google te verschijnen. De mens zet het bij
// go-live bewust open met ALLOW_INDEXING=true (zelfde "veilige default achter een flag"-patroon
// als de overige productie-integraties).
//
// Twee lagen, beide uit deze module gevoed:
//   1. /robots.txt (src/app/robots.ts) — vertelt nette crawlers wat wel/niet te crawlen.
//   2. X-Robots-Tag response-header (next.config.mjs) — defense-in-depth: ook een gelekte of
//      direct-geserveerde URL draagt dan "noindex, nofollow", ongeacht of robots.txt is gelezen.

/** De X-Robots-Tag-waarde tijdens de besloten fase: niet indexeren, geen links volgen. */
export const NOINDEX_DIRECTIVE = "noindex, nofollow";

/**
 * Mag de dienst geïndexeerd worden door zoekmachines? Alleen bij de expliciete opt-in
 * ALLOW_INDEXING=true. Elke andere waarde (leeg, "false", onzin) → afgeschermd. Veilige default.
 */
export function isIndexingAllowed(allowIndexing: string | undefined): boolean {
  return allowIndexing === "true";
}

/**
 * De X-Robots-Tag-header die op elke response hoort tijdens de besloten fase, of `null` wanneer
 * indexering is opengezet (dan geen header — standaard crawlbaar gedrag).
 */
export function robotsHeaderValue(allowIndexing: string | undefined): string | null {
  return isIndexingAllowed(allowIndexing) ? null : NOINDEX_DIRECTIVE;
}

/**
 * Rules voor /robots.txt. Afgeschermd → alles disallowen; opengezet → alles toestaan. Bewust géén
 * host/sitemap: die zijn er (nog) niet en een verkeerde host in robots.txt is schadelijker dan
 * afwezigheid ervan.
 */
export function buildRobotsRules(allowIndexing: string | undefined): {
  userAgent: string;
  allow?: string;
  disallow?: string;
} {
  return isIndexingAllowed(allowIndexing)
    ? { userAgent: "*", allow: "/" }
    : { userAgent: "*", disallow: "/" };
}
