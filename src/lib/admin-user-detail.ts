// Read-only dossier voor de ADMIN-gebruikersdetailpagina. Bundelt de context die een beheerder nodig
// heeft bij een signaal (bv. een afgekeurd certificaat of no-show): rol/status, certificaten,
// samenwerkingen, no-show-teller en de laatste auditregels van/over deze gebruiker. Alleen lezen —
// de mutaties (schorsen/anonimiseren) lopen via de bestaande server-actions. Scoping op één userId.

import { prisma } from "@/lib/db";

/** Hoeveel auditregels het dossier toont (laatste N van/over de gebruiker). */
export const USER_DOSSIER_AUDIT_LIMIT = 20;

/**
 * Bouwt de audit-`where` voor het dossier: alle regels die de gebruiker als actor schreef óf die de
 * gebruiker als subject (entityType User, entityId = userId) betreffen. Pure functie — geen I/O, zodat
 * de scoping-conventie ("van én over deze gebruiker") apart getest kan worden.
 */
export function userDossierAuditWhere(userId: string) {
  return {
    OR: [{ actorId: userId }, { entityType: "User", entityId: userId }],
  };
}

/**
 * Laadt het volledige dossier voor één gebruiker, of `null` als de gebruiker niet bestaat.
 * FREELANCER-specifieke gegevens (certificaten, no-show-teller) worden alleen geladen als er een
 * ZZP-profiel is. Read-only; geen mutaties.
 */
export async function loadUserDossier(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      deletionRequestedAt: true,
      anonymizedAt: true,
      identityVerifiedAt: true,
      freelancerProfile: { select: { id: true } },
      company: { select: { id: true } },
    },
  });
  if (!user) return null;

  const profileId = user.freelancerProfile?.id ?? null;
  const companyId = user.company?.id ?? null;

  const [credentials, unjustifiedNoShows, collaborations, auditEntries] = await Promise.all([
    profileId
      ? prisma.credential.findMany({
          where: { freelancerProfileId: profileId },
          orderBy: { updatedAt: "desc" },
          select: { id: true, type: true, title: true, status: true, expiresAt: true },
        })
      : Promise.resolve([]),
    profileId
      ? prisma.noShowReport.count({
          where: { freelancerProfileId: profileId, verdict: "UNJUSTIFIED" },
        })
      : Promise.resolve(0),
    prisma.collaboration.findMany({
      where: {
        status: "ACTIVE",
        ...(profileId && companyId
          ? { OR: [{ freelancerId: profileId }, { companyId }] }
          : profileId
            ? { freelancerId: profileId }
            : companyId
              ? { companyId }
              : { id: "__none__" }),
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        startDate: true,
        job: { select: { title: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: userDossierAuditWhere(userId),
      orderBy: { createdAt: "desc" },
      take: USER_DOSSIER_AUDIT_LIMIT,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
  ]);

  return { user, credentials, unjustifiedNoShows, collaborations, auditEntries };
}

export type UserDossier = NonNullable<Awaited<ReturnType<typeof loadUserDossier>>>;
