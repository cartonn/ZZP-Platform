"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { visibleFreelancersWhere } from "@/lib/tenancy";
import { isParticipant } from "@/lib/messaging";
import { messageRateLimiter } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validation";

export type MessageState = { ok?: true; error?: string } | undefined;

async function loadParticipants(conversationId: string) {
  return prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
}

export async function sendMessage(
  conversationId: string,
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  // Spam-rem: begrens het verzendtempo per gebruiker vóór de duurdere queries.
  if (!messageRateLimiter.check(`msg:${actor.id}`).allowed) {
    return { error: "Te veel berichten kort achter elkaar. Wacht even en probeer het opnieuw." };
  }

  const participants = await loadParticipants(conversationId);
  if (
    !isParticipant(
      participants.map((p) => p.userId),
      actor.id,
    )
  ) {
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
  const now = new Date();
  // Markeer het gesprek gelezen én ruim de bijbehorende bericht-notificaties op, zodat de
  // notificatielijst en de bel-teller niet stale blijven na het lezen van het gesprek.
  await prisma.$transaction([
    prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: actor.id },
      data: { lastReadAt: now },
    }),
    prisma.notification.updateMany({
      where: {
        userId: actor.id,
        type: "MESSAGE",
        link: `/berichten/${conversationId}`,
        readAt: null,
      },
      data: { readAt: now },
    }),
  ]);
  revalidatePath("/berichten");
  revalidatePath("/notificaties");
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
export async function startConversationWithFreelancer(
  jobId: string,
  freelancerId: string,
): Promise<void> {
  const actor = await requireRole("CLIENT");

  const [job, freelancer] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, company: { select: { userId: true } } },
    }),
    prisma.freelancerProfile.findUnique({
      where: { id: freelancerId },
      select: {
        userId: true,
        visibility: true,
        tenantId: true,
        user: { select: { status: true } },
      },
    }),
  ]);
  if (!job || job.company.userId !== actor.id) throw new Error("Opdracht niet gevonden.");
  if (job.status !== "PUBLISHED")
    throw new Error("Je kunt alleen bij een gepubliceerde opdracht iemand benaderen.");
  // Geschorst account (bv. uitgeschreven na no-shows) of geanonimiseerd → niet benaderbaar.
  // Spiegelt discoverableFreelancerWhere op /freelancers + de opdracht-suggesties.
  if (!freelancer || freelancer.visibility !== "PUBLIC" || freelancer.user.status !== "ACTIVE")
    throw new Error("ZZP'er niet gevonden.");
  // Gesloten per tenant: een opdrachtgever mag alleen ZZP'ers binnen zijn eigen scope benaderen —
  // dezelfde grens als visibleFreelancersWhere op /freelancers (tenant-opdrachtgever → eigen roster,
  // directe opdrachtgever → niet-tenant ZZP'ers). Voorkomt cross-tenant contactopname via overflow.
  const scope = visibleFreelancersWhere(actor);
  if (scope.tenantId !== undefined && scope.tenantId !== freelancer.tenantId) {
    throw new Error("ZZP'er niet gevonden.");
  }

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
