import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CREDENTIAL_TYPES } from "@/lib/enums";

/** Types covered beyond this window must not consume upcoming-alert candidate slots. */
export function rosterExpiringCredentialWhere(
  tenantId: string,
  now: Date,
  soon: Date,
): Prisma.CredentialWhereInput {
  return {
    freelancerProfile: { tenantId },
    status: "VERIFIED",
    expiresAt: { gt: now, lte: soon },
    // A same-profile/type replacement inside the window still needs a reminder.
    // The dossier helper below the query picks its latest relevant certificate.
    NOT: CREDENTIAL_TYPES.map((type) => ({
      type,
      freelancerProfile: {
        credentials: {
          some: {
            type,
            status: "VERIFIED",
            OR: [{ expiresAt: null }, { expiresAt: { gt: soon } }],
          },
        },
      },
    })),
  };
}

/** Limit effective profile/type groups, not superseded rows within the window. */
export function rosterExpiringCredentialCandidates(
  tenantId: string,
  now: Date,
  soon: Date,
  limit: number,
) {
  return prisma.credential.groupBy({
    by: ["freelancerProfileId", "type"],
    where: rosterExpiringCredentialWhere(tenantId, now, soon),
    _max: { expiresAt: true },
    orderBy: [{ _max: { expiresAt: "asc" } }, { freelancerProfileId: "asc" }, { type: "asc" }],
    take: limit,
  });
}
