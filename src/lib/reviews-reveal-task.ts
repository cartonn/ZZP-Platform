// Geplande runner voor de double-blind reveal van beoordelingen. Een beoordeling die niet via
// wederzijdse indiening al is onthuld, publiceert wanneer haar venster sluit (revealDeadline ≤ nu) —
// óók eenzijdig: die ene beoordeling wordt dan gewoon zichtbaar. Idempotent: de status-guard op de
// updateMany zorgt dat een al-onthulde beoordeling niet dubbel publiceert of dubbel notificeert.
// Draait mee in /api/tasks/run-all (de host configureert één cron). Pure beslisregel: isRevealDue.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";

export interface RevealTaskResult {
  /** Aantal PENDING_REVEAL-beoordelingen waarvan het venster verstreken was. */
  considered: number;
  /** Aantal daadwerkelijk onthuld (gepubliceerd) in deze run. */
  revealed: number;
}

export async function runReviewsRevealTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<RevealTaskResult> {
  const now = opts.now ?? new Date();

  const due = await prisma.review.findMany({
    where: { status: "PENDING_REVEAL", revealDeadline: { lte: now } },
    select: { id: true, subjectId: true, authorId: true, rating: true, collaborationId: true },
  });

  let revealed = 0;
  for (const rev of due) {
    try {
      // Publicatie + notificaties + audit atomair (CLAUDE.md regel 5). De status-guard binnen de
      // transactie maakt het idempotent: een parallelle run/mutual-reveal die al publiceerde geeft
      // count 0 → niets gebeurt (geen dubbele notificatie, geen audit zonder statuswijziging).
      const link = `/samenwerkingen/${rev.collaborationId}`;
      const didReveal = await prisma.$transaction(async (tx) => {
        const { count } = await tx.review.updateMany({
          where: { id: rev.id, status: "PENDING_REVEAL" },
          data: { status: "PUBLISHED", publishedAt: now },
        });
        if (count !== 1) return false;
        // Eenzijdige onthulling bij venstersluiting: de beoordeelde ontving een beoordeling, de auteur
        // hoort dat de zijne nu zichtbaar is (de tegenpartij heeft niet beoordeeld).
        await tx.notification.create({
          data: {
            userId: rev.subjectId,
            type: "REVIEW_PUBLISHED",
            title: "Je hebt een beoordeling ontvangen",
            body: `Je ontving ${rev.rating} van 5 sterren voor een afgeronde samenwerking.`,
            link,
          },
        });
        await tx.notification.create({
          data: {
            userId: rev.authorId,
            type: "REVIEW_PUBLISHED",
            title: "Je beoordeling is nu zichtbaar",
            body: "Het beoordelingsvenster is gesloten; jouw beoordeling is gepubliceerd.",
            link,
          },
        });
        await tx.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "REVIEW_REVEALED",
            entityType: "Review",
            entityId: rev.id,
            metadata: { trigger: "window", rating: rev.rating },
          }),
        });
        return true;
      });
      if (didReveal) revealed += 1;
    } catch (e) {
      // Eén falende beoordeling mag de rest niet blokkeren; de volgende run pakt 'm opnieuw op
      // (de status-guard blijft idempotent). Wél loggen zodat systematische fouten zichtbaar worden.
      console.error(`[reviews-reveal] onthulling van review ${rev.id} mislukt:`, e);
    }
  }

  return { considered: due.length, revealed };
}
