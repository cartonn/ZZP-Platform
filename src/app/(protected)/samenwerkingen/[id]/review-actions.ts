"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { reviewInputSchema, reviewDirection, type ReviewDirection } from "@/lib/reviews";
import { type ResolveState } from "@/lib/actions/resolve-state";

/**
 * Tweezijdige beoordeling van een afgeronde samenwerking. Mutatieketen (CLAUDE.md regel 2):
 * auth → deelnemerschap (ownership) → samenwerking COMPLETED → Zod → max-één → actie + audit.
 * Server-side waarheid: de richting en de beoordeelde tegenpartij worden uit de samenwerking
 * afgeleid, nooit uit clientinvoer. useActionState-vriendelijk: fouten inline, geen error-boundary.
 */
export async function createReviewAction(
  collaborationId: string,
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      status: true,
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
    },
  });
  if (!col) return { error: "Samenwerking niet gevonden." };

  const isClient = actor.id === col.company.userId;
  const isFreelancer = actor.id === col.freelancer.userId;
  if (!isClient && !isFreelancer) {
    return { error: "Alleen de betrokken partijen kunnen een beoordeling geven." };
  }
  if (col.status !== "COMPLETED") {
    return { error: "Je kunt pas beoordelen nadat de samenwerking is afgerond." };
  }

  const parsed = reviewInputSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: "Kies een score van 1 tot 5 sterren." };
  }

  const direction: ReviewDirection = reviewDirection(isClient ? "CLIENT" : "FREELANCER");
  const subjectId = isClient ? col.freelancer.userId : col.company.userId;

  // Max. één beoordeling per partij per samenwerking (ook hard afgedwongen door @@unique).
  const existing = await prisma.review.findUnique({
    where: { collaborationId_authorId: { collaborationId, authorId: actor.id } },
    select: { id: true },
  });
  if (existing) return { error: "Je hebt deze samenwerking al beoordeeld." };

  try {
    await prisma.$transaction([
      prisma.review.create({
        data: {
          collaborationId,
          authorId: actor.id,
          subjectId,
          direction,
          rating: parsed.data.rating,
          comment: parsed.data.comment ?? null,
        },
      }),
      prisma.notification.create({
        data: {
          userId: subjectId,
          type: "REVIEW_RECEIVED",
          title: "Je hebt een beoordeling ontvangen",
          body: `${parsed.data.rating} van 5 sterren voor een afgeronde samenwerking.`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "REVIEW_CREATED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { rating: parsed.data.rating, direction, subjectId },
        }),
      }),
    ]);
  } catch (e) {
    // Alleen de unieke-constraint race (dubbele submit, P2002) geeft de idempotente, vriendelijke
    // melding; échte infra-/DB-fouten moeten doorgegooid worden i.p.v. als "al beoordeeld" maskeren.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Je hebt deze samenwerking al beoordeeld." };
    }
    throw e;
  }

  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/samenwerkingen");
  revalidatePath("/notificaties");
  return { ok: true };
}
