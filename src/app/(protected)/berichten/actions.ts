"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { hasTenant, visibleFreelancersWhere } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { isParticipant, messageNotificationBody } from "@/lib/messaging";
import { messageRateLimiter } from "@/lib/rate-limit";
import { invalidateSignals } from "@/lib/signals/invalidate";
import { messageSchema } from "@/lib/validation";

export type MessageState = { ok?: true; error?: string } | undefined;

async function loadParticipants(conversationId: string) {
  // unbounded-allow: eigenaar-scoped gesprekken
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
  if (!(await messageRateLimiter.check(`msg:${actor.id}`)).allowed) {
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
          body: messageNotificationBody(parsed.data.body),
          link: `/berichten/${conversationId}`,
        },
      }),
    ),
  ]);

  // De ontvangers hebben nu een ongelezen gesprek én een ongelezen melding: hun signaal-snapshot
  // moet vervallen, anders toont de zijbalk de /berichten-badge en de bel pas na de TTL. De afzender
  // hoeft niet: voor hem verandert er niets aan de tellingen.
  await invalidateSignals(otherIds);

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
  // Gelezen = twee tellingen omlaag (ongelezen gesprekken + de bel); direct laten vervallen zodat de
  // badge verdwijnt op het moment dat de gebruiker het gesprek opent.
  await invalidateSignals([actor.id]);
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

/**
 * FRANCHISER start (of heropent) een gesprek met iemand binnen de eigen bemiddeling: een ZZP'er
 * uit het eigen roster of een opdrachtgever-contact. Gesloten per tenant — de ontvanger moet in de
 * eigen tenant vallen, anders 403. Dit gesprek hangt niet aan een opdracht (jobId blijft leeg).
 * Idempotent: een bestaand tweegesprek (zonder job) wordt heropend i.p.v. gedupliceerd.
 */
export async function startFranchiseConversation(recipientUserId: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  if (!hasTenant(actor)) throw new AuthorizationError("Geen bemiddeling gekoppeld.", 403);
  if (recipientUserId === actor.id) throw new Error("Je kunt geen gesprek met jezelf starten.");

  // De ontvanger moet een tenant-gebonden ZZP'er of opdrachtgever van dezelfde bemiddeling zijn.
  // Server-side is de waarheid: we bevestigen de tenant-match op de user zelf (niet op wat de
  // client aanlevert) en accepteren alleen de rollen FREELANCER en CLIENT binnen de eigen tenant.
  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { id: true, role: true, tenantId: true, status: true },
  });
  if (
    !recipient ||
    recipient.tenantId !== actor.tenantId ||
    (recipient.role !== "FREELANCER" && recipient.role !== "CLIENT") ||
    recipient.status !== "ACTIVE"
  ) {
    throw new AuthorizationError("Contact niet gevonden in je bemiddeling.", 403);
  }

  // Hergebruik een bestaand opdracht-loos tweegesprek tussen deze twee (idempotent). Een gesprek
  // dat aan een opdracht hangt is een aparte context en wordt niet heropend voor het vrije gesprek.
  const existing = await prisma.conversation.findFirst({
    where: {
      jobId: null,
      AND: [
        { participants: { some: { userId: actor.id } } },
        { participants: { some: { userId: recipient.id } } },
      ],
    },
    select: { id: true },
  });

  let conversationId = existing?.id;
  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: {
        participants: { create: [{ userId: actor.id }, { userId: recipient.id }] },
      },
      select: { id: true },
    });
    conversationId = created.id;
    await audit({
      actorId: actor.id,
      action: "CONVERSATION_STARTED",
      entityType: "Conversation",
      entityId: conversationId,
      metadata: { tenantId: actor.tenantId, recipientId: recipient.id, recipientRole: recipient.role }, // prettier-ignore
    });
  }

  redirect(`/berichten/${conversationId}`);
}
