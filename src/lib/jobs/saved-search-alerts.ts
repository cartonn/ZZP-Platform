// "Verse treffers"-band op het ZZP'er-dashboard: haalt per ZZP'er de bewaarde zoekopdrachten op die
// de afgelopen dagen nieuwe, passende opdrachten hebben opgeleverd. Zo ziet de ZZP'er in één oogopslag
// welke bewaarde zoekopdracht net iets nieuws heeft, zonder de marktplaats zelf te openen.
//
// De telling hergebruikt exact `countSavedSearchMatches` (dat op zijn beurt `buildJobMarketplaceWhere`
// gebruikt): er zijn hier GEEN eigen telregels, dus er kan geen drift ontstaan tussen wat het dashboard
// belooft en wat de ZZP'er bij het openen van de zoekopdracht op de marktplaats ziet. De server is de
// waarheid — zichtbaarheid, tenant-scope en het "vers gepubliceerd"-venster worden server-side bepaald.
//
// Alleen zoekopdrachten met verse treffers (`recent > 0`) verschijnen in de band. Een zoekopdracht die
// niet betrouwbaar telbaar is (`onlyEligible` → count is `null`, de compliance-verfijning gebeurt
// per-ZZP'er in het geheugen) wordt overgeslagen. De pure `buildSavedSearchAlerts` is losgetrokken van
// de I/O zodat de filter-, sorteer- en cap-logica zonder DB unit-testbaar is.

import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/authz";
import { countSavedSearchMatches } from "@/lib/jobs/saved-search-counts";
import { savedSearchHref } from "@/lib/jobs/saved-search";

export interface SavedSearchAlert {
  /** Naam van de bewaarde zoekopdracht. */
  name: string;
  /** Marktplaats-URL die de zoekopdracht opnieuw toepast (savedSearchHref(query)). */
  href: string;
  /** Aantal treffers dat de afgelopen 7 dagen is gepubliceerd (> 0). */
  recent: number;
  /** Totaal aantal nu-passende, zichtbare treffers (>= recent). */
  total: number;
}

/** Maximaal aantal "verse treffers"-zoekopdrachten dat de dashboardband toont. */
export const MAX_SAVED_SEARCH_ALERTS = 4;

/**
 * Puur: zet bewaarde zoekopdracht-rijen + hun tellingen om naar de dashboardband. Slaat rijen over
 * waarvan de count `null` is (niet betrouwbaar telbaar) of geen verse treffers heeft (`recent <= 0`).
 * Sorteert deterministisch (recent desc, dan total desc, dan naam nl-asc) en capt op
 * `MAX_SAVED_SEARCH_ALERTS`. Geen I/O.
 */
export function buildSavedSearchAlerts(
  rows: readonly { name: string; query: string }[],
  counts: ReadonlyMap<string, { total: number; recent: number } | null>,
): SavedSearchAlert[] {
  const alerts: SavedSearchAlert[] = [];
  for (const row of rows) {
    const count = counts.get(row.query);
    if (count == null) continue; // onlyEligible / niet betrouwbaar telbaar
    if (count.recent <= 0) continue; // alleen verse treffers tonen
    alerts.push({
      name: row.name,
      href: savedSearchHref(row.query),
      recent: count.recent,
      total: count.total,
    });
  }
  alerts.sort(
    (a, b) => b.recent - a.recent || b.total - a.total || a.name.localeCompare(b.name, "nl"),
  );
  return alerts.slice(0, MAX_SAVED_SEARCH_ALERTS);
}

/**
 * Haalt voor een ZZP'er de bewaarde zoekopdrachten met verse treffers op voor de dashboardband.
 * Zinvol alleen voor een FREELANCER met profiel; zonder profiel of zonder bewaarde zoekopdrachten
 * geeft dit `[]`. De telling loopt via `countSavedSearchMatches` (gedeelde where-opbouw, geen drift).
 */
export async function getSavedSearchAlertsForFreelancer(actor: Actor): Promise<SavedSearchAlert[]> {
  if (actor.role !== "FREELANCER") return [];

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true, industries: { select: { industryId: true } } },
  });
  if (profile == null) return [];

  const rows = // unbounded-allow: eigenaar-scoped, begrensd tot MAX_SAVED_SEARCHES per ZZP'er
    await prisma.savedJobSearch.findMany({
      where: { freelancerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { name: true, query: true },
    });
  if (rows.length === 0) return [];

  const myIndustryIds = profile.industries.map((i) => i.industryId);
  const counts = await countSavedSearchMatches(
    rows.map((r) => r.query),
    { actor, myIndustryIds, profileId: profile.id },
  );
  return buildSavedSearchAlerts(rows, counts);
}
