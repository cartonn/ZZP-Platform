import { prisma } from "@/lib/db";
import { rosterExpiringByProfile } from "@/lib/credentials";

/**
 * Bovengrens op de kandidaat-certscan — identiek aan `CASCADE_SCAN_LIMIT` in `signals.ts`
 * en de /acties-bron (`franchiseCredentialExpiryTask`, pending-tasks.ts), zodat het zegel-,
 * badge- en actiecentrum-oppervlak op grote tenants (>50 verlopende certificaten) exact
 * hetzelfde subset lezen en niet driften.
 */
export const ROSTER_EXPIRY_SCAN_LIMIT = 50;

export interface RosterExpirySummary {
  /** Aantal distincte tenant-ZZP'ers met minstens één niet-superseded (bijna-)verlopend cert. */
  profiles: number;
  /** Totaal aantal niet-superseded (bijna-)verlopende VERIFIED-certificaten over die ZZP'ers. */
  certs: number;
}

/**
 * Aggregeer per tenant hoeveel VERIFIED-certificaten binnenkort verlopen — in het venster
 * `(now, soon]` — met uitsluiting van superseded exemplaren (een nieuwer, nu-geldig cert van
 * hetzelfde type dat de compliance al draagt). Spiegelt exact de twee-staps, supersede-aware
 * aggregatie die de `/franchise/zzpers`-badge (`signals.ts`, #1026) en /acties
 * (`franchiserTasks`, pending-tasks.ts) gebruiken, zodat het dashboard-zegel niet
 * over-rapporteert t.o.v. die oppervlakken. Server-side, read-only.
 *
 * Stap 1: kandidaat-certificaten in het venster (gecapt/geordend zoals /acties) → hun profielen.
 * Stap 2: het VOLLEDIGE VERIFIED-dossier per kandidaat-profiel (ook langer-geldige/onbeperkte
 * dekkers) → `rosterExpiringByProfile` doet de supersede-uitsluiting binnen elk eigen dossier.
 */
export async function summarizeRosterExpiringSoon(
  tenantId: string,
  now: Date,
  soon: Date,
): Promise<RosterExpirySummary> {
  const expiringCreds = await prisma.credential.findMany({
    where: {
      freelancerProfile: { tenantId },
      status: "VERIFIED",
      expiresAt: { gte: now, lte: soon },
    },
    select: { freelancerProfileId: true },
    orderBy: { expiresAt: "asc" },
    take: ROSTER_EXPIRY_SCAN_LIMIT,
  });

  const candidateProfileIds = [...new Set(expiringCreds.map((c) => c.freelancerProfileId))];
  if (candidateProfileIds.length === 0) return { profiles: 0, certs: 0 };

  // unbounded-allow: certificaten van de reeds op ROSTER_EXPIRY_SCAN_LIMIT begrensde profielset
  const coverCreds = await prisma.credential.findMany({
    where: { status: "VERIFIED", freelancerProfileId: { in: candidateProfileIds } },
    select: { id: true, type: true, expiresAt: true, freelancerProfileId: true },
  });

  const entries = rosterExpiringByProfile(
    coverCreds.map((c) => ({
      id: c.id,
      type: c.type,
      status: "VERIFIED" as const,
      expiresAt: c.expiresAt,
      freelancerProfileId: c.freelancerProfileId,
      freelancerName: "",
    })),
    now,
    soon,
  );

  return {
    profiles: entries.length,
    certs: entries.reduce((sum, e) => sum + e.count, 0),
  };
}
