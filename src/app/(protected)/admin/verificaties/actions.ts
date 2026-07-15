"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { credentialEditPath, statusForDecision, TransitionError } from "@/lib/credentials";
import { toSafeActionError } from "@/lib/safe-action-error";
import { runExpiryTask } from "@/lib/expiry-task";
import { type CredentialStatus } from "@/lib/enums";
import { type ResolveState } from "@/lib/actions/resolve-state";

async function loadCredentialForDecision(credentialId: string) {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { freelancerProfile: { select: { userId: true } } },
  });
  if (!credential) throw new Error("Credential niet gevonden.");
  return credential;
}

/** Goedkeuren: SUBMITTED -> VERIFIED. Verificatieflow stap 3 (audit + notificatie). */
export async function verifyCredential(credentialId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const credential = await loadCredentialForDecision(credentialId);
  const from = credential.status as CredentialStatus;

  let next: CredentialStatus;
  try {
    next = statusForDecision(from, "VERIFIED");
  } catch (e) {
    if (e instanceof TransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    // Status-guard binnen de transactie: alleen verwerken als de credential nog in `from` staat.
    // Een gelijktijdige tweede beslissing matcht 0 rijen en breekt af — geen dubbele audit/notificatie.
    const res = await tx.credential.updateMany({
      where: { id: credentialId, status: from },
      data: { status: next, verifiedAt: new Date(), rejectionReason: null },
    });
    if (res.count === 0) throw new Error("Deze aanvraag is al beoordeeld.");
    await tx.credentialVerification.create({
      data: { credentialId, verifierId: actor.id, decision: "VERIFIED" },
    });
    await tx.verificationRequest.updateMany({
      where: { credentialId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        userId: credential.freelancerProfile.userId,
        type: "CREDENTIAL_VERIFIED",
        title: "Certificaat goedgekeurd",
        body: `Je certificaat "${credential.title}" is geverifieerd.`,
        link: "/certificaten",
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "CREDENTIAL_VERIFIED",
        entityType: "Credential",
        entityId: credentialId,
        metadata: { from, to: next },
      }),
    });
  });

  revalidatePath("/admin/verificaties");
  revalidatePath("/acties");
  revalidatePath("/dashboard");
}

/** Afwijzen: SUBMITTED -> REJECTED. Reden verplicht (server-side, verificatieflow stap 4). */
export async function rejectCredential(credentialId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const credential = await loadCredentialForDecision(credentialId);
  const from = credential.status as CredentialStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  let next: CredentialStatus;
  try {
    next = statusForDecision(from, "REJECTED", reason); // werpt als reason leeg of overgang ongeldig
  } catch (e) {
    if (e instanceof TransitionError) throw new Error(e.message);
    throw e; // "Een afwijzing vereist een reden."
  }

  await prisma.$transaction(async (tx) => {
    const res = await tx.credential.updateMany({
      where: { id: credentialId, status: from },
      data: { status: next, rejectionReason: reason, verifiedAt: null },
    });
    if (res.count === 0) throw new Error("Deze aanvraag is al beoordeeld.");
    await tx.credentialVerification.create({
      data: { credentialId, verifierId: actor.id, decision: "REJECTED", reason },
    });
    await tx.verificationRequest.updateMany({
      where: { credentialId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        userId: credential.freelancerProfile.userId,
        type: "CREDENTIAL_REJECTED",
        title: "Certificaat afgewezen",
        body: `Je certificaat "${credential.title}" is afgewezen: ${reason}`,
        link: credentialEditPath(credentialId),
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "CREDENTIAL_REJECTED",
        entityType: "Credential",
        entityId: credentialId,
        metadata: { from, to: next, reason },
      }),
    });
  });

  revalidatePath("/admin/verificaties");
  revalidatePath("/acties");
  revalidatePath("/dashboard");
}

// useActionState-vriendelijke wrappers voor de Actiecentrum-beoordeel-drawer (hergebruiken de
// void-acties hierboven incl. requireRole/audit/revalidate); zetten de uitkomst om naar { ok }/{ error }.

export async function verifyCredentialState(
  credentialId: string,
  _prev: ResolveState,
  _formData: FormData,
): Promise<ResolveState> {
  try {
    await verifyCredential(credentialId);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
}

export async function rejectCredentialState(
  credentialId: string,
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  try {
    await rejectCredential(credentialId, formData);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
}

export type ExpiryState = { ran?: true; expired?: number; reminded?: number } | undefined;

/**
 * Idempotent: zet verlopen VERIFIED-credentials op EXPIRED en stuurt "verloopt binnenkort"-
 * herinneringen (verificatieflow stap 5). Deelt één bron van waarheid met de geplande taak:
 * de admin-knop en `POST /api/tasks/expiry` roepen beide `runExpiryTask` aan.
 */
export async function runExpiryCheck(
  _prev: ExpiryState,
  _formData: FormData,
): Promise<ExpiryState> {
  const actor = await requireRole("ADMIN");
  const { expired, reminded } = await runExpiryTask({ actorId: actor.id });

  if (expired > 0 || reminded > 0) {
    revalidatePath("/admin/verificaties");
  }

  return { ran: true, expired, reminded };
}
