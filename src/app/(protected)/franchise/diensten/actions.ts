"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertSameTenant } from "@/lib/tenancy";
import { assertJobTransition, JobTransitionError } from "@/lib/jobs";
import { type JobStatus, jobStatusSchema } from "@/lib/enums";

/**
 * Statusovergang van een tenant-dienst dóór de franchiser die hem uitzette. Voorheen kon alleen de
 * onboarded opdrachtgever (company-owner) of een ADMIN een dienst sluiten/heropenen — de franchiser
 * die de dienst publiceerde kon hem nergens meer terugtrekken (doodlopende live dienst). Tenant-scoped
 * (assertSameTenant), via de expliciete overgangsmap (assertJobTransition), geaudit.
 */
export async function setDienstStatus(jobId: string, target: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const targetStatus = jobStatusSchema.parse(target);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { tenantId: true, status: true, publishedAt: true },
  });
  if (!job) throw new Error("Dienst niet gevonden.");
  assertSameTenant(actor, job.tenantId);

  const from = job.status as JobStatus;
  try {
    assertJobTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof JobTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: targetStatus,
      publishedAt: targetStatus === "PUBLISHED" && !job.publishedAt ? new Date() : job.publishedAt,
    },
  });
  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DIENST_STATUS_SET",
    entityType: "Job",
    entityId: jobId,
    metadata: { from, to: targetStatus },
  });
  revalidatePath(`/franchise/diensten/${jobId}`);
  revalidatePath("/franchise/diensten");
}
