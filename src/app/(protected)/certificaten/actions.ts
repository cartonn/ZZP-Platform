"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";
import { assertTransition, TransitionError } from "@/lib/credentials";
import { documentKindForCredential } from "@/lib/documents";
import { getDiplomaVerifier } from "@/lib/services/diploma-verifier";
import { getBigVerifier } from "@/lib/services/big-verifier";
import { credentialVerifyRateLimiter } from "@/lib/rate-limit";
import {
  assertContentMatchesMime,
  generateStorageKey,
  getStorage,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";
import { type CredentialStatus, type CredentialType, type Visibility } from "@/lib/enums";
import { credentialSchema } from "@/lib/validation";

export type CredentialState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

async function requireProfile(actorId: string) {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actorId },
    select: { id: true },
  });
  if (!profile) throw new Error("Maak eerst je profiel aan.");
  return profile;
}

async function loadOwnedCredential(profileId: string, credentialId: string) {
  const credential = await prisma.credential.findUnique({ where: { id: credentialId } });
  if (!credential || credential.freelancerProfileId !== profileId) {
    throw new Error("Credential niet gevonden.");
  }
  return credential;
}

/** Valideert + schrijft het bewijsstuk naar storage en geeft de Document-create-payload terug. */
async function putBlob(ownerId: string, type: CredentialType, file: File) {
  validateUpload({ filename: file.name, mimeType: file.type, size: file.size });
  const buffer = Buffer.from(await file.arrayBuffer());
  assertContentMatchesMime(buffer, file.type);
  const key = generateStorageKey(file.name);
  await getStorage().put(key, buffer, file.type);
  return {
    ownerId,
    kind: documentKindForCredential(type),
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    storageKey: key,
  };
}

async function deleteDocumentById(actorId: string, documentId: string | null) {
  if (!documentId) return;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { storageKey: true },
  });
  if (!doc) return;
  await prisma.document.delete({ where: { id: documentId } });
  await getStorage()
    .delete(doc.storageKey)
    .catch((err) =>
      console.error("[certificaten] storage-opruiming mislukt voor key", doc.storageKey, err),
    );
  // Verwijderen van een (gevoelig) document is een audit-waardige gebeurtenis, ook als het via de
  // credential-levenscyclus loopt (CLAUDE.md regel 5).
  await audit({
    actorId,
    action: "DOCUMENT_DELETED",
    entityType: "Document",
    entityId: documentId,
  });
}

/**
 * Kern van het opslaan/(her)indienen van een credential — gedeeld door de standalone
 * /certificaten-pagina (saveCredential, met redirect) en het Actiecentrum (saveCredentialInline,
 * zonder redirect). Geeft een fout-state terug bij een probleem, of `undefined` bij succes.
 */
async function persistCredential(formData: FormData): Promise<CredentialState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const profile = await requireProfile(actor.id);

  const parsed = credentialSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    issuer: formData.get("issuer") || undefined,
    issuedAt: formData.get("issuedAt") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;
  const fields = {
    type: data.type,
    title: data.title,
    issuer: data.issuer ?? null,
    issuedAt: data.issuedAt ?? null,
    expiresAt: data.expiresAt ?? null,
    visibility: data.visibility,
  };

  const credentialId = (formData.get("credentialId") as string) || null;
  const file = formData.get("document");
  const hasFile = file instanceof File && file.size > 0;

  try {
    if (credentialId) {
      const credential = await loadOwnedCredential(profile.id, credentialId);
      const status = credential.status as CredentialStatus;

      if (hasFile) {
        // Een reeds beoordeelde credential (VERIFIED/REJECTED/EXPIRED) moet na een nieuw
        // bewijsstuk terug naar beoordeling. DRAFT blijft DRAFT; SUBMITTED blijft in review.
        const resubmit = status !== "DRAFT" && status !== "SUBMITTED";
        if (resubmit) assertTransition(status, "SUBMITTED");

        const docData = await putBlob(actor.id, data.type, file);
        const previousDocumentId = credential.documentId;
        await prisma.$transaction(async (tx) => {
          const doc = await tx.document.create({ data: docData });
          await tx.credential.update({
            where: { id: credentialId },
            data: {
              ...fields,
              documentId: doc.id,
              ...(resubmit
                ? { status: "SUBMITTED", rejectionReason: null, submittedAt: new Date() }
                : {}),
            },
          });
          if (resubmit) await tx.verificationRequest.create({ data: { credentialId } });
        });
        await deleteDocumentById(actor.id, previousDocumentId);
      } else {
        // Geen nieuw bewijsstuk. Wijzigt de ZZP'er verificatie-relevante feiten (type/titel/uitgever/
        // datums) van een al geverifieerd of verlopen certificaat, dan vervalt de verificatie en gaat
        // het terug naar beoordeling — anders kon men de vervaldatum vooruitzetten (expiry-bypass) of
        // het type omkatten met behoud van de VERIFIED-badge. Alleen de zichtbaarheid wijzigen raakt
        // de verificatie niet.
        const sameDate = (a: Date | null, b: Date | null) =>
          (a ? a.getTime() : null) === (b ? b.getTime() : null);
        const factsChanged =
          fields.type !== credential.type ||
          (fields.title ?? "") !== (credential.title ?? "") ||
          (fields.issuer ?? null) !== (credential.issuer ?? null) ||
          !sameDate(fields.issuedAt, credential.issuedAt) ||
          !sameDate(fields.expiresAt, credential.expiresAt);
        const reverify = (status === "VERIFIED" || status === "EXPIRED") && factsChanged;
        if (reverify) {
          assertTransition(status, "SUBMITTED");
          await prisma.$transaction(async (tx) => {
            await tx.credential.update({
              where: { id: credentialId },
              data: {
                ...fields,
                status: "SUBMITTED",
                rejectionReason: null,
                submittedAt: new Date(),
              },
            });
            await tx.verificationRequest.create({ data: { credentialId } });
          });
        } else {
          await prisma.credential.update({ where: { id: credentialId }, data: fields });
        }
      }
      await audit({
        actorId: actor.id,
        action: "CREDENTIAL_UPDATED",
        entityType: "Credential",
        entityId: credentialId,
      });
    } else {
      if (!hasFile) return { fieldErrors: { document: "Een bewijsstuk is verplicht." } };
      const docData = await putBlob(actor.id, data.type, file);
      // Document + credential atomair: nested create voorkomt een verweesd Document-record.
      const created = await prisma.credential.create({
        data: {
          ...fields,
          status: "DRAFT",
          freelancerProfile: { connect: { id: profile.id } },
          document: { create: docData },
        },
      });
      await audit({
        actorId: actor.id,
        action: "CREDENTIAL_CREATED",
        entityType: "Credential",
        entityId: created.id,
      });
    }
  } catch (e) {
    if (e instanceof UploadValidationError) return { fieldErrors: { document: e.message } };
    if (e instanceof TransitionError) return { error: e.message };
    throw e;
  }

  return undefined; // succes
}

/** Standalone /certificaten-pagina: opslaan en terug naar het overzicht. */
export async function saveCredential(
  _prev: CredentialState,
  formData: FormData,
): Promise<CredentialState> {
  const result = await persistCredential(formData);
  if (result) return result;
  revalidatePath("/certificaten");
  redirect("/certificaten");
}

/**
 * Actiecentrum-variant: zelfde mutatie, maar zonder redirect — geeft { ok: true } terug zodat de
 * drawer kan sluiten en doorvloeien, en revalideert /acties zodat de afgehandelde taak verdwijnt.
 */
export async function saveCredentialInline(
  _prev: CredentialState,
  formData: FormData,
): Promise<CredentialState> {
  const result = await persistCredential(formData);
  if (result) return result;
  revalidatePath("/certificaten");
  revalidatePath("/acties");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function requestVerification(credentialId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);

  if (!credential.documentId) throw new Error("Upload eerst een bewijsstuk.");
  const status = credential.status as CredentialStatus;
  // VERIFIED->SUBMITTED is alleen bedoeld bij document-vervangen, niet als losse aanvraag.
  if (status === "VERIFIED") throw new Error("Dit certificaat is al geverifieerd.");
  try {
    assertTransition(status, "SUBMITTED");
  } catch (e) {
    if (e instanceof TransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction([
    prisma.credential.update({
      where: { id: credentialId },
      data: { status: "SUBMITTED", rejectionReason: null, submittedAt: new Date() },
    }),
    prisma.verificationRequest.create({ data: { credentialId } }),
  ]);
  await audit({
    actorId: actor.id,
    action: "CREDENTIAL_SUBMITTED",
    entityType: "Credential",
    entityId: credentialId,
    metadata: { from: status, to: "SUBMITTED" },
  });
  revalidatePath("/certificaten");
}

export async function toggleCredentialVisibility(credentialId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);

  const next: Visibility =
    (credential.visibility as Visibility) === "PUBLIC" ? "PRIVATE" : "PUBLIC";
  await prisma.credential.update({ where: { id: credentialId }, data: { visibility: next } });
  await audit({
    actorId: actor.id,
    action: "CREDENTIAL_VISIBILITY_CHANGED",
    entityType: "Credential",
    entityId: credentialId,
    metadata: { visibility: next },
  });
  revalidatePath("/certificaten");
}

/**
 * Deel/ontdeel dit certificaat met opdrachtgevers in lopende samenwerkingen. Deelt alleen de
 * METADATA (type/titel/uitgever/verificatiedatum) — nooit het bestand. Ge-audit; alleen de eigenaar.
 */
export async function toggleCredentialSharing(credentialId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);

  const next = !credential.sharedWithClient;
  await prisma.credential.update({
    where: { id: credentialId },
    data: { sharedWithClient: next },
  });
  await audit({
    actorId: actor.id,
    action: "CREDENTIAL_SHARING_CHANGED",
    entityType: "Credential",
    entityId: credentialId,
    metadata: { sharedWithClient: next },
  });
  revalidatePath("/certificaten");
}

export async function deleteCredential(credentialId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);

  await prisma.credential.delete({ where: { id: credentialId } });
  await deleteDocumentById(actor.id, credential.documentId);
  await audit({
    actorId: actor.id,
    action: "CREDENTIAL_DELETED",
    entityType: "Credential",
    entityId: credentialId,
  });
  revalidatePath("/certificaten");
}

export type ExternalVerifyState = { ok?: true; error?: string } | undefined;
export type DuoVerifyState = ExternalVerifyState;

/** Gedeeld: zet een credential systeem-geverifieerd (bron DUO/BIG) via de transitiemap. */
async function applyExternalVerification(opts: {
  actorId: string;
  credentialId: string;
  fromStatus: CredentialStatus;
  source: "DUO" | "BIG";
  reason: string;
}): Promise<ExternalVerifyState> {
  try {
    if (opts.fromStatus !== "SUBMITTED") assertTransition(opts.fromStatus, "SUBMITTED");
    assertTransition("SUBMITTED", "VERIFIED");
  } catch (e) {
    if (e instanceof TransitionError) return { error: e.message };
    throw e;
  }
  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.credential.update({
      where: { id: opts.credentialId },
      data: { status: "VERIFIED", verifiedAt: new Date(), rejectionReason: null },
    }),
    prisma.credentialVerification.create({
      data: {
        credentialId: opts.credentialId,
        verifierId: null,
        source: opts.source,
        decision: "VERIFIED",
        reason: opts.reason,
      },
    }),
    prisma.verificationRequest.updateMany({
      where: { credentialId: opts.credentialId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId,
        action: "CREDENTIAL_VERIFIED",
        entityType: "Credential",
        entityId: opts.credentialId,
        metadata: { source: opts.source },
        ...meta,
      }),
    }),
  ]);
  revalidatePath("/certificaten");
  return { ok: true };
}

/** Verifieer een diploma via de DUO-koppeling (verificatiecode uit het DUO-diplomaregister). */
export async function verifyCredentialViaDuo(
  credentialId: string,
  _prev: DuoVerifyState,
  formData: FormData,
): Promise<DuoVerifyState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  // Anti-brute-force: zelf-verificatie zet direct op VERIFIED zonder admin; begrens het gokken van
  // een DUO-code/BIG-nummer (gedeelde budget met BIG, per ZZP'er per uur).
  if (!(await credentialVerifyRateLimiter.check(`verify:${actor.id}`)).allowed) {
    return { error: "Te veel verificatiepogingen. Probeer het later opnieuw." };
  }
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);
  const status = credential.status as CredentialStatus;
  if (status === "VERIFIED") return { error: "Dit certificaat is al geverifieerd." };
  // Server-side typecontrole (CLAUDE.md regel 1): de UI toont dit formulier alleen bij een diploma,
  // maar de actie is direct aanroepbaar. Zonder deze guard kon men een willekeurig type via DUO
  // verifiëren en zo de admin-beoordeling omzeilen.
  if (credential.type !== "DIPLOMA")
    return { error: "DUO-verificatie geldt alleen voor een diploma." };

  const code = String(formData.get("verificationCode") ?? "").trim();
  if (!code) return { error: "Voer een DUO-verificatiecode in." };

  const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { name: true } });
  let result;
  try {
    result = await getDiplomaVerifier().verify({
      verificationCode: code,
      holderName: user?.name ?? "",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Verificatie mislukt." };
  }
  if (!result.verified) return { error: result.message };

  return applyExternalVerification({
    actorId: actor.id,
    credentialId,
    fromStatus: status,
    source: "DUO",
    reason: `DUO-verificatie (${result.source}): ${result.message}`,
  });
}

/** Verifieer een beroepsregistratie via het BIG-register (BIG-nummer). Geldt voor type Licentie. */
export async function verifyCredentialViaBig(
  credentialId: string,
  _prev: ExternalVerifyState,
  formData: FormData,
): Promise<ExternalVerifyState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  // Anti-brute-force: zelf-verificatie zet direct op VERIFIED zonder admin; begrens het gokken van
  // een BIG-nummer/DUO-code (gedeelde budget met DUO, per ZZP'er per uur).
  if (!(await credentialVerifyRateLimiter.check(`verify:${actor.id}`)).allowed) {
    return { error: "Te veel verificatiepogingen. Probeer het later opnieuw." };
  }
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);
  const status = credential.status as CredentialStatus;
  if (status === "VERIFIED") return { error: "Dit certificaat is al geverifieerd." };
  // Server-side typecontrole (CLAUDE.md regel 1): BIG-verificatie geldt alleen voor een
  // beroepsregistratie (licentie). De UI verbergt dit formulier voor andere types, maar de actie is
  // direct aanroepbaar — zonder guard kon men elk type via BIG verifiëren en de admin-queue omzeilen.
  if (credential.type !== "LICENSE")
    return { error: "BIG-verificatie geldt alleen voor een beroepsregistratie (licentie)." };

  const bigNumber = String(formData.get("bigNumber") ?? "").trim();
  if (!bigNumber) return { error: "Voer een BIG-nummer in." };

  const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { name: true } });
  let result;
  try {
    result = await getBigVerifier().verify({ bigNumber, holderName: user?.name ?? "" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Verificatie mislukt." };
  }
  if (!result.verified) return { error: result.message };

  return applyExternalVerification({
    actorId: actor.id,
    credentialId,
    fromStatus: status,
    source: "BIG",
    reason: `BIG-registerverificatie (${result.source}): ${result.message}`,
  });
}
