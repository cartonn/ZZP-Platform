// Welkomst-/uitnodigingsmail voor bulk-geïmporteerde accounts. Puur: bouwt onderwerp + tekst/HTML
// uit de gegevens; verzenden doet de server-laag via MailSender. Bevat het tijdelijke wachtwoord
// (eenmalig) en de instructie om dat bij de eerste login te wijzigen — sluit aan op de geforceerde
// wachtwoordwijziging (User.mustChangePassword). Geen geheimen loggen; deze tekst gaat alleen per mail.

import { type MailMessage } from "@/lib/services/mail-sender";

export interface WelcomeEmailInput {
  name: string;
  email: string;
  tempPassword: string;
  /** Inlog-URL, bv. "https://app.zzp-platform.nl/login". */
  loginUrl: string;
  /** Naam van het platform/de organisatie in de afzenderregel van de tekst. */
  platformName?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bouwt de welkomstmail (onderwerp + platte tekst + HTML) voor één geïmporteerd account. */
export function buildWelcomeEmail(input: WelcomeEmailInput): MailMessage {
  const platform = input.platformName ?? "ZZP Platform";
  const subject = `Welkom bij ${platform} — je account staat klaar`;

  const text = [
    `Hallo ${input.name},`,
    "",
    `Er is een account voor je aangemaakt op ${platform}. Je kunt direct inloggen met:`,
    "",
    `  E-mailadres:        ${input.email}`,
    `  Tijdelijk wachtwoord: ${input.tempPassword}`,
    "",
    `Inloggen: ${input.loginUrl}`,
    "",
    "Bij de eerste keer inloggen vragen we je om een eigen wachtwoord in te stellen.",
    "Deel je wachtwoord met niemand.",
    "",
    `Met vriendelijke groet,`,
    platform,
  ].join("\n");

  const html = `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr><td style="padding:24px;">
        <h1 style="margin:0 0 8px;font-size:18px;">Welkom bij ${escapeHtml(platform)}</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#52525b;">Hallo ${escapeHtml(input.name)}, er is een account voor je aangemaakt. Je kunt direct inloggen.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin:0 0 16px;">
          <tr><td style="padding:12px 16px;font-size:13px;color:#52525b;">E-mailadres</td><td style="padding:12px 16px;font-size:13px;text-align:right;font-weight:600;">${escapeHtml(input.email)}</td></tr>
          <tr><td style="padding:12px 16px;font-size:13px;color:#52525b;border-top:1px solid #e4e4e7;">Tijdelijk wachtwoord</td><td style="padding:12px 16px;font-size:13px;text-align:right;font-family:monospace;border-top:1px solid #e4e4e7;">${escapeHtml(input.tempPassword)}</td></tr>
        </table>
        <a href="${escapeHtml(input.loginUrl)}" style="display:inline-block;padding:10px 16px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Inloggen</a>
        <p style="margin:16px 0 0;font-size:12px;color:#71717a;">Bij de eerste keer inloggen vragen we je om een eigen wachtwoord in te stellen. Deel je wachtwoord met niemand.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { to: `${input.name} <${input.email}>`, subject, text, html };
}
