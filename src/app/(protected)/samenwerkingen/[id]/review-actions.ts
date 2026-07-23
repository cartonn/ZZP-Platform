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
  // Anti-oracle (CWE-203): een niet-betrokken actor mag geen onderscheid kunnen maken tussen "bestaat
  // niet" en "bestaat, maar jij bent geen partij" — beide geven exact dezelfde melding als een onbekend
  // id. De beoordelingsknop wordt sowieso alleen aan een partij getoond; dit sluit de directe-aanroep-
  // aftast-poort. Consistent met shift-handoff/setDienstStatus.
  if (!isClient && !isFreelancer) {
    return { error: "Samenwerking niet gevonden." };
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
  const mutual = counterpartReview !== null; // tegenpartij al ingediend → tweede indiening, onthul beide
  const link = `/samenwerkingen/${collaborationId}`;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
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
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "REVIEW_CREATED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { rating: parsed.data.rating, direction, subjectId, mutual },
        }),
      });

      if (mutual && counterpartReview) {
        // Tweede indiening → wederzijdse onthulling. De tegenpartij ontving zojuist mijn beoordeling:
        // notificeer hem altijd (mijn beoordeling is nu PUBLISHED). Publiceer daarnaast de (nog blinde)
        // beoordeling van de tegenpartij; de status-guard maakt dit race-veilig t.o.v. de cron-sweep —
        // alleen als ík hem publiceer (count 1) notificeer ik mezelf + log ik REVIEW_REVEALED. Heeft de
        // cron hem net al onthuld (count 0), dan heeft die mij al genotificeerd → geen dubbele melding.
        await tx.notification.create({
          data: {
            userId: subjectId,
            type: "REVIEW_PUBLISHED",
            title: "Je beoordeling is binnen",
            body: `Je ontving ${parsed.data.rating} van 5 sterren. De beoordelingen zijn nu zichtbaar.`,
            link,
          },
        });
        const { count } = await tx.review.updateMany({
          where: { id: counterpartReview.id, status: "PENDING_REVEAL" },
          data: { status: "PUBLISHED", publishedAt: now },
        });
        if (count === 1) {
          await tx.notification.create({
            data: {
              userId: actor.id,
              type: "REVIEW_PUBLISHED",
              title: "Je beoordeling is binnen",
              body: `Je ontving ${counterpartReview.rating} van 5 sterren. De beoordelingen zijn nu zichtbaar.`,
              link,
            },
          });
          await tx.auditLog.create({
            data: auditData({
              actorId: actor.id,
              action: "REVIEW_REVEALED",
              entityType: "Collaboration",
              entityId: collaborationId,
              metadata: { trigger: "mutual" },
            }),
          });
        }
      } else {
        // Eerste indiening: nodig de tegenpartij uit om óók te beoordelen — ZONDER score (anders maak
        // je het blinde venster feitelijk open en herintroduceer je het vergeldingslek).
        await tx.notification.create({
          data: {
            userId: subjectId,
            type: "REVIEW_RECEIVED",
            title: "Je kunt nu beoordelen",
            body: "De andere partij heeft een beoordeling geplaatst. Plaats jouw beoordeling — bij wederzijdse beoordeling worden ze samen zichtbaar.",
            link,
          },
        });
      }
    });
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
