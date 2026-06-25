"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createResetToken } from "@/lib/password-reset";
import { buildResetEmail } from "@/lib/services/reset-email";
import { getMailSender } from "@/lib/services/mail-sender";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { resetRateLimiter } from "@/lib/rate-limit";

export interface ForgotPasswordState {
  submitted?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const schema = z.object({
  // Zelfde normalisatie als bij registratie/login: anders vindt de reset-lookup het account niet en
  // krijgt de gebruiker (door enumeratiebescherming) stil geen mail → ook geen herstelpad.
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
});

/**
 * Vraagt een wachtwoord-reset aan. Geeft altijd dezelfde succesboodschap terug,
 * ongeacht of het e-mailadres bestaat (e-mail-enumeratiebescherming).
 */
export async function requestPasswordReset(
  _prev: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v?.[0]) fieldErrors[k] = v[0];
    return { fieldErrors };
  }

  const { email } = parsed.data;
  const meta = await requestMeta();

  // Begrens reset-aanvragen per IP+e-mail (mail-bombing / CPU-amplificatie). Bij overschrijding
  // dezelfde uniforme respons teruggeven — geen enumeratie-lek, geen werk uitvoeren.
  const limitKey = `${meta.ipAddress ?? "unknown"}:${email.toLowerCase()}`;
  if (!(await resetRateLimiter.check(limitKey)).allowed) {
    return { submitted: true };
  }

  // Zoek de gebruiker — maar laat de response nooit uitlekken of het bestaat.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true },
  });

  if (user && user.status === "ACTIVE") {
    try {
      const raw = await createResetToken(user.id);

      // Bouw de reset-URL vanuit de inkomende request-headers.
      const h = await headers();
      const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
      const proto = h.get("x-forwarded-proto") ?? "http";
      const resetUrl = `${proto}://${host}/wachtwoord-herstellen/${raw}`;

      const msg = buildResetEmail({ name: user.name, email: user.email, resetUrl });
      const mailer = getMailSender();

      // Fire-and-forget: e-mailfout blokkeert de flow niet, maar logt wel.
      mailer.send(msg).catch((err: unknown) => {
        console.error("[password-reset] e-mail verzenden mislukt:", err);
      });

      await audit({
        actorId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        ...meta,
      });
    } catch (err) {
      console.error("[password-reset] aanmaken token mislukt:", err);
      // Geen fout aan de gebruiker tonen (enumeratiebescherming).
    }
  }

  // Altijd dezelfde respons, of het nu gelukt is of niet.
  return { submitted: true };
}
