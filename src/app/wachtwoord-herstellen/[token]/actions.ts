"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateResetToken, consumeResetToken } from "@/lib/password-reset";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";

export interface ResetPasswordState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const schema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "Wachtwoord moet minstens 8 tekens zijn.").max(200),
    confirmPassword: z.string().min(1, "Bevestig je nieuwe wachtwoord."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "De wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v?.[0]) fieldErrors[k] = v[0];
    return { fieldErrors };
  }

  const { token: raw, newPassword } = parsed.data;

  const record = await validateResetToken(raw);
  if (!record) {
    return {
      error:
        "Deze herstelkoppeling is ongeldig of verlopen. Vraag een nieuwe aan via 'Wachtwoord vergeten'.",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    await consumeResetToken(record.tokenId);
  });

  const meta = await requestMeta();
  await audit({
    actorId: record.userId,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: record.userId,
    ...meta,
  });

  return { success: true };
}
