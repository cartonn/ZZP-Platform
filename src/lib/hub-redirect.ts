// Verschillende losse pagina's renderen exact hetzelfde paneel als een tab in een hub. De losse
// route blijft bestaan als permanente omleiding, zodat bestaande deeplinks (notificaties, e-mails,
// bladwijzers) blijven werken en er nog maar één canoniek pad per paneel is.
//
// De hubs geven hun resterende searchParams al door aan het actieve paneel (cursor, filter, zoek),
// dus de omleiding moet de querystring meenemen: /admin/dba?niveau=HOOG gaat naar
// /admin/toezicht?tab=dba&niveau=HOOG. Een `tab` in de binnenkomende query wordt genegeerd — de
// omleiding bepaalt zelf welk paneel hoort bij het oude pad.

export type RouteSearchParams = Record<string, string | string[] | undefined>;

/**
 * Bouwt het hub-pad voor een omgeleide losse route.
 *
 * @param hub  het hub-pad, bv. "/admin/toezicht"
 * @param tab  de tab-sleutel, of null voor de standaardtab (die krijgt geen ?tab=)
 * @param searchParams de searchParams van de oude route; blijven behouden
 */
export function hubRedirectTarget(
  hub: string,
  tab: string | null,
  searchParams: RouteSearchParams = {},
): string {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);

  for (const [key, value] of Object.entries(searchParams)) {
    // De tab van de omleiding wint altijd van een meegestuurde tab.
    if (key === "tab" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item);
    }
  }

  const query = params.toString();
  return query ? `${hub}?${query}` : hub;
}
