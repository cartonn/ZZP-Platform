// Eén bron van waarheid voor de Prisma-where van de zichtbare, gepubliceerde opdrachten op de
// marktplaats (`/opdrachten`). Zowel de marktplaatspagina als de bewaarde-zoekopdracht-teller
// gebruiken deze functie, zodat een telling nooit afwijkt van wat de ZZP'er op de pagina ziet
// (geen screen↔teller-drift). De functie is puur (geen I/O) en injecteert de tenant-zichtbaarheid
// via `visibleJobsWhere`.
//
// Bevat NIET de in-memory verfijningen die de pagina ná de DB-query toepast — de
// inzetbaarheidsfilter (`onlyEligible`, per-ZZP'er compliance) en de match-/startdatum-sortering.
// Die zijn per-ZZP'er of tijd-variant en horen niet in een DB-where; de teller houdt daar apart
// rekening mee (zie `saved-search-counts.ts`).

import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import type { JobFilters } from "@/lib/jobs";

export interface MarketplaceWhereContext {
  /** De kijkende actor — bepaalt de tenant-zichtbaarheid (ADMIN ziet alles). */
  actor: Actor;
  /** Branche-ids van het eigen ZZP-profiel; voedt de `mine`-quickfilter. Leeg = quickfilter doet niets. */
  myIndustryIds?: readonly string[];
  /**
   * FreelancerProfile.id — nodig voor de `hideApplied`-uitsluiting (opdrachten waarop deze ZZP'er
   * al niet-ingetrokken reageerde). `null`/ontbrekend → `hideApplied` heeft geen effect.
   */
  profileId?: string | null;
}

/**
 * Bouwt de volledige where voor de zichtbare, gepubliceerde opdrachten uit een reeds via
 * `normalizeJobFilters` genormaliseerd `JobFilters`-object. Spiegelt exact de where-opbouw van de
 * marktplaatspagina (tenant-zichtbaarheid → tariefgrenzen → hideApplied → tekstzoek/locatie/
 * werkvorm/vaardigheden/certificaat → branche).
 */
export function buildJobMarketplaceWhere(
  filters: JobFilters,
  { actor, myIndustryIds = [], profileId = null }: MarketplaceWhereContext,
): Prisma.JobWhereInput {
  // Tarieffilters als AND-clausules: sluit een opdracht alléén uit als de relevante grens bekend is
  // én buiten bereik valt. Een onbekende (nullable) grens telt niet als uitsluiting.
  const and: Prisma.JobWhereInput[] = [visibleJobsWhere(actor)];
  if (filters.rateMin != null) {
    and.push({ OR: [{ rateMax: { gte: filters.rateMin } }, { rateMax: null }] });
  }
  if (filters.rateMax != null) {
    and.push({ OR: [{ rateMin: { lte: filters.rateMax } }, { rateMin: null }] });
  }
  // "Verberg opdrachten waarop ik al reageerde": alleen zinvol met een profiel. Een ingetrokken
  // (WITHDRAWN) reactie telt niet mee — de opdracht is dan weer een echte, herbruikbare kans.
  if (profileId && filters.hideApplied) {
    and.push({
      NOT: { applications: { some: { freelancerId: profileId, status: { not: "WITHDRAWN" } } } },
    });
  }

  // AND-clausule zodat de tekstzoek-OR hieronder de zichtbaarheids-OR niet overschrijft.
  const where: Prisma.JobWhereInput = { status: "PUBLISHED", AND: and };
  if (filters.q) {
    where.OR = [{ title: { contains: filters.q } }, { description: { contains: filters.q } }];
  }
  if (filters.location) where.location = { contains: filters.location };
  if (filters.workMode) where.workMode = filters.workMode;
  if (filters.skillIds.length) where.skills = { some: { skillId: { in: [...filters.skillIds] } } };
  if (filters.requiredCredential) {
    where.credentialRequirements = {
      some: { credentialType: filters.requiredCredential, required: true },
    };
  }

  // Branchefilter: een expliciete `industryId` is het meest specifiek en wint. Anders beperkt de
  // "Mijn vakgebied"-quickfilter tot de eigen profielbranches (zonder branches doet `mine` niets).
  if (filters.industryId) {
    where.industryId = filters.industryId;
  } else if (filters.mine && myIndustryIds.length > 0) {
    where.industryId = { in: [...myIndustryIds] };
  }

  return where;
}
