"use server";

import { revalidatePath } from "next/cache";
import { assertOwnership, type Actor, requireRole } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertApplicationTransition, ApplicationTransitionError } from "@/lib/applications";
import { type ApplicationStatus, applicationStatusSchema } from "@/lib/enums";

async function loadOwnedApplication(actor: Actor, appId: string) {
  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      job: { select: { title: true, company: { select: { userId: true } } } },
      freelancer: { select: { userId: true } },
    },
  });
  if (!app) throw new Error("Reactie niet gevonden.");
  assertOwnership(actor, app.job.company.userId);
  return app;
}

export async function changeApplicationStatus(appId: string, target: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const targetStatus = applicationStatusSchema.parse(target);
  const app = await loadOwnedApplication(actor, appId);

  const from = app.status as ApplicationStatus;
  try {
    assertApplicationTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof ApplicationTransitionError) throw new Error(e.message);
    throw e;
  }

  // Notificeer de ZZP'er bij een definitieve uitkomst.
  const notify =
    targetStatus === "ACCEPTED"
      ? { title: "Je reactie is geaccepteerd", body: `Voor "${app.job.title}".` }
      : targetStatus === "REJECTED"
        ? { title: "Je reactie is afgewezen", body: `Voor "${app.job.title}".` }
        : null;

  await prisma.$transaction([
    prisma.application.update({ where: { id: appId }, data: { status: targetStatus } }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "APPLICATION_STATUS_CHANGED",
        entityType: "Application",
        entityId: appId,
        metadata: { from, to: targetStatus },
      }),
    }),
    ...(notify
      ? [
          prisma.notification.create({
            data: {
              userId: app.freelancer.userId,
              type: `APPLICATION_${targetStatus}`,
              title: notify.title,
              body: notify.body,
              link: "/reacties",
            },
          }),
        ]
      : []),
  ]);
  revalidatePath("/kandidaten");
}

export async function saveApplicationNote(appId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("CLIENT");
  await loadOwnedApplication(actor, appId);

  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 2000);
  await prisma.application.update({ where: { id: appId }, data: { note: note || null } });
  await audit({
    actorId: actor.id,
    action: "APPLICATION_NOTE_SAVED",
    entityType: "Application",
    entityId: appId,
  });
  revalidatePath("/kandidaten");
}
