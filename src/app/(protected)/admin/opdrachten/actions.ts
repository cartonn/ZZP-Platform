"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertJobTransition, JobTransitionError } from "@/lib/jobs";
import { type JobStatus } from "@/lib/enums";

/** Moderatie: een beheerder sluit een opdracht (bv. ongepast). Via de job-transitiemap. */
export async function adminCloseJob(jobId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } });
  if (!job) throw new Error("Opdracht niet gevonden.");

  const from = job.status as JobStatus;
  try {
    assertJobTransition(from, "CLOSED");
  } catch (e) {
    if (e instanceof JobTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from`: twee gelijktijdige admin-klikken passeren beide de vóór-lees.
    // updateMany met de statusguard laat alleen de eerste committen; de tweede matcht niet meer
    // (count 0) → geen dubbele JOB_CLOSED_BY_ADMIN-auditregel (spiegelt admin/no-shows/actions.ts).
    const res = await tx.job.updateMany({
      where: { id: jobId, status: from },
      // `moderationClosedAt` markeert dit als een MODERATIE-sluiting: de eigenaar kan de opdracht
      // hierna niet zelf heropenen (changeJobStatus) of bewerken (saveJob) — alleen een beheerder.
      // Zonder deze markering kon de opdrachtgever een wegens ongepaste inhoud gesloten opdracht
      // simpelweg CLOSED→PUBLISHED terugzetten en zo de moderatie ongedaan maken (OWASP A01).
      data: { status: "CLOSED", moderationClosedAt: new Date() },
    });
    if (res.count === 0) return;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "JOB_CLOSED_BY_ADMIN",
        entityType: "Job",
        entityId: jobId,
        metadata: { from },
      }),
    });
  });
  revalidatePath("/admin/opdrachten");
  revalidatePath(`/opdrachten/${jobId}`);
}
