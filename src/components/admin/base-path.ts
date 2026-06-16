/**
 * Bouwt een link op basis van een `basePath` plus querystring-parameters. Het paneel wordt zowel
 * standalone (basePath zonder query, bv. `/admin/audit`) als in de toezicht-hub (basePath mét query,
 * bv. `/admin/toezicht?tab=audit`) gerenderd. In het hub-geval moeten extra params met `&` worden
 * aangehangen, anders met `?`. Eén plek zodat alle panelen dezelfde regel volgen.
 */
export function withParams(basePath: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  const query = search.toString();
  if (!query) return basePath;
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}${query}`;
}
