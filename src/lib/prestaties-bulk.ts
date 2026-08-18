// Groepeert de ingediende (SUBMITTED) prestaties per samenwerking, zodat de opdrachtgever ze in
// één keer kan goedkeuren i.p.v. elke urenstaat los op de samenwerkingspagina. Puur — geen DB.
// De daadwerkelijke goedkeuring loopt per prestatie door de bestaande `approvePerformance`-cascade
// (auth→rol→ownership→transitie→audit→dedupe); deze module bepaalt alleen wát er groepeerbaar is.

import type { PrestatieOverzicht } from "@/lib/prestaties";

/** Vanaf hoeveel ingediende prestaties in één samenwerking bulk-goedkeuren zinvol is. */
export const BULK_APPROVE_MIN = 2;

export interface BulkApproveGroup {
  collaborationId: string;
  jobTitle: string;
  freelancerName: string;
  /** Aantal ingediende prestaties in deze samenwerking. */
  count: number;
  /** Somtotaal van de bekende subtotalen (cents); prestaties zonder subtotaal tellen als 0. */
  totalCents: number;
  /** true zodra minstens één van de ingediende prestaties al ≥ staleDays wacht. */
  hasStale: boolean;
  /**
   * true zodra minstens één van de ingediende urenstaten een uren-uitschieter is (opvallend meer uren
   * dan gebruikelijk op deze samenwerking). Zo keurt de opdrachtgever een groep niet blind in één klik
   * goed zonder die urenstaat even te controleren. Zie `detectHoursAnomalies`.
   */
  hasAnomaly: boolean;
}

/**
 * Groepeert de ingediende prestaties per samenwerking en houdt alleen de groepen over met
 * ≥ `BULK_APPROVE_MIN` prestaties (bij één prestatie volstaat de bestaande "Keuren →"-link).
 * De volgorde: meeste wachtende urenstaten eerst, dan hoogste bedrag — de opdrachtgever ziet
 * bovenaan waar de meeste facturatie vastzit. Puur en deterministisch (geen klok-afhankelijke
 * sortering); de stale-vlag komt via `submittedAt` + geïnjecteerde `now` binnen.
 */
export function groupSubmittedForBulkApproval(
  prestaties: PrestatieOverzicht[],
  now: number,
  staleDays: number,
  anomalyIds: ReadonlySet<string> = new Set(),
): BulkApproveGroup[] {
  const staleMs = staleDays * 24 * 60 * 60 * 1000;
  const byCollab = new Map<string, BulkApproveGroup>();

  for (const p of prestaties) {
    if (p.status !== "SUBMITTED") continue;
    let group = byCollab.get(p.collaborationId);
    if (!group) {
      group = {
        collaborationId: p.collaborationId,
        jobTitle: p.jobTitle,
        freelancerName: p.freelancerName,
        count: 0,
        totalCents: 0,
        hasStale: false,
        hasAnomaly: false,
      };
      byCollab.set(p.collaborationId, group);
    }
    group.count += 1;
    group.totalCents += p.subtotalCents ?? 0;
    if (p.submittedAt && now - p.submittedAt.getTime() >= staleMs) {
      group.hasStale = true;
    }
    if (anomalyIds.has(p.id)) {
      group.hasAnomaly = true;
    }
  }

  return [...byCollab.values()]
    .filter((g) => g.count >= BULK_APPROVE_MIN)
    .sort((a, b) => b.count - a.count || b.totalCents - a.totalCents);
}
