// Mail-intake-webhook: de inbound-mailprovider (bv. Postmark Inbound) POST hier de JSON van
// een binnengekomen dienstaanvraag-mail. Afzender wordt gematcht op het account-e-mailadres
// van een actieve opdrachtgever; de mail wordt deterministisch geparsed en als NEW-aanvraag
// in de reviewqueue (/opdrachten/mail-intake) gezet — publiceren blijft mensenwerk van de
// opdrachtgever via de bestaande concept-opdracht-flow. Zonder MAIL_INTAKE_WEBHOOK_SECRET is
// het endpoint uitgeschakeld (404): integraties staan default UIT/inert (CLAUDE.md regel 8).
//
// Responsbeleid (parity met de betaal-webhook): na een geslaagde auth altijd 200, óók bij
// niet-matchende afzenders, duplicaten of onparsbare payloads — een non-200 zou de provider in
// een retry-storm jagen op een ping die nooit gaat lukken. Alleen ontbrekend secret (404) en
// een mislukte autorisatie (401) wijken af, zodat een misconfiguratie zichtbaar faalt.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { clientIpFromRequest } from "@/lib/client-ip";
import { mailIntakeWebhookRateLimiter } from "@/lib/rate-limit";
import {
  isAuthorizedMailIntakeHeader,
  MAIL_INTAKE_BODY_MAX,
  MAIL_INTAKE_SUBJECT_MAX,
  mailHtmlToText,
  mailIntakeSenderEmail,
  mailIntakeWebhookSchema,
  parseMailIntake,
} from "@/lib/mail-intake";

export const dynamic = "force-dynamic";

// Een inbound-payload mét (genegeerde) base64-bijlagen kan fors zijn; ruim genoeg voor een
// normale aanvraagmail, begrensd tegen geheugen-DoS (het endpoint is wel geauthenticeerd,
// maar buffert de body vóór verwerking — CWE-400-parity met /api/billing/webhook).
const MAX_BODY_BYTES = 10 * 1024 * 1024;

const ok = () => new Response("ok", { status: 200 });

export async function POST(request: Request): Promise<Response> {
  // Feature uit zonder secret: geen oppervlak, geen halve activering.
  const secret = process.env.MAIL_INTAKE_WEBHOOK_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });

  // Rate-limit vóór auth/body-read/DB-I/O; bij overschrijding bewust 200 (geen retry-storm).
  const rl = await mailIntakeWebhookRateLimiter.check(clientIpFromRequest(request));
  if (!rl.allowed) return ok();

  // Timing-safe autorisatie: Bearer <secret> of Basic met het secret als wachtwoord (de vorm
  // die een provider-webhook-URL met basic-auth-credentials oplevert).
  if (!isAuthorizedMailIntakeHeader(request.headers.get("authorization"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Byte-grens vóór het bufferen; de na-check vangt een ontbrekende/onjuiste Content-Length.
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return ok();

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return ok(); // body onleesbaar
  }
  if (raw.length > MAX_BODY_BYTES) return ok();

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return ok(); // geen JSON — herproberen gaat dit niet oplossen
  }
  const parsedPayload = mailIntakeWebhookSchema.safeParse(json);
  if (!parsedPayload.success) return ok();
  const payload = parsedPayload.data;

  const sender = mailIntakeSenderEmail(payload);
  if (!sender) return ok();

  // Afzender → actieve opdrachtgever mét bedrijfsprofiel. Geen match → niets opslaan
  // (dataminimalisatie: mail van onbekenden bewaren we niet).
  const user = await prisma.user.findFirst({
    where: { email: sender, role: "CLIENT", status: "ACTIVE", anonymizedAt: null },
    select: { id: true, company: { select: { id: true } } },
  });
  if (!user?.company) return ok();
  const companyId = user.company.id;
  const userId = user.id;

  const subject = (payload.Subject ?? "").trim().slice(0, MAIL_INTAKE_SUBJECT_MAX);
  const textBody = (payload.TextBody?.trim() || mailHtmlToText(payload.HtmlBody ?? ""))
    .trim()
    .slice(0, MAIL_INTAKE_BODY_MAX);
  if (!subject && !textBody) return ok(); // lege mail: niets te beoordelen

  const parsed = parseMailIntake(subject, textBody);

  // Aanmaken + audit + notificatie atomair; een dubbel afgeleverde ping (zelfde MessageID)
  // botst op de unieke sleutel en is inert (idempotentie zonder aparte ledger).
  try {
    await prisma.$transaction(async (tx) => {
      const intake = await tx.mailIntake.create({
        data: {
          companyId,
          messageId: payload.MessageID,
          fromAddress: sender,
          subject,
          textBody,
          parsedTitle: parsed.title,
          parsedDescription: parsed.description,
          parsedLocation: parsed.location,
          parsedRateMin: parsed.rateMin,
          parsedRateMax: parsed.rateMax,
          parsedStartDate: parsed.startDate,
          parsedWorkMode: parsed.workMode,
        },
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: null, // systeemactie: binnengekomen via de inbound-webhook
          action: "MAIL_INTAKE_RECEIVED",
          entityType: "MailIntake",
          entityId: intake.id,
          metadata: { messageId: payload.MessageID, fromAddress: sender },
        }),
      });
      await tx.notification.create({
        data: {
          userId,
          type: "MAIL_INTAKE_RECEIVED",
          title: "Nieuwe aanvraag per e-mail",
          body: parsed.title
            ? `"${parsed.title}" staat klaar om te beoordelen in de mail-intake.`
            : "Er staat een aanvraag klaar om te beoordelen in de mail-intake.",
          link: "/opdrachten/mail-intake",
        },
      });
    });
  } catch (e) {
    // Unieke-sleutel-botsing = duplicate ping → inert. Andere (transiënte DB-)fouten propageren
    // bewust niet naar een 5xx: de transactie rolde terug en de provider biedt het event opnieuw
    // aan zolang wij geen 200 geven — dus geef bij een echte fout wél een 500 zodat dat gebeurt.
    if ((e as { code?: string })?.code === "P2002") return ok();
    throw e;
  }

  return ok();
}
