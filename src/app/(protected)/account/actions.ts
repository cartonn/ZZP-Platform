"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";

/** AVG: gebruiker vraagt verwijdering aan. Account blijft actief tot beheer het afhandelt
 *  (i.v.m. fiscale/contractuele bewaarplicht); aanvraag is intrekbaar. */
export async function requestAccountDeletion(): Promise<void> {
  const actor = await requireActor();
  const meta = await requestMeta();
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });

  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { deletionRequestedAt: new Date() } }),
    ...admins.map((a) =>
      prisma.notification.create({
        data: { userId: a.id, type: "ACCOUNT_DELETION_REQUESTED", title: "Verwijderverzoek", body: "Een gebruiker heeft accountverwijdering aangevraagd.", link: "/admin/gebruikers" },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({ actorId: actor.id, action: "ACCOUNT_DELETION_REQUESTED", entityType: "User", entityId: actor.id, ...meta }),
    }),
  ]);
  revalidatePath("/account");
}

export async function cancelDeletionRequest(): Promise<void> {
  const actor = await requireActor();
  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { deletionRequestedAt: null } }),
    prisma.auditLog.create({
      data: auditData({ actorId: actor.id, action: "ACCOUNT_DELETION_CANCELLED", entityType: "User", entityId: actor.id, ...meta }),
    }),
  ]);
  revalidatePath("/account");
}
