import { z } from "zod";

export const CREDENTIAL_REVIEW_METHODS = [
  "DIGITAL_VOG",
  "ORIGINAL_PAPER",
  "DUO_EXTRACT",
  "ISSUER",
] as const;
export type CredentialReviewMethod = (typeof CREDENTIAL_REVIEW_METHODS)[number];
const labels: Record<CredentialReviewMethod, string> = {
  DIGITAL_VOG: "Digitale VOG · handmatig gecontroleerd",
  ORIGINAL_PAPER: "Papieren origineel · persoonlijk gecontroleerd",
  DUO_EXTRACT: "DUO-uittreksel · handmatig gecontroleerd",
  ISSUER: "Uitgevende instantie · handmatig gecontroleerd",
};
export function credentialReviewMethodLabel(method: string | null | undefined): string {
  return labels[method as CredentialReviewMethod] ?? "Handmatige beoordeling";
}
export function credentialReviewMethods(type: string): CredentialReviewMethod[] {
  if (type === "VOG") return ["DIGITAL_VOG", "ORIGINAL_PAPER"];
  if (type === "DIPLOMA" || type === "CERTIFICATE") return ["DUO_EXTRACT", "ISSUER"];
  return ["ISSUER"];
}
export const REVIEW_CONFIRMATIONS = ["original", "person", "authenticity", "scope"] as const;
const snapshotSchema = z.object({
  updatedAt: z.string().datetime(),
  documentId: z.string().max(100),
});
export function parseCredentialReviewSnapshot(form: FormData) {
  if (!(form instanceof FormData)) throw new Error("Open de aanvraag opnieuw voordat je beslist.");
  const parsed = snapshotSchema.safeParse({
    updatedAt: form.get("updatedAt"),
    documentId: form.get("documentId"),
  });
  if (!parsed.success) throw new Error("Open de aanvraag opnieuw voordat je beslist.");
  return parsed.data;
}
export function parseCredentialReview(
  form: FormData,
  credential: {
    type: string;
    updatedAt: Date;
    documentId: string | null;
    document: { mimeType: string; ownerId: string } | null;
    freelancerProfile: { userId: string };
    issuedAt: Date | null;
    expiresAt: Date | null;
  },
  now: Date,
) {
  const snapshot = parseCredentialReviewSnapshot(form);
  if (
    snapshot.updatedAt !== credential.updatedAt.toISOString() ||
    snapshot.documentId !== (credential.documentId ?? "")
  )
    throw new Error("De aanvraag is gewijzigd. Open het actuele bewijsstuk en beoordeel opnieuw.");
  if (!credential.document || credential.document.ownerId !== credential.freelancerProfile.userId)
    throw new Error("Een geldig privébewijsstuk ontbreekt. Vraag eerst een nieuw document.");
  if (credential.issuedAt && credential.issuedAt > now)
    throw new Error("De uitgiftedatum ligt in de toekomst. Laat deze eerst corrigeren.");
  if (credential.expiresAt && credential.expiresAt <= now)
    throw new Error(
      credential.type === "VOG"
        ? "De herbeoordelingsdatum is bereikt. Vraag een nieuwe beoordeling met een actueel bewijsstuk."
        : "Dit bewijsstuk is verlopen. Vraag eerst een geldig document.",
    );
  const method = z.enum(CREDENTIAL_REVIEW_METHODS).safeParse(form.get("reviewMethod"));
  if (!method.success || !credentialReviewMethods(credential.type).includes(method.data))
    throw new Error("Kies een passende controlemethode.");
  if (
    (method.data === "DIGITAL_VOG" || method.data === "DUO_EXTRACT") &&
    credential.document.mimeType !== "application/pdf"
  )
    throw new Error(
      "Voor deze controle is het originele PDF-bestand nodig; een foto of scan volstaat niet.",
    );
  const confirmations = REVIEW_CONFIRMATIONS.filter((key) => form.get(key) === "on");
  if (confirmations.length !== REVIEW_CONFIRMATIONS.length)
    throw new Error("Voer alle vier controles uit en bevestig de uitkomst voordat je goedkeurt.");
  const note = z
    .string()
    .trim()
    .max(300)
    .safeParse(form.get("reviewNote") ?? "");
  if (!note.success) throw new Error("Houd de controletoelichting kort: maximaal 300 tekens.");
  if (/\b\d[\d .-]{6,}\d\b/.test(note.data))
    throw new Error(
      "Neem geen BSN, documentnummer of andere persoonsnummers op in de toelichting.",
    );
  return {
    method: method.data,
    evidence: {
      version: 1,
      method: method.data,
      confirmations,
      note: note.data || null,
      documentId: credential.documentId,
      credentialUpdatedAt: snapshot.updatedAt,
      checkedAt: now.toISOString(),
    },
  };
}
