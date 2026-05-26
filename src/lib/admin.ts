// Admin-helpers: pure logica voor moderatie-guards en audit-logfilters. Server-side waarheid.

import { type UserStatus } from "@/lib/enums";

/** Een admin mag de eigen account niet modereren (geen self-schorsing/-degradatie). */
export function canModerateUser(actorId: string, targetUserId: string): boolean {
  return actorId !== targetUserId;
}

/** Schakelt schorsing om. Andere statussen (PENDING) gaan naar ACTIVE bij activeren. */
export function toggleSuspension(status: UserStatus): UserStatus {
  return status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
}

export const AUDIT_PAGE_SIZE = 25;

export interface AuditFilters {
  action?: string;
  entityType?: string;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function normalizeAuditFilters(params: RawParams): AuditFilters {
  const action = first(params.action)?.trim() || undefined;
  const entityType = first(params.entityType)?.trim() || undefined;
  const pageRaw = Number(first(params.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  return { action, entityType, page };
}
