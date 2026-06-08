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

  // Claim het token ATOMAIR vóór we het wachtwoord zetten: de conditionele update (op usedAt: null)
  // is de eenmalig-gebruik-gate. Verliest deze request de race (token net door een ander gebruikt),
  // dan zetten we geen wachtwoord. Fail-closed.
  const claimed = await consumeResetToken(record.tokenId);
  if (!claimed) {
    return {
      error:
        "Deze herstelkoppeling is ongeldig of verlopen. Vraag een nieuwe aan via 'Wachtwoord vergeten'.",
    };
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash, mustChangePassword: false },
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
