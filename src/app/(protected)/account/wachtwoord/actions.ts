"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireActor } from "@/lib/authz";
import { signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import {
  getPasswordBreachChecker,
  BREACHED_PASSWORD_MESSAGE,
} from "@/lib/services/password-breach";

export interface ChangePasswordState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const schema = z
  .object({
    currentPassword: z.string().min(1, "Vul je huidige wachtwoord in."),
    newPassword: z.string().min(8, "Nieuw wachtwoord moet minstens 8 tekens zijn.").max(200),
    confirmPassword: z.string().min(1, "Bevestig je nieuwe wachtwoord."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "De wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Kies een nieuw wachtwoord dat afwijkt van het huidige.",
    path: ["newPassword"],
  });

/**
 * Wijzigt het eigen wachtwoord. Verifieert eerst het huidige wachtwoord (server-side waarheid),
 * zet de geforceerde-wijziging-vlag uit en logt de gebruiker daarna uit zodat het verse wachtwoord
 * en de bijgewerkte sessie gelden. Geen e-mail/reset-token nodig.
 */
export async function changePassword(
  _prev: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState> {
  const actor = await requireActor();
  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account niet gevonden." };
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { fieldErrors: { currentPassword: "Huidig wachtwoord klopt niet." } };
  }

  // Gelekt-wachtwoord-controle (NIST 800-63B); inert tenzij PASSWORD_BREACH_CHECK=hibp, fail-open.
  if ((await getPasswordBreachChecker().check(parsed.data.newPassword)).breached) {
    return { fieldErrors: { newPassword: BREACHED_PASSWORD_MESSAGE } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: actor.id },
    // Naast de signOut hieronder (die alléén dit apparaat uitlogt): zet passwordChangedAt vooruit zodat
    // óók sessies op andere apparaten live vervallen in currentActor(). OWASP A07.
    data: { passwordHash, mustChangePassword: false, passwordChangedAt: new Date() },
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: actor.id,
    ...meta,
  });

  // Uitloggen → de gebruiker logt opnieuw in met het nieuwe wachtwoord en krijgt een verse sessie
  // (zonder de geforceerde-wijziging-vlag). signOut gooit een redirect; dit returnt dus niet.
  await signOut({ redirectTo: "/login?changed=1" });
  return {};
}
