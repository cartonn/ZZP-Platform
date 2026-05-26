"use server";

import { revalidatePath } from "next/cache";
import { assertOwnership, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertApplicationTransition, ApplicationTransitionError } from "@/lib/applications";
import { type ApplicationStatus, applicationStatusSchema } from "@/lib/enums";

async function loadOwnedApplication(actorId: string, appId: string) {
  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: { select: { company: { select: { userId: true } } } } },
  });
  if (!app) throw new Error("Reactie niet gevonden.");
  assertOwnership({ id: actorId, role: "CLIENT", status: "ACTIVE" }, app.job.company.userId);
  return app;
}

export async function changeApplicationStatus(appId: string, target: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const targetStatus = applicationStatusSchema.parse(target);
  const app = await loadOwnedApplication(actor.id, appId);

  const from = app.status as ApplicationStatus;
  try {
    assertApplicationTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof ApplicationTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.application.update({ where: { id: appId }, data: { status: targetStatus } });
  await audit({
    actorId: actor.id,
    action: "APPLICATION_STATUS_CHANGED",
    entityType: "Application",
    entityId: appId,
    metadata: { from, to: targetStatus },
  });
  revalidatePath("/kandidaten");
}

export async function saveApplicationNote(appId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("CLIENT");
  await loadOwnedApplication(actor.id, appId);

  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  await prisma.application.update({ where: { id: appId }, data: { note: note || null } });
  await audit({ actorId: actor.id, action: "APPLICATION_NOTE_SAVED", entityType: "Application", entityId: appId });
  revalidatePath("/kandidaten");
}
