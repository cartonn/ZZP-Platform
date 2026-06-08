// Door de ZZP'er met de opdrachtgever GEDEELDE certificaten binnen een samenwerking. Toont alleen
// METADATA (type/titel/uitgever/verificatiedatum) — NOOIT het privébestand zelf; het document blijft
// achter canAccessDocument (alleen eigenaar/ADMIN). Server-side waarheid: alleen de opdrachtgever-
// partij van DEZE samenwerking ziet de stukken, en alleen geldig-geverifieerde, gedeelde certificaten.

import { prisma } from "@/lib/db";
import { type CredentialType } from "@/lib/enums";

export interface SharedCredential {
  id: string;
  type: CredentialType;
  title: string;
  issuer: string | null;
  verifiedAt: Date | null;
}

interface ShareableInput {
  status: string;
  sharedWithClient: boolean;
  expiresAt: Date | null;
}

/** Mag dit certificaat nu aan de opdrachtgever getoond worden? Gedeeld, geverifieerd én niet verlopen. */
export function isCredentialShareableNow(c: ShareableInput, now: Date): boolean {
  if (!c.sharedWithClient || c.status !== "VERIFIED") return false;
  return c.expiresAt == null || c.expiresAt > now;
}

/**
 * De gedeelde certificaten van de ZZP'er voor een samenwerking, gezien door de opdrachtgever. Geeft
 * een lege lijst als de viewer niet de opdrachtgever-partij van deze samenwerking is (geen lek).
 */
export async function getSharedCredentialsForClient(
  collaborationId: string,
  viewerUserId: string,
  now: Date = new Date(),
): Promise<SharedCredential[]> {
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { freelancerId: true, company: { select: { userId: true } } },
  });
  if (!col || col.company.userId !== viewerUserId) return []; // alleen de opdrachtgever-partij

  const creds = await prisma.credential.findMany({
    where: { freelancerProfileId: col.freelancerId, sharedWithClient: true, status: "VERIFIED" },
    orderBy: { type: "asc" },
    select: { id: true, type: true, title: true, issuer: true, verifiedAt: true, expiresAt: true },
  });

  // De query filtert al op sharedWithClient + VERIFIED; hier alleen nog live de verlopen eruit.
  return creds
    .filter((c) => c.expiresAt == null || c.expiresAt > now)
    .map((c) => ({
      id: c.id,
      type: c.type as CredentialType,
      title: c.title,
      issuer: c.issuer,
      verifiedAt: c.verifiedAt,
    }));
}
