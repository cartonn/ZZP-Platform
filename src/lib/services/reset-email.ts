import type { MailMessage } from "@/lib/services/mail-sender";

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Pure template voor de wachtwoord-herstel-e-mail.
 * De raw resetUrl wordt nooit gelogd; de aanroeper is verantwoordelijk voor veilige doorgifte.
 */
export function buildResetEmail(opts: {
  name: string;
  email: string;
  resetUrl: string;
}): MailMessage {
  const { name, email, resetUrl } = opts;

  const text = [
    `Hallo ${name},`,
    "",
    "Je hebt een verzoek gedaan om je wachtwoord te herstellen voor ZZP Platform.",
    "",
    "Klik op de onderstaande link om een nieuw wachtwoord in te stellen.",
    "De link is 1 uur geldig en eenmalig te gebruiken.",
    "",
    resetUrl,
    "",
    "Heb jij dit niet aangevraagd? Dan kun je dit bericht negeren. Je wachtwoord blijft ongewijzigd.",
    "",
    "ZZP Platform",
  ].join("\n");

  const html = `<p>Hallo ${htmlEscape(name)},</p>
<p>Je hebt een verzoek gedaan om je wachtwoord te herstellen voor ZZP Platform.</p>
<p>
  <a href="${htmlEscape(resetUrl)}" style="display:inline-block;padding:10px 20px;background:#171717;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
    Wachtwoord herstellen
  </a>
</p>
<p style="color:#6b7280;font-size:13px;">De link is 1 uur geldig en eenmalig te gebruiken.</p>
<p style="color:#6b7280;font-size:13px;">Heb jij dit niet aangevraagd? Dan kun je dit bericht negeren. Je wachtwoord blijft ongewijzigd.</p>
<p style="color:#6b7280;font-size:13px;">ZZP Platform</p>`;

  return { to: email, subject: "Wachtwoord herstellen · ZZP Platform", text, html };
}
