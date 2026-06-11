"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";
import {
  EMAIL_PREFERENCE_CATEGORY_KEYS,
  emailPreferencesSchema,
} from "@/lib/notification-preferences";

export type PrefState = { ok?: true; error?: string } | undefined;

/** Sla de e-mailvoorkeuren van de ingelogde gebruiker op. Mutatieketen: auth → Zod → transactie → audit. */
export async function updateEmailPreferences(
  _prev: PrefState,
  formData: FormData,
): Promise<PrefState> {
  const actor = await requireActor();

  const input = Object.fromEntries(
    EMAIL_PREFERENCE_CATEGORY_KEYS.map((key) => [key, formData.get(key) != null]),
  );

  const parsed = emailPreferencesSchema.safeParse(input);
  if (!parsed.success) return { error: "Kon de voorkeuren niet opslaan." };

  const meta = await requestMeta();

  await prisma.$transaction([
    ...EMAIL_PREFERENCE_CATEGORY_KEYS.map((key) =>
      prisma.notificationPreference.upsert({
        where: { userId_category: { userId: actor.id, category: key } },
        update: { emailEnabled: parsed.data[key] },
        create: { userId: actor.id, category: key, emailEnabled: parsed.data[key] },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "NOTIFICATION_PREFERENCES_UPDATED",
        entityType: "User",
        entityId: actor.id,
        metadata: parsed.data,
        ...meta,
      }),
    }),
  ]);

  revalidatePath("/account/notificaties");
  return { ok: true };
}
