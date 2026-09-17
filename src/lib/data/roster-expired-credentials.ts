import type { Prisma } from "@prisma/client";
import { CREDENTIAL_TYPES } from "@/lib/enums";
import { MANDATORY_CREDENTIAL_TYPES } from "@/lib/mandatory-documents";

/** Exclude covered history in the database, before the shared candidate limit. */
export function rosterExpiredCredentialWhere(
  tenantId: string,
  now: Date,
): Prisma.CredentialWhereInput {
  return {
    freelancerProfile: { tenantId },
    type: { notIn: [...MANDATORY_CREDENTIAL_TYPES] },
    OR: [{ status: "EXPIRED" }, { status: "VERIFIED", expiresAt: { lte: now } }],
    // A replacement only covers its own type on this same profile. Enumerating the
    // supported types keeps this relation predicate portable across SQLite/Postgres.
    NOT: CREDENTIAL_TYPES.map((type) => ({
      type,
      freelancerProfile: {
        credentials: {
          some: {
            type,
            status: "VERIFIED",
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    })),
  };
}
