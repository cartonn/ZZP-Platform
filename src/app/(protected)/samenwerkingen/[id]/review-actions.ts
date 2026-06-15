"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  reviewInputSchema,
  reviewDirection,
  reviewWindowCloses,
  reviewWindowOpen,
  isMutualReveal,
  type ReviewDirection,
} from "@/lib/reviews";
import { reviewBlindDays } from "@/lib/config";
import { type ResolveState } from "@/lib/actions/resolve-state";

/**
 * Double-blind beoordeling van een afgeronde samenwerking (simultane onthulling — voorkomt vergelding).
 * Mutatieketen (CLAUDE.md regel 2): auth → deelnemerschap (ownership) → samenwerking COMPLETED →
 * venster open → Zod → max-één → actie + audit. Server-side waarheid: richting, beoordeelde tegenpartij
 * én venstersluiting worden uit de samenwerking afgeleid, nooit uit clientinvoer.
 *
 * Onthulling: de beoordeling is bij indiening gelockt en blijft PENDING_REVEAL (onzichtbaar voor de
 * tegenpartij) tot óf de tegenpartij óók indient (→ beide direct PUBLISHED), óf het venster sluit
 * (cron, src/lib/reviews-reveal-task.ts). De notificatie onthult de score NIET tijdens het venster.
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
      completedAt: true,
      createdAt: true,
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      reviews: { select: { id: true, authorId: true, status: true, rating: true } },
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

  // Venster: anker op het afrondingsmoment (fallback createdAt voor legacy-rijen zonder completedAt).
  // Beide partijen delen dezelfde sluiting — daarna kan niemand meer beoordelen (anti-vergelding).
  const completionAnchor = col.completedAt ?? col.createdAt;
  const windowCloses = reviewWindowCloses(completionAnchor, reviewBlindDays());
  const now = new Date();
  if (!reviewWindowOpen(windowCloses, now)) {
    return { error: "Het beoordelingsvenster is gesloten." };
  }

  const parsed = reviewInputSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: "Kies een score van 1 tot 5 sterren." };
  }

  const direction: ReviewDirection = reviewDirection(isClient ? "CLIENT" : "FREELANCER");
  const subjectId = isClient ? col.freelancer.userId : col.company.userId; // tegenpartij = beoordeelde

  // Max. één beoordeling per partij (ook hard afgedwongen door @@unique). Tegenpartij al ingediend?
  // Dan is dit de tweede indiening → wederzijdse onthulling: beide beoordelingen worden PUBLISHED.
  if (col.reviews.some((r) => r.authorId === actor.id)) {
    return { error: "Je hebt deze samenwerking al beoordeeld." };
  }
  const counterpartReview = col.reviews.find((r) => r.authorId === subjectId) ?? null;
  const mutual = isMutualReveal(counterpartReview !== null);
  const link = `/samenwerkingen/${collaborationId}`;

  try {
    const writes: Prisma.PrismaPromise<unknown>[] = [
      prisma.review.create({
        data: {
          collaborationId,
          authorId: actor.id,
          subjectId,
          direction,
          rating: parsed.data.rating,
          comment: parsed.data.comment ?? null,
          status: mutual ? "PUBLISHED" : "PENDING_REVEAL",
          publishedAt: mutual ? now : null,
          revealDeadline: windowCloses,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "REVIEW_CREATED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { rating: parsed.data.rating, direction, subjectId, mutual },
        }),
      }),
    ];

    if (mutual && counterpartReview) {
      // Onthul beide: werk de (nog PENDING_REVEAL) tegenpartij-beoordeling bij naar PUBLISHED en
      // stuur béide partijen een onthullingsnotificatie — nu mét de score over hén.
      writes.push(
        prisma.review.updateMany({
          where: { id: counterpartReview.id, status: "PENDING_REVEAL" },
          data: { status: "PUBLISHED", publishedAt: now },
        }),
        prisma.notification.create({
          data: {
            userId: subjectId, // tegenpartij ontving mijn beoordeling
            type: "REVIEW_PUBLISHED",
            title: "Je beoordeling is binnen",
            body: `Je ontving ${parsed.data.rating} van 5 sterren. De beoordelingen zijn nu zichtbaar.`,
            link,
          },
        }),
        prisma.notification.create({
          data: {
            userId: actor.id, // ik ontving de beoordeling van de tegenpartij
            type: "REVIEW_PUBLISHED",
            title: "Je beoordeling is binnen",
            body: `Je ontving ${counterpartReview.rating} van 5 sterren. De beoordelingen zijn nu zichtbaar.`,
            link,
          },
        }),
        prisma.auditLog.create({
          data: auditData({
            actorId: actor.id,
            action: "REVIEW_REVEALED",
            entityType: "Collaboration",
            entityId: collaborationId,
            metadata: { trigger: "mutual" },
          }),
        }),
      );
    } else {
      // Eerste indiening: nodig de tegenpartij uit om óók te beoordelen — ZONDER score (anders maak
      // je het blinde venster feitelijk open en herintroduceer je het vergeldingslek).
      writes.push(
        prisma.notification.create({
          data: {
            userId: subjectId,
            type: "REVIEW_RECEIVED",
            title: "Je kunt nu beoordelen",
            body: "De andere partij heeft een beoordeling geplaatst. Plaats jouw beoordeling — bij wederzijdse beoordeling worden ze samen zichtbaar.",
            link,
          },
        }),
      );
    }

    await prisma.$transaction(writes);
  } catch (e) {
    // Alleen de unieke-constraint race (dubbele submit, P2002) geeft de idempotente, vriendelijke
    // melding; échte infra-/DB-fouten moeten doorgegooid worden i.p.v. als "al beoordeeld" maskeren.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Je hebt deze samenwerking al beoordeeld." };
    }
    throw e;
  }

  revalidatePath(link);
  revalidatePath("/samenwerkingen");
  revalidatePath("/notificaties");
  return { ok: true };
}
