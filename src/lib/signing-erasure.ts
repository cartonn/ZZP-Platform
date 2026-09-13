import { z } from "zod";

// A structured, explicit admin decision avoids putting new free-text personal data in the audit.
export const SIGNING_ERASURE_REASONS = {
  NO_REMAINING_NECESSITY: "Geen resterende noodzaak om het gezamenlijke bewijs te bewaren",
  RETENTION_PERIOD_ENDED: "De beoordeelde bewaartermijn is verstreken",
} as const;

const decisionSchema = z.object({
  eraseContractEvidence: z.literal("on"),
  evidenceErasureReason: z.enum(["NO_REMAINING_NECESSITY", "RETENTION_PERIOD_ENDED"]),
});

export function signingErasureDecision(formData?: FormData) {
  const result = decisionSchema.safeParse({
    eraseContractEvidence: formData?.get("eraseContractEvidence"),
    evidenceErasureReason: formData?.get("evidenceErasureReason"),
  });
  if (!result.success) {
    throw new Error(
      "Er is gezamenlijk ondertekenbewijs. Beoordeel eerst de bewaarbehoefte en de rechten van beide partijen, kies een reden en bevestig de verwijdering van het bewijs. Het verwijderverzoek blijft open.",
    );
  }
  return result.data.evidenceErasureReason;
}

export function signingEvidenceParticipantWhere(userId: string) {
  return {
    OR: [{ freelancer: { userId } }, { company: { userId } }],
  };
}
