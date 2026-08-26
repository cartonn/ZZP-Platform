// Teller voor bewaarde zoekopdrachten op de opdrachten-marktplaats (`/opdrachten`). Per bewaarde
// (canonieke) query telt dit hoeveel zichtbare, gepubliceerde opdrachten er nú matchen, zodat de
// ZZP'er in één oogopslag ziet welke zoekopdracht iets oplevert. De teller hergebruikt exact
// dezelfde where-opbouw als de marktplaatspagina (`buildJobMarketplaceWhere`) — geen screen↔teller-
// drift.
//
// Een bewaarde zoekopdracht met `onlyEligible` kan niet betrouwbaar met een kale DB-count worden
// geteld: de pagina verfijnt die weergave ná de DB-query in-memory op per-ZZP'er compliance, dus een
// DB-count zou over-rapporteren en afwijken van wat de ZZP'er bij het klikken ziet. Voor die queries
// geeft de teller `null` (de UI toont dan geen aantal-badge). De pure beslissing is losgetrokken van
// de I/O zodat die zonder DB unit-testbaar is.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/authz";
import { normalizeJobFilters } from "@/lib/jobs";
import { buildJobMarketplaceWhere } from "@/lib/jobs/marketplace-where";
import { savedSearchQueryToRawParams } from "@/lib/jobs/saved-search";

export interface SavedSearchCountContext {
  /** De kijkende ZZP'er — bepaalt de tenant-zichtbaarheid. */
  actor: Actor;
  /** Branche-ids van het eigen profiel; voedt de `mine`-quickfilter. */
  myIndustryIds: readonly string[];
  /** FreelancerProfile.id — nodig voor de `hideApplied`-uitsluiting. */
  profileId: string;
}

/**
 * Puur: bouw de count-where voor één bewaarde (canonieke) query, of `null` wanneer de query niet
 * betrouwbaar DB-telbaar is (`onlyEligible` — per-ZZP'er compliance-verfijning gebeurt in-memory,
 * niet in de where). Geen I/O.
 */
export function savedSearchCountWhere(
  query: string,
  ctx: SavedSearchCountContext,
): Prisma.JobWhereInput | null {
  const filters = normalizeJobFilters(savedSearchQueryToRawParams(query));
  if (filters.onlyEligible) return null;
  return buildJobMarketplaceWhere(filters, {
    actor: ctx.actor,
    myIndustryIds: ctx.myIndustryIds,
    profileId: ctx.profileId,
  });
}

/**
 * Telt per canonieke query de nu-passende, zichtbare gepubliceerde opdrachten. `onlyEligible`-queries
 * krijgen `null` (niet betrouwbaar DB-telbaar). Dedupliceert identieke queries (telt elk maar één
 * keer) en draait de counts parallel.
 */
export async function countSavedSearchMatches(
  queries: readonly string[],
  ctx: SavedSearchCountContext,
): Promise<Map<string, number | null>> {
  const unique = [...new Set(queries)];
  const entries = await Promise.all(
    unique.map(async (query) => {
      const where = savedSearchCountWhere(query, ctx);
      if (where === null) return [query, null] as const;
      // Een `count` is inherent begrensd (aggregatie, geen rij-materialisatie) — geen scan-cap nodig.
      const count = await prisma.job.count({ where });
      return [query, count] as const;
    }),
  );
  return new Map(entries);
}
