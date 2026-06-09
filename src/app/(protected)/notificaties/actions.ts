"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/**
 * Opent een notificatie: markeert 'm (eigen) als gelezen én navigeert naar de bestemming. Eén klik
 * op de rij doet dus beide — voorheen navigeerde de Link weg zónder te markeren (bel-teller bleef
 * stale) en zat de "Gelezen"-knop ongeldig genest in de Link. De redirect-bestemming komt uit het
 * eigen notificatie-record (niet uit clientinvoer), dus geen open-redirect.
 */
export async function openNotification(notificationId: string): Promise<void> {
  const actor = await requireActor();
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId: actor.id },
    select: { link: true, readAt: true },
  });
  if (n && !n.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
  revalidatePath("/notificaties");
  redirect(n?.link ?? "/notificaties");
}

export async function markAllNotificationsRead(): Promise<void> {
  const actor = await requireActor();
  await prisma.notification.updateMany({
    where: { userId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notificaties");
}
