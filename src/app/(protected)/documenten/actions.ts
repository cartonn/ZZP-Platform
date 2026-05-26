"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  generateStorageKey,
  getStorage,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";
import { documentSchema } from "@/lib/validation";

export type DocumentState = { ok?: true; error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function uploadDocument(_prev: DocumentState, formData: FormData): Promise<DocumentState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = documentSchema.safeParse({ kind: formData.get("kind") });
  if (!parsed.success) return { fieldErrors: { kind: "Kies een geldig type." } };

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { document: "Kies een bestand." } };
  }

  try {
    validateUpload({ filename: file.name, mimeType: file.type, size: file.size });
  } catch (e) {
    if (e instanceof UploadValidationError) return { fieldErrors: { document: e.message } };
    throw e;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey(file.name);
  await getStorage().put(key, buffer, file.type);
  const doc = await prisma.document.create({
    data: { ownerId: actor.id, kind: parsed.data.kind, filename: file.name, mimeType: file.type, size: file.size, storageKey: key },
  });
  await audit({ actorId: actor.id, action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: doc.id, metadata: { kind: parsed.data.kind } });

  revalidatePath("/documenten");
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true, storageKey: true, _count: { select: { credentials: true } } },
  });
  if (!doc || doc.ownerId !== actor.id) throw new Error("Document niet gevonden.");
  if (doc._count.credentials > 0) {
    throw new Error("Dit document hoort bij een credential; beheer het via Certificaten.");
  }

  await prisma.document.delete({ where: { id: documentId } });
  await getStorage().delete(doc.storageKey).catch(() => {});
  await audit({ actorId: actor.id, action: "DOCUMENT_DELETED", entityType: "Document", entityId: documentId });
  revalidatePath("/documenten");
}
