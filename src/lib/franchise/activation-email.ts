// Pure e-mailtemplates voor de activatiebeslissing op een bureau-aanmelding. Verzenden doet de
// server action via getMailSender() (best-effort, buiten de transactie). Zelfde patroon als
// src/lib/services/reset-email.ts.

import { type MailMessage } from "@/lib/services/mail-sender";
import { formatEmailRecipient } from "@/lib/services/email-address";

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ActivationMailInput {
  contactName: string | null;
  contactEmail: string;
  tenantName: string;
  loginUrl: string;
}

/** Aanmelding goedgekeurd: het bureau kan direct aan de slag. */
export function buildActivationEmail(input: ActivationMailInput): MailMessage {
  const hello = input.contactName ? `Hallo ${input.contactName},` : "Hallo,";
  const text = [
    hello,
    "",
    `Goed nieuws: de aanmelding van ${input.tenantName} is goedgekeurd. Je werkplek staat klaar.`,
    "",
    input.loginUrl,
    "",
    "Handslag",
  ].join("\n");
  const html = `<p>${htmlEscape(hello)}</p>
<p>Goed nieuws: de aanmelding van ${htmlEscape(input.tenantName)} is goedgekeurd. Je werkplek staat klaar.</p>
<p><a href="${htmlEscape(input.loginUrl)}" style="display:inline-block;padding:10px 20px;background:#171717;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">Naar je werkplek</a></p>
<p style="color:#6b7280;font-size:13px;">Handslag</p>`;
  return {
    to: formatEmailRecipient(input.contactName ?? "", input.contactEmail),
    subject: "Je bureau is geactiveerd · Handslag",
    text,
    html,
  };
}

/** Aanmelding afgewezen: reden verplicht (server-side afgedwongen vóór verzenden). */
export function buildRejectionEmail(input: ActivationMailInput & { reason: string }): MailMessage {
  const hello = input.contactName ? `Hallo ${input.contactName},` : "Hallo,";
  const text = [
    hello,
    "",
    `We hebben de aanmelding van ${input.tenantName} beoordeeld en kunnen deze niet goedkeuren.`,
    "",
    `Reden: ${input.reason}`,
    "",
    "Denk je dat dit onterecht is? Reageer dan op dit bericht.",
    "",
    "Handslag",
  ].join("\n");
  const html = `<p>${htmlEscape(hello)}</p>
<p>We hebben de aanmelding van ${htmlEscape(input.tenantName)} beoordeeld en kunnen deze niet goedkeuren.</p>
<p><strong>Reden:</strong> ${htmlEscape(input.reason)}</p>
<p style="color:#6b7280;font-size:13px;">Denk je dat dit onterecht is? Reageer dan op dit bericht.</p>
<p style="color:#6b7280;font-size:13px;">Handslag</p>`;
  return {
    to: formatEmailRecipient(input.contactName ?? "", input.contactEmail),
    subject: "Over je aanmelding · Handslag",
    text,
    html,
  };
}
