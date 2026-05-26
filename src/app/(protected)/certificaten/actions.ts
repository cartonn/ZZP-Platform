"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertTransition, TransitionError } from "@/lib/credentials";
import { documentKindForCredential } from "@/lib/documents";
import {
  generateStorageKey,
  getStorage,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";
import { type CredentialStatus, type CredentialType, type Visibility } from "@/lib/enums";
import { credentialSchema } from "@/lib/validation";

export type CredentialState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

async function requireProfile(actorId: string) {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actorId }, select: { id: true } });
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

async function deleteDocumentById(documentId: string | null) {
  if (!documentId) return;
  const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { storageKey: true } });
  if (!doc) return;
  await prisma.document.delete({ where: { id: documentId } });
  await getStorage().delete(doc.storageKey).catch(() => {});
}

export async function saveCredential(_prev: CredentialState, formData: FormData): Promise<CredentialState> {
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
            data: { ...fields, documentId: doc.id, ...(resubmit ? { status: "SUBMITTED", rejectionReason: null } : {}) },
          });
          if (resubmit) await tx.verificationRequest.create({ data: { credentialId } });
        });
        await deleteDocumentById(previousDocumentId);
      } else {
        await prisma.credential.update({ where: { id: credentialId }, data: fields });
      }
      await audit({ actorId: actor.id, action: "CREDENTIAL_UPDATED", entityType: "Credential", entityId: credentialId });
    } else {
      if (!hasFile) return { fieldErrors: { document: "Een bewijsstuk is verplicht." } };
      const docData = await putBlob(actor.id, data.type, file);
      // Document + credential atomair: nested create voorkomt een verweesd Document-record.
      const created = await prisma.credential.create({
        data: { ...fields, status: "DRAFT", freelancerProfile: { connect: { id: profile.id } }, document: { create: docData } },
      });
      await audit({ actorId: actor.id, action: "CREDENTIAL_CREATED", entityType: "Credential", entityId: created.id });
    }
  } catch (e) {
    if (e instanceof UploadValidationError) return { fieldErrors: { document: e.message } };
    if (e instanceof TransitionError) return { error: e.message };
    throw e;
  }

  revalidatePath("/certificaten");
  redirect("/certificaten");
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
    prisma.credential.update({ where: { id: credentialId }, data: { status: "SUBMITTED", rejectionReason: null } }),
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

  const next: Visibility = (credential.visibility as Visibility) === "PUBLIC" ? "PRIVATE" : "PUBLIC";
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

export async function deleteCredential(credentialId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const credential = await loadOwnedCredential(profile.id, credentialId);

  await prisma.credential.delete({ where: { id: credentialId } });
  await deleteDocumentById(credential.documentId);
  await audit({ actorId: actor.id, action: "CREDENTIAL_DELETED", entityType: "Credential", entityId: credentialId });
  revalidatePath("/certificaten");
}
