"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { isParticipant } from "@/lib/messaging";
import { messageSchema } from "@/lib/validation";

export type MessageState = { ok?: true; error?: string } | undefined;

async function loadParticipants(conversationId: string) {
  return prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
}

export async function sendMessage(conversationId: string, _prev: MessageState, formData: FormData): Promise<MessageState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const participants = await loadParticipants(conversationId);
  if (!isParticipant(participants.map((p) => p.userId), actor.id)) {
    return { error: "Geen toegang tot dit gesprek." };
  }

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldig bericht." };

  const otherIds = participants.map((p) => p.userId).filter((id) => id !== actor.id);
  const now = new Date();

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: actor.id, body: parsed.data.body } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } }),
    // Afzender heeft z'n eigen bericht 'gelezen'.
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: actor.id } },
      data: { lastReadAt: now },
    }),
    ...otherIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: "MESSAGE",
          title: "Nieuw bericht",
          body: parsed.data.body.slice(0, 120),
          link: `/berichten/${conversationId}`,
        },
      }),
    ),
  ]);

  revalidatePath(`/berichten/${conversationId}`);
  revalidatePath("/berichten");
  return { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const actor = await requireActor();
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: actor.id },
    data: { lastReadAt: new Date() },
  });
  revalidatePath("/berichten");
}

/** CLIENT start (of heropent) een gesprek met de ZZP'er van een reactie. */
export async function startConversationForApplication(applicationId: string): Promise<void> {
  const actor = await requireRole("CLIENT");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, company: { select: { userId: true } } } },
      freelancer: { select: { userId: true } },
    },
  });
  if (!application || application.job.company.userId !== actor.id) {
    throw new Error("Reactie niet gevonden.");
  }
  const freelancerUserId = application.freelancer.userId;

  const existing = await prisma.conversation.findFirst({
    where: {
      jobId: application.job.id,
      AND: [
        { participants: { some: { userId: actor.id } } },
        { participants: { some: { userId: freelancerUserId } } },
      ],
    },
    select: { id: true },
  });

  let conversationId = existing?.id;
  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: {
        jobId: application.job.id,
        participants: { create: [{ userId: actor.id }, { userId: freelancerUserId }] },
      },
    });
    conversationId = created.id;
  }

  redirect(`/berichten/${conversationId}`);
}

/** CLIENT start (of heropent) een gesprek met een voorgestelde ZZP'er bij een opdracht. */
export async function startConversationWithFreelancer(jobId: string, freelancerId: string): Promise<void> {
  const actor = await requireRole("CLIENT");

  const [job, freelancer] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, select: { id: true, status: true, company: { select: { userId: true } } } }),
    prisma.freelancerProfile.findUnique({ where: { id: freelancerId }, select: { userId: true, visibility: true } }),
  ]);
  if (!job || job.company.userId !== actor.id) throw new Error("Opdracht niet gevonden.");
  if (job.status !== "PUBLISHED") throw new Error("Je kunt alleen bij een gepubliceerde opdracht iemand benaderen.");
  if (!freelancer || freelancer.visibility !== "PUBLIC") throw new Error("ZZP'er niet gevonden.");

  const freelancerUserId = freelancer.userId;
  const existing = await prisma.conversation.findFirst({
    where: {
      jobId: job.id,
      AND: [
        { participants: { some: { userId: actor.id } } },
        { participants: { some: { userId: freelancerUserId } } },
      ],
    },
    select: { id: true },
  });

  let conversationId = existing?.id;
  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: {
        jobId: job.id,
        participants: { create: [{ userId: actor.id }, { userId: freelancerUserId }] },
      },
    });
    conversationId = created.id;
  }

  redirect(`/berichten/${conversationId}`);
}
