import { z } from "zod";
import { type ModelAgreementContent } from "@/lib/contract-agreement";

export const SIGNING_CONSENT_VERSION = "handslag-electronic-signature-v1";
export const SIGNING_CONSENT =
  "Ik heb de overeenkomst gelezen en onderteken deze documentversie elektronisch met mijn naam.";
export const SIGNING_METHOD_NOTE =
  "Gewone elektronische handtekening via je account, met een extra wachtwoordcontrole. " +
  "Dit is geen geavanceerde of gekwalificeerde elektronische handtekening. De vereiste " +
  "betrouwbaarheid hangt af van de overeenkomst en de omstandigheden.";

export const signingInputSchema = z.object({
  documentHash: z.string().regex(/^[a-f0-9]{64}$/, "Open de overeenkomst opnieuw."),
  signerName: z
    .string()
    .trim()
    .min(2, "Vul je volledige naam in.")
    .max(120)
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Vul een geldige naam in."),
  password: z.string().min(1, "Vul je wachtwoord in.").max(256),
  reviewed: z.literal("on", {
    errorMap: () => ({ message: "Bevestig dat je de overeenkomst hebt gelezen." }),
  }),
  consent: z.literal("on", {
    errorMap: () => ({ message: "Bevestig dat je deze versie wilt ondertekenen." }),
  }),
  authority: z.literal("on", {
    errorMap: () => ({ message: "Bevestig dat je bevoegd bent om te tekenen." }),
  }),
});

export interface SigningDocument {
  version: 1;
  collaborationId: string;
  freelancer: { userId: string; name: string };
  client: { userId: string; name: string };
  jobTitle: string;
  rateLabel: string;
  periodLabel: string;
  content: ModelAgreementContent;
  consent: string;
  consentVersion: string;
  signatureMethod: string;
}

export function signingParty(actorId: string, document: SigningDocument) {
  // Eén account kan nooit beide partijen vertegenwoordigen in dezelfde ondertekening.
  if (document.freelancer.userId === document.client.userId) return null;
  if (actorId === document.freelancer.userId) return "FREELANCER" as const;
  if (actorId === document.client.userId) return "CLIENT" as const;
  return null;
}

export function signingPath(id: string) {
  return `/samenwerkingen/${encodeURIComponent(id)}/ondertekenen`;
}
export class SigningEvidenceErasedError extends Error {
  constructor() {
    super(
      "Ondertekenbewijs verwijderd na een beoordeeld verwijderverzoek. Er wordt geen vervangend origineel aangemaakt.",
    );
    this.name = "SigningEvidenceErasedError";
  }
}
