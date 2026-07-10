"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { publicOrigin } from "@/lib/public-url";
import { createResetToken } from "@/lib/password-reset";
import { buildResetEmail } from "@/lib/services/reset-email";
import { getMailSender } from "@/lib/services/mail-sender";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { resetRateLimiter } from "@/lib/rate-limit";
import { logMailFailure } from "@/lib/observability/mail-failure";
import { logger } from "@/lib/observability/logger";
import { describeError } from "@/lib/observability/report";

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

      // Bouw de reset-URL vanuit de VERTROUWDE publieke origin (AUTH_URL), nooit uit de
      // spoofbare Host/X-Forwarded-Host-header — anders kan een aanvaller met een vervalste host
      // een reset aanvragen en het geldige token naar zijn eigen domein laten wijzen (reset-
      // poisoning, CWE-640 / OWASP A01/A07). Zie src/lib/public-url.ts.
      const resetUrl = `${await publicOrigin()}/wachtwoord-herstellen/${raw}`;

      const msg = buildResetEmail({ name: user.name, email: user.email, resetUrl });
      const mailer = getMailSender();

      // Fire-and-forget: e-mailfout blokkeert de flow niet, maar logt wel.
      mailer.send(msg).catch((err: unknown) => {
        logMailFailure("[password-reset]", err);
      });

      await audit({
        actorId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        ...meta,
      });
    } catch (err) {
      logger.error("[password-reset] aanmaken reset-token mislukt", { error: describeError(err) });
      // Geen fout aan de gebruiker tonen (enumeratiebescherming).
    }
  }

  // Altijd dezelfde respons, of het nu gelukt is of niet.
  return { submitted: true };
}
