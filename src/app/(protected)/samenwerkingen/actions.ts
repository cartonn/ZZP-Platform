"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertCollaborationTransition, CollaborationTransitionError } from "@/lib/collaborations";
import { type CollaborationStatus, collaborationStatusSchema } from "@/lib/enums";
import { collaborationProposalSchema } from "@/lib/validation";

export type ProposalState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/** CLIENT stelt een samenwerking voor op basis van een geaccepteerde reactie. */
export async function proposeCollaboration(
  applicationId: string,
  _prev: ProposalState,
  formData: FormData,
): Promise<ProposalState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, companyId: true, company: { select: { userId: true } } } },
      freelancer: { select: { id: true, userId: true } },
    },
  });
  if (!application || application.job.company.userId !== actor.id)
    return { error: "Reactie niet gevonden." };
  if (application.status !== "ACCEPTED") return { error: "Accepteer de reactie eerst." };

  const existing = await prisma.collaboration.findUnique({
    where: { applicationId },
    select: { id: true },
  });
  if (existing) return { error: "Er bestaat al een samenwerking voor deze reactie." };

  const parsed = collaborationProposalSchema.safeParse({
    rate: formData.get("rate") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  let collaboration;
  try {
    collaboration = await prisma.collaboration.create({
      data: {
        jobId: application.job.id,
        applicationId,
        freelancerId: application.freelancer.id,
        companyId: application.job.companyId,
        status: "PROPOSED",
        rate: data.rate ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    });
  } catch (e) {
    // Gelijktijdig voorstel op dezelfde reactie → applicationId @unique. Nette melding i.p.v. 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "Er bestaat al een samenwerking voor deze reactie." };
    throw e;
  }

  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: application.freelancer.userId,
        type: "COLLABORATION_PROPOSED",
        title: "Samenwerking voorgesteld",
        body: "Een opdrachtgever heeft je een samenwerking voorgesteld.",
        link: "/samenwerkingen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "COLLABORATION_PROPOSED",
        entityType: "Collaboration",
        entityId: collaboration.id,
      }),
    }),
  ]);

  revalidatePath("/samenwerkingen");
  revalidatePath("/kandidaten");
  return undefined;
}

export async function changeCollaborationStatus(
  collaborationId: string,
  target: string,
): Promise<void> {
  const actor = await requireActor();
  const targetStatus = collaborationStatusSchema.parse(target);

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { company: { select: { userId: true } }, freelancer: { select: { userId: true } } },
  });
  if (!collaboration) throw new Error("Samenwerking niet gevonden.");

  const partyUserIds = [collaboration.company.userId, collaboration.freelancer.userId];
  if (!partyUserIds.includes(actor.id)) throw new Error("Geen toegang tot deze samenwerking.");

  const from = collaboration.status as CollaborationStatus;
  try {
    assertCollaborationTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof CollaborationTransitionError) throw new Error(e.message);
    throw e;
  }

  const otherUserId = partyUserIds.find((id) => id !== actor.id)!;
  await prisma.$transaction([
    prisma.collaboration.update({ where: { id: collaborationId }, data: { status: targetStatus } }),
    prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "COLLABORATION_STATUS",
        title: "Samenwerking bijgewerkt",
        body: `Status: ${targetStatus}.`,
        link: "/samenwerkingen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "COLLABORATION_STATUS_CHANGED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: { from, to: targetStatus },
      }),
    }),
  ]);

  revalidatePath("/samenwerkingen");
}
