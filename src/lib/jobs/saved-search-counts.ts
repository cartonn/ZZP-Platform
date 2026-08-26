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

/** Venster (dagen) waarbinnen een passende opdracht als "nieuw" telt op de bewaarde zoekopdracht. */
export const RECENT_SAVED_SEARCH_DAYS = 7;

/** Totale én verse teller voor één bewaarde zoekopdracht. */
export interface SavedSearchMatchCount {
  /** Aantal nu-passende, zichtbare gepubliceerde opdrachten. */
  total: number;
  /** Daarvan: aantal dat de afgelopen `RECENT_SAVED_SEARCH_DAYS` dagen is gepubliceerd. */
  recent: number;
}

/** Puur: de ondergrens-datum (nu − `RECENT_SAVED_SEARCH_DAYS` dagen) voor het "nieuw"-venster. */
export function recentSavedSearchCutoff(now: Date): Date {
  return new Date(now.getTime() - RECENT_SAVED_SEARCH_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Puur: verrijk een bestaande count-where met het "vers gepubliceerd"-venster. Een gepubliceerde
 * opdracht draagt normaliter `publishedAt`; legacy/seed-rijen zonder `publishedAt` vallen terug op
 * `createdAt`, zodat de verse-teller nooit onder-rapporteert. Componeert non-destructief via `AND`
 * (de basis-where blijft ongemoeid). Geen I/O.
 */
export function withRecentPublishedWindow(
  where: Prisma.JobWhereInput,
  cutoff: Date,
): Prisma.JobWhereInput {
  return {
    AND: [
      where,
      {
        OR: [{ publishedAt: { gte: cutoff } }, { publishedAt: null, createdAt: { gte: cutoff } }],
      },
    ],
  };
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
 * Telt per canonieke query de nu-passende, zichtbare gepubliceerde opdrachten (`total`) én daarvan
 * het aantal dat de afgelopen `RECENT_SAVED_SEARCH_DAYS` dagen is gepubliceerd (`recent`).
 * `onlyEligible`-queries krijgen `null` (niet betrouwbaar DB-telbaar). Dedupliceert identieke queries
 * (telt elk maar één keer) en draait de counts parallel. `now` is injecteerbaar voor determinisme.
 */
export async function countSavedSearchMatches(
  queries: readonly string[],
  ctx: SavedSearchCountContext,
  now: Date = new Date(),
): Promise<Map<string, SavedSearchMatchCount | null>> {
  const unique = [...new Set(queries)];
  const cutoff = recentSavedSearchCutoff(now);
  const entries = await Promise.all(
    unique.map(async (query) => {
      const where = savedSearchCountWhere(query, ctx);
      if (where === null) return [query, null] as const;
      // Twee `count`-aggregaties (geen rij-materialisatie) — begrensd door MAX_SAVED_SEARCHES.
      const [total, recent] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.count({ where: withRecentPublishedWindow(where, cutoff) }),
      ]);
      return [query, { total, recent }] as const;
    }),
  );
  return new Map(entries);
}
