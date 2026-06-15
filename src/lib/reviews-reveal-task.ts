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
    select: { id: true, subjectId: true, rating: true, collaborationId: true },
  });

  let revealed = 0;
  for (const rev of due) {
    try {
      // Voorwaardelijke publicatie: gemist door een parallelle run? Dan count 0 → geen notificatie.
      const { count } = await prisma.review.updateMany({
        where: { id: rev.id, status: "PENDING_REVEAL" },
        data: { status: "PUBLISHED", publishedAt: now },
      });
      if (count !== 1) continue;

      await prisma.$transaction([
        prisma.notification.create({
          data: {
            userId: rev.subjectId,
            type: "REVIEW_PUBLISHED",
            title: "Je hebt een beoordeling ontvangen",
            body: `Je ontving ${rev.rating} van 5 sterren voor een afgeronde samenwerking.`,
            link: `/samenwerkingen/${rev.collaborationId}`,
          },
        }),
        prisma.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "REVIEW_REVEALED",
            entityType: "Review",
            entityId: rev.id,
            metadata: { trigger: "window", rating: rev.rating },
          }),
        }),
      ]);
      revealed += 1;
    } catch {
      // Eén falende beoordeling mag de rest niet blokkeren; de volgende run pakt 'm opnieuw op
      // (de status-guard blijft idempotent).
    }
  }

  return { considered: due.length, revealed };
}
