import type { Prisma } from "@prisma/client";
import { AuthorizationError } from "@/lib/authz";

/** Must run in the same transaction as the document/credential write. */
export async function assertLiveDocumentOwner(tx: Prisma.TransactionClient, ownerId: string) {
  // A conditional parent write serializes with erasure's user update. A second read alone
  // would still allow erasure to finish between authorization and document creation.
  const liveOwner = await tx.user.updateMany({
    where: {
      id: ownerId,
      status: "ACTIVE",
      role: "FREELANCER",
      anonymizedAt: null,
      mustChangePassword: false,
      OR: [{ tenantId: null }, { tenant: { status: "ACTIVE" } }],
    },
    data: { status: "ACTIVE" },
  });
  if (liveOwner.count !== 1) {
    throw new AuthorizationError("Geen toegang tot documentupload.");
  }
}
