// Veilige opbouw van een e-mail-ontvangerheader ("Naam <email>"). De weergavenaam komt uit
// gebruiker-gecontroleerde profieldata (`User.name`, `Company.name`) die alleen door `trimmed(max)`
// heen is — dat knipt rand-witruimte, maar laat ingebedde stuurtekens (CR/LF, tab, andere C0) staan.
// Zonder sanering belanden die stuurtekens rechtstreeks in de `to`-string die naar de mail-driver
// (nodemailer/SES/Resend/Postmark) gaat; een CR/LF in de weergavenaam is de klassieke
// header-/CRLF-injectie (CWE-93): `"Jan\r\nBcc: aanvaller@evil.com"` kan een extra header of ontvanger
// smokkelen. Dit is dezelfde sink-laag-verdediging als `escapeCsvField` (CSV-formule), `escapeIcsText`
// (RFC 5545) en `sanitizeAttachmentFilename` (Content-Disposition) elders in de codebase.

// Stuurtekens: de C0-reeks (0x00-0x1F, incl. CR/LF/tab) plus DEL (0x7F).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

/**
 * Verwijdert alle stuurtekens (C0-reeks inclusief CR/LF/tab, plus DEL) én de adresscheidingstekens
 * `<`, `>` en `"` uit een weergavenaam, zodat de naam nooit uit het display-name-deel van een
 * `Naam <email>`-header kan breken of een extra header/ontvanger kan injecteren. Overtollige witruimte
 * die door het strippen ontstaat wordt samengevouwen en getrimd.
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .replace(CONTROL_CHARS, " ") // stuurtekens -> spatie: geen header-injectie
    .replace(/[<>"]/g, "") // adres-/quote-delimiters weg: geen display-name-breakout
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bouwt een veilige `to`-header. Geeft `"<gesaneerde naam> <email>"` als er na sanering een niet-lege
 * naam overblijft die verschilt van het adres, anders alleen het adres. Het adres zelf wordt óók van
 * stuurtekens/witruimte ontdaan (defense-in-depth; het is doorgaans al door `z.string().email()`
 * gevalideerd en kan dan geen CR/LF bevatten, maar we vertrouwen daar bij deze sink niet blind op).
 */
export function formatEmailRecipient(name: string, email: string): string {
  const safeEmail = email.replace(CONTROL_CHARS, "").replace(/\s+/g, "");
  const safeName = sanitizeDisplayName(name);
  return safeName && safeName !== safeEmail ? `${safeName} <${safeEmail}>` : safeEmail;
}
