import { prisma } from "@/lib/db";
import { assertAuthenticated, type Actor } from "@/lib/authz";
import { CascadeError, assertParty } from "@/lib/cascade/commands-shared";

/** All new signatures require the guided review, explicit consent and password confirmation. */
export async function signContract(
  actor: Actor,
  collaborationId: string,
  formData?: FormData,
): Promise<void> {
  assertAuthenticated(actor);
  if (formData) {
    const { recordContractSignature } = await import("@/lib/signing-service");
    return recordContractSignature(actor, collaborationId, formData);
  }
  // Preserve anti-oracle ownership handling for older callers, but never activate without evidence.
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      disputedAt: true,
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  assertParty(actor, col.freelancer.userId, col.company.userId, "Samenwerking niet gevonden.");
  if (col.disputedAt)
    throw new CascadeError(
      "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.",
    );
  throw new CascadeError(
    "Lees de overeenkomst en bevestig je handtekening via de begeleide ondertekening.",
  );
}
