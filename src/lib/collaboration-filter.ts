/**
 * Pure filter-/zoeklogica voor het admin-samenwerkingenoverzicht (`/admin/samenwerkingen`).
 *
 * Leaf-module zonder server- of prisma-imports zodat ze los testbaar is. Het paneel haalt de
 * samenwerkingen op, verrijkt ze tot {@link FilterableCollaboration} (status + DBA-niveau + namen)
 * en filtert ze hiermee. Server-side waarheid: het filter beslist niets — het toont alleen een
 * deelverzameling van wat de admin al mag zien.
 */

export const COLLAB_STATUS_VALUES = ["PROPOSED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type CollabStatus = (typeof COLLAB_STATUS_VALUES)[number];

export const COLLAB_DBA_VALUES = ["LAAG", "VERHOOGD", "HOOG"] as const;
export type CollabDba = (typeof COLLAB_DBA_VALUES)[number];

/** Het geparste filter; `null` betekent "deze dimensie niet filteren". */
export interface CollaborationFilter {
  status: CollabStatus | null;
  dba: CollabDba | null;
  q: string;
}

/** Minimale vorm waarop het filter werkt; het paneel levert deze velden aan. */
export interface FilterableCollaboration {
  status: string;
  dbaLevel: string;
  jobTitle: string;
  companyName: string;
  freelancerName: string;
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Leest het filter uit de (genormaliseerde) searchParams; onbekende waarden vallen weg naar `null`. */
export function parseCollaborationFilter(
  sp: Record<string, string | string[] | undefined>,
): CollaborationFilter {
  const statusRaw = first(sp.status).trim().toUpperCase();
  const dbaRaw = first(sp.dba).trim().toUpperCase();
  const status = (COLLAB_STATUS_VALUES as readonly string[]).includes(statusRaw)
    ? (statusRaw as CollabStatus)
    : null;
  const dba = (COLLAB_DBA_VALUES as readonly string[]).includes(dbaRaw)
    ? (dbaRaw as CollabDba)
    : null;
  return { status, dba, q: first(sp.q).trim() };
}

/** Of een samenwerking aan álle actieve filterdimensies voldoet (zoekt over opdracht + beide partijen). */
export function matchesCollaborationFilter(
  c: FilterableCollaboration,
  f: CollaborationFilter,
): boolean {
  if (f.status && c.status !== f.status) return false;
  if (f.dba && c.dbaLevel !== f.dba) return false;
  if (f.q) {
    const needle = f.q.toLowerCase();
    const haystack = `${c.jobTitle} ${c.companyName} ${c.freelancerName}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function filterCollaborations<T extends FilterableCollaboration>(
  items: T[],
  f: CollaborationFilter,
): T[] {
  return items.filter((c) => matchesCollaborationFilter(c, f));
}

/** Telling per status over de volledige (ongefilterde) set, plus het totaal. */
export function countByStatus(
  items: FilterableCollaboration[],
): Record<CollabStatus, number> & { all: number } {
  const counts = { all: items.length, PROPOSED: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const c of items) {
    if ((COLLAB_STATUS_VALUES as readonly string[]).includes(c.status)) {
      counts[c.status as CollabStatus] += 1;
    }
  }
  return counts;
}

/** Of er een actieve filterdimensie is (voor de "wis filter"-affordance / lege-staat-tekst). */
export function isCollaborationFilterActive(f: CollaborationFilter): boolean {
  return f.status !== null || f.dba !== null || f.q !== "";
}
