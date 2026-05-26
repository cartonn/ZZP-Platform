"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";

export async function markNotificationRead(notificationId: string): Promise<void> {
  const actor = await requireActor();
  // Ownership: alleen eigen notificaties (updateMany met userId-filter is veilig).
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notificaties");
}

export async function markAllNotificationsRead(): Promise<void> {
  const actor = await requireActor();
  await prisma.notification.updateMany({
    where: { userId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notificaties");
}
