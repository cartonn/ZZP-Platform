// Gedeelde bron voor de roster-inzetbaarheidsscan (bemiddelaar). Eén select-vorm + één evaluatie-
// functie voor BEIDE oppervlakken die een niet-inzetbaar (plaatsing-blokkerend, INACTIEF) roster-lid
// signaleren: de /acties-bron (`franchiseNotEngageableTask`, pending-tasks.ts) én de nav-badge
// (`rosterAlerts`, signals.ts). Zolang beide dezelfde helper gebruiken kan de niet-inzetbaar-telling
// per definitie niet driften — géén fragiele "houd de orderBy/take identiek"-invariant meer nodig.
//
// Bewust ONGEWINDOWD: de scan capte eerder op 50 (`id: asc`), waardoor een niet-inzetbaar roster-lid
// voorbij de 50e (op id-volgorde, niet urgentie-gecorreleerd) permanent buiten /acties, de badge én de
// dashboard-rail viel — de actie zelf (ontbrekend/verlopen verplicht document) bumpt geen venster, dus
// niet self-healing (persona-sweep run 81, DOEL 1b). De volledige tenant-roster wordt gescand: per
// tenant een beheerbaar aantal profielen (spiegelt de ongelimiteerde `company.findMany({ tenantId })`
// in dezelfde badge-berekening) en de select is licht (alleen de velden die `computeEngageability`
// nodig heeft). computeEngageability blijft de enige bron van waarheid voor de INACTIEF-bepaling.

import { type Availability } from "@/lib/enums";
import { computeEngageability, type EngageabilityResult } from "@/lib/engageability";
import { type FreelancerCredential } from "@/lib/matching";

/** Prisma-select die beide oppervlakken laden voor de inzetbaarheidsscan. `name` voedt de /acties-taak; de badge negeert 'm. */
export const ROSTER_ENGAGEABILITY_SELECT = {
  id: true,
  completeness: true,
  availability: true,
  user: { select: { name: true, identityVerifiedAt: true, lastLoginAt: true } },
  credentials: { select: { type: true, status: true, expiresAt: true } },
} as const;

/** Rij-vorm zoals geladen met `ROSTER_ENGAGEABILITY_SELECT`. */
export interface RosterEngageabilityRow {
  id: string;
  completeness: number;
  availability: string;
  user: {
    name: string | null;
    identityVerifiedAt: Date | null;
    lastLoginAt: Date | null;
  };
  credentials: { type: string; status: string; expiresAt: Date | null }[];
}

/**
 * Bepaalt de inzetbaarheidsstatus + uitleg voor één roster-rij via `computeEngageability` (de enige
 * bron van waarheid). Puur; geen I/O. Beide oppervlakken (badge + /acties) draaien exact deze functie,
 * zodat de niet-inzetbaar-telling nooit kan driften.
 */
export function evaluateRosterEngageability(
  row: RosterEngageabilityRow,
  now: Date,
): EngageabilityResult {
  return computeEngageability(
    {
      credentials: row.credentials.map((c) => ({
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      })),
      completeness: row.completeness,
      availability: row.availability as Availability,
      identityVerified: row.user.identityVerifiedAt != null,
      lastActiveAt: row.user.lastLoginAt ?? null,
    },
    now,
  );
}
