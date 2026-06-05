// Tenant-scoping (franchise-isolatie). Een Franchiser — en de opdrachtgevers + ZZP'ers die hij
// in het platform brengt — deelt één `tenantId`; een directe platformgebruiker heeft `tenantId = null`.
// Deze helpers leveren de Prisma-where-fragmenten + ownership-checks zodat de "gesloten per
// tenant"-regel (een tenant-dienst is alleen zichtbaar voor de eigen roster, en vice-versa) op
// één plek staat. ADMIN ziet alles. Pure functies — los unit-getest, geen DB/IO.

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
 * Where-fragment voor zichtbare opdrachten/diensten bij browse + matching ("gesloten per tenant").
 * - ADMIN: `{}` (alles)
 * - tenant-gebonden gebruiker: alleen diensten van de eigen tenant
 * - directe gebruiker: alleen platform-opdrachten (`tenantId = null`)
 * AND dit fragment in de bestaande gepubliceerde-opdrachten-query.
 */
export function visibleJobsWhere(actor: Actor | null | undefined): { tenantId?: string | null } {
  if (actor?.role === "ADMIN") return {};
  if (hasTenant(actor)) return { tenantId: actor.tenantId };
  return { tenantId: null };
}
