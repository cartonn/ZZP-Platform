// Data-laag voor de dóórlopende DBA-relatieduur: haalt per ZZP'er/opdrachtgever-paar alle relevante
// plaatsings-vensters (ACTIVE + COMPLETED) op, zodat `effectiveRelationshipStart` terug-op-terug
// inzetten kan overbruggen (substance-over-form, Wet DBA). PROPOSED/CANCELLED tellen niet mee — dat
// zijn geen gewerkte inzetten. Platform-breed (de DBA-monitor/-cockpit ziet alle tenants); gescoped
// op de meegegeven paren, die uit de lopende samenwerkingen komen (structureel klein). Server-side is
// de waarheid (CLAUDE.md regel 1).

import { prisma } from "@/lib/db";
import { type PlacementSpan } from "@/lib/dba-monitor";

export interface RelationshipPair {
  freelancerId: string;
  companyId: string;
}

/** Stabiele sleutel voor een ZZP'er/opdrachtgever-paar. */
export function relationshipPairKey(freelancerId: string, companyId: string): string {
  return `${freelancerId}|${companyId}`;
}

/**
 * Plaatsings-vensters (ACTIVE + COMPLETED) per paar, gesleuteld met `relationshipPairKey`.
 * Lege invoer → lege map (geen query).
 */
export async function loadRelationshipSpans(
  pairs: readonly RelationshipPair[],
): Promise<Map<string, PlacementSpan[]>> {
  const byKey = new Map<string, PlacementSpan[]>();
  if (pairs.length === 0) return byKey;

  const freelancerIds = [...new Set(pairs.map((p) => p.freelancerId))];
  const companyIds = [...new Set(pairs.map((p) => p.companyId))];
  const wanted = new Set(pairs.map((p) => relationshipPairKey(p.freelancerId, p.companyId)));

  // unbounded-allow: plaatsingen van een begrensde id-set (freelancers × opdrachtgevers uit de
  // lopende samenwerkingen); de cartesische over-fetch wordt hieronder tot de exacte paren gefilterd.
  const rows = await prisma.collaboration.findMany({
    where: {
      freelancerId: { in: freelancerIds },
      companyId: { in: companyIds },
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { freelancerId: true, companyId: true, startDate: true, endDate: true },
  });

  for (const r of rows) {
    const key = relationshipPairKey(r.freelancerId, r.companyId);
    if (!wanted.has(key)) continue; // filter de cartesische over-fetch (freelancers × companies) weg
    const list = byKey.get(key) ?? [];
    list.push({ start: r.startDate, end: r.endDate });
    byKey.set(key, list);
  }
  return byKey;
}
