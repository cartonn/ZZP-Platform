// Tenant-scoping (franchise-isolatie). Een Franchiser — en de opdrachtgevers + ZZP'ers die hij
// in het platform brengt — deelt één `tenantId`; een directe platformgebruiker heeft `tenantId = null`.
// Deze helpers leveren de Prisma-where-fragmenten + ownership-checks zodat de "gesloten per
// tenant"-regel (een tenant-dienst is alleen zichtbaar voor de eigen roster, en vice-versa) op
// één plek staat. ADMIN ziet alles. Pure functies — los unit-getest, geen DB/IO.

import { type Prisma } from "@prisma/client";
import { AuthorizationError, type Actor } from "@/lib/authz";

/** Heeft deze actor een franchise (tenant)? Versmalt het type zodat `tenantId` een string is. */
export function hasTenant(actor: Actor | null | undefined): actor is Actor & { tenantId: string } {
  return !!actor && typeof actor.tenantId === "string" && actor.tenantId.length > 0;
}

/**
 * Where-fragment om de eigen-tenant-data van een tenant-admin (Franchiser) te filteren.
 * - ADMIN: `{}` (alles, platform-breed)
 * - Franchiser (heeft tenantId): `{ tenantId }`
 * - anders: 403 (een gebruiker zonder franchise mag deze lijsten niet opvragen)
 */
export function tenantScopeWhere(actor: Actor | null | undefined): { tenantId?: string } {
  if (actor?.role === "ADMIN") return {};
  if (hasTenant(actor)) return { tenantId: actor.tenantId };
  throw new AuthorizationError("Geen toegang: geen franchise gekoppeld.", 403);
}

/** Werpt 403 als de entiteit niet in de tenant van de actor valt (ADMIN mag alles). */
export function assertSameTenant(
  actor: Actor | null | undefined,
  entityTenantId: string | null | undefined,
): void {
  if (actor?.role === "ADMIN") return;
  if (!hasTenant(actor) || actor.tenantId !== entityTenantId) {
    throw new AuthorizationError("Geen toegang tot deze franchise-resource.", 403);
  }
}

/** Predicaat: hoort de entiteit bij de tenant van de actor (of is de actor ADMIN)? */
export function ownsViaTenant(
  actor: Actor | null | undefined,
  entityTenantId: string | null | undefined,
): boolean {
  if (actor?.role === "ADMIN") return true;
  return hasTenant(actor) && actor.tenantId === entityTenantId;
}

/**
 * Mag deze viewer een aan een tenant gebonden profiel/entiteit zien? Een entiteit zonder tenant
 * (`tenantId` null) is niet tenant-afgeschermd → true (overige zichtbaarheidsregels, zoals
 * visibility==PUBLIC, gelden daar los van). Anders alleen de eigenaar, een ADMIN, of iemand binnen
 * dezelfde tenant — sluit cross-tenant én onauthenticated inzage uit, consistent met
 * visibleFreelancersWhere. Pure functie.
 */
export function tenantEntityVisibleTo(
  viewer: Actor | null | undefined,
  entityTenantId: string | null | undefined,
  ownerUserId: string,
): boolean {
  if (!entityTenantId) return true;
  if (viewer?.id === ownerUserId) return true;
  return ownsViaTenant(viewer, entityTenantId);
}

/**
 * Where-fragment voor zichtbare opdrachten/diensten bij browse + matching ("gesloten per tenant").
 * - ADMIN: `{}` (alles)
 * - tenant-gebonden gebruiker: alleen diensten van de eigen tenant
 * - directe gebruiker: alleen platform-opdrachten (`tenantId = null`)
 * AND dit fragment in de bestaande gepubliceerde-opdrachten-query.
 */
/**
 * Where-fragment voor een gegeven tenant-context (gesloten per tenant + overflow). Een franchise
 * kan haar onvervulde (= nog gepubliceerde) diensten openstellen voor het hele platform
 * (`Tenant.openOverflow`); die zijn dan voor iedere ZZP'er zichtbaar, náást de eigen scope.
 */
export function visibleJobsWhereForTenant(tenantId: string | null): Prisma.JobWhereInput {
  const overflow: Prisma.JobWhereInput = { tenant: { is: { openOverflow: true } } };
  return tenantId ? { OR: [{ tenantId }, overflow] } : { OR: [{ tenantId: null }, overflow] };
}

/**
 * Where-fragment voor zichtbare opdrachten/diensten bij browse + matching.
 * - ADMIN: `{}` (alles)
 * - tenant-gebonden gebruiker: eigen tenant + overflow-diensten van andere franchises
 * - directe gebruiker: platform-opdrachten (tenantId null) + overflow-diensten
 * AND dit fragment in de bestaande gepubliceerde-opdrachten-query.
 */
export function visibleJobsWhere(actor: Actor | null | undefined): Prisma.JobWhereInput {
  if (actor?.role === "ADMIN") return {};
  return visibleJobsWhereForTenant(hasTenant(actor) ? actor.tenantId : null);
}

/**
 * Mag deze (niet-eigenaar, niet-admin) actor dit dienst-detail zien? Eigen tenant-match of
 * een opengestelde (overflow) dienst. Spiegelt visibleJobsWhere voor de detailpagina.
 */
export function canViewJob(
  actor: Actor | null | undefined,
  job: { tenantId: string | null; tenant?: { openOverflow: boolean } | null },
): boolean {
  if (actor?.role === "ADMIN") return true;
  const own = (actor?.tenantId ?? null) === job.tenantId;
  return own || !!job.tenant?.openOverflow;
}

/**
 * Where-fragment voor zichtbare ZZP'ers bij browse + suggesties — de omgekeerde richting van
 * visibleJobsWhere, voor een opdrachtgever die ZZP'ers bekijkt ("gesloten per tenant").
 * - ADMIN: `{}` (alle)
 * - tenant-opdrachtgever: alleen de eigen franchise-roster
 * - directe opdrachtgever: alleen niet-tenant ZZP'ers (`tenantId = null`)
 */
export function visibleFreelancersWhere(actor: Actor | null | undefined): {
  tenantId?: string | null;
} {
  if (actor?.role === "ADMIN") return {};
  if (hasTenant(actor)) return { tenantId: actor.tenantId };
  return { tenantId: null };
}
