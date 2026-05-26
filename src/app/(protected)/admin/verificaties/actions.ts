"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { expiryTransition, statusForDecision, TransitionError } from "@/lib/credentials";
import { type CredentialStatus } from "@/lib/enums";

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

  await prisma.$transaction([
    prisma.credential.update({
      where: { id: credentialId },
      data: { status: next, verifiedAt: new Date(), rejectionReason: null },
    }),
    prisma.credentialVerification.create({
      data: { credentialId, verifierId: actor.id, decision: "VERIFIED" },
    }),
    prisma.verificationRequest.updateMany({
      where: { credentialId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: credential.freelancerProfile.userId,
        type: "CREDENTIAL_VERIFIED",
        title: "Certificaat goedgekeurd",
        body: `Je certificaat "${credential.title}" is geverifieerd.`,
        link: "/certificaten",
      },
    }),
    prisma.auditLog.create({
      data: auditData({ actorId: actor.id, action: "CREDENTIAL_VERIFIED", entityType: "Credential", entityId: credentialId, metadata: { from, to: next } }),
    }),
  ]);

  revalidatePath("/admin/verificaties");
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

  await prisma.$transaction([
    prisma.credential.update({
      where: { id: credentialId },
      data: { status: next, rejectionReason: reason, verifiedAt: null },
    }),
    prisma.credentialVerification.create({
      data: { credentialId, verifierId: actor.id, decision: "REJECTED", reason },
    }),
    prisma.verificationRequest.updateMany({
      where: { credentialId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: credential.freelancerProfile.userId,
        type: "CREDENTIAL_REJECTED",
        title: "Certificaat afgewezen",
        body: `Je certificaat "${credential.title}" is afgewezen: ${reason}`,
        link: "/certificaten",
      },
    }),
    prisma.auditLog.create({
      data: auditData({ actorId: actor.id, action: "CREDENTIAL_REJECTED", entityType: "Credential", entityId: credentialId, metadata: { from, to: next, reason } }),
    }),
  ]);

  revalidatePath("/admin/verificaties");
}

export type ExpiryState = { ran?: true; expired?: number } | undefined;

/** Idempotent: zet verlopen VERIFIED-credentials op EXPIRED (verificatieflow stap 5). */
export async function runExpiryCheck(_prev: ExpiryState, _formData: FormData): Promise<ExpiryState> {
  const actor = await requireRole("ADMIN");
  const now = new Date();

  const candidates = await prisma.credential.findMany({
    where: { status: "VERIFIED", expiresAt: { not: null, lte: now } },
    include: { freelancerProfile: { select: { userId: true } } },
  });
  // Dubbele zekerheid: alleen via expiryTransition (alleen VERIFIED kan verlopen).
  const toExpire = candidates.filter((c) => expiryTransition({ status: "VERIFIED", expiresAt: c.expiresAt }, now) === "EXPIRED");

  if (toExpire.length > 0) {
    await prisma.$transaction([
      prisma.credential.updateMany({ where: { id: { in: toExpire.map((c) => c.id) } }, data: { status: "EXPIRED" } }),
      ...toExpire.map((c) =>
        prisma.notification.create({
          data: {
            userId: c.freelancerProfile.userId,
            type: "CREDENTIAL_EXPIRED",
            title: "Certificaat verlopen",
            body: `Je certificaat "${c.title}" is verlopen. Vernieuw het en vraag opnieuw verificatie aan.`,
            link: "/certificaten",
          },
        }),
      ),
      prisma.auditLog.create({
        data: auditData({ actorId: actor.id, action: "CREDENTIALS_EXPIRED", entityType: "Credential", entityId: "batch", metadata: { count: toExpire.length, ids: toExpire.map((c) => c.id) } }),
      }),
    ]);
    revalidatePath("/admin/verificaties");
  }

  return { ran: true, expired: toExpire.length };
}
