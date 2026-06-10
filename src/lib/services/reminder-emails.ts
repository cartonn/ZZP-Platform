// Pure e-mail templates voor cascade-herinneringen (PLATFORM_OVERHAUL.md §3 punt 5c).
// Zelfde patroon als welcome-email.ts: pure functies → MailMessage; verzenden doet de
// taakrunner via getMailSender(). Geen secrets in de tekst.

import { type MailMessage } from "@/lib/services/mail-sender";
import { plural } from "@/lib/plural";

const PLATFORM = process.env.PLATFORM_NAME ?? "ZZP Platform";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Recipient-header: "Naam <email>" of alleen "email" als naam ontbreekt. */
function recipient(name: string, email: string): string {
  return name && name !== email ? `${name} <${email}>` : email;
}

function html(content: string): string {
  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr><td style="padding:24px;">${content}</td></tr>
    </table>
  </body>
</html>`;
}

function btn(url: string, label: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${esc(label)}</a>`;
}

// ─── Certificaat verloopt binnenkort ─────────────────────────────────────────

export interface CredentialExpiryWarningInput {
  name: string;
  email: string;
  credentialTitle: string;
  daysLeft: number;
  loginUrl: string;
}

export function buildCredentialExpiryWarningEmail(
  input: CredentialExpiryWarningInput,
): MailMessage {
  const platform = PLATFORM;
  const subject = `Actie vereist: certificaat "${input.credentialTitle}" verloopt over ${plural(input.daysLeft, "dag", "dagen")}`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je certificaat "${input.credentialTitle}" verloopt over ${plural(input.daysLeft, "dag", "dagen")}.`,
    "Vernieuw het op tijd om geverifieerd te blijven.",
    "",
    `Certificaten beheren: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat verloopt binnenkort</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> verloopt over <strong>${plural(input.daysLeft, "dag", "dagen")}</strong>. Vernieuw het op tijd om geverifieerd te blijven.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaten beheren")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Certificaat verlopen ─────────────────────────────────────────────────────

export interface CredentialExpiredInput {
  name: string;
  email: string;
  credentialTitle: string;
  loginUrl: string;
}

export function buildCredentialExpiredEmail(input: CredentialExpiredInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Certificaat verlopen: "${input.credentialTitle}"`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je certificaat "${input.credentialTitle}" is verlopen.`,
    "Vernieuw het en vraag opnieuw verificatie aan om geverifieerd te blijven.",
    "",
    `Certificaten beheren: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat verlopen</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> is verlopen. Vernieuw het en vraag opnieuw verificatie aan om geverifieerd te blijven.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaten vernieuwen")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Betaaltermijn nadert ────────────────────────────────────────────────────

export interface PaymentReminderEmailInput {
  name: string;
  email: string;
  invoiceNumber: string;
  daysLeft: number;
  loginUrl: string;
}

export function buildPaymentReminderEmail(input: PaymentReminderEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Betaaltermijn: factuur ${input.invoiceNumber} vervalt over ${plural(input.daysLeft, "dag", "dagen")}`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Factuur ${input.invoiceNumber} vervalt over ${plural(input.daysLeft, "dag", "dagen")}.`,
    "Betaling verloopt rechtstreeks aan de ZZP'er.",
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Betaaltermijn nadert</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Factuur <strong>${esc(input.invoiceNumber)}</strong> vervalt over <strong>${plural(input.daysLeft, "dag", "dagen")}</strong>. Betaling verloopt rechtstreeks aan de ZZP'er.</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Betaling te laat ────────────────────────────────────────────────────────

export interface PaymentOverdueEmailInput {
  role: "freelancer" | "client";
  name: string;
  email: string;
  invoiceNumber: string;
  loginUrl: string;
}

export function buildPaymentOverdueEmail(input: PaymentOverdueEmailInput): MailMessage {
  const platform = PLATFORM;
  const isFreelancer = input.role === "freelancer";
  const body = isFreelancer
    ? `Factuur ${input.invoiceNumber} is over de vervaldag. Je kunt een betalingsherinnering of aanmaning sturen.`
    : `De betaaltermijn van factuur ${input.invoiceNumber} is verstreken. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`;
  const subject = `Betaling te laat: factuur ${input.invoiceNumber}`;
  const text = [
    `Hallo ${input.name},`,
    "",
    body,
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Betaling te laat</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">${esc(body)}</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Concept-factuur nog niet ingediend ──────────────────────────────────────

export interface ConceptInvoiceReminderEmailInput {
  name: string;
  email: string;
  invoiceNumber: string;
  daysSince: number;
  loginUrl: string;
}

export function buildConceptInvoiceReminderEmail(
  input: ConceptInvoiceReminderEmailInput,
): MailMessage {
  const platform = PLATFORM;
  const subject = `Herinnering: concept-factuur ${input.invoiceNumber} wacht op indiening`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je concept-factuur ${input.invoiceNumber} staat al ${plural(input.daysSince, "dag", "dagen")} klaar.`,
    "Controleer en dien hem in zodat de betaling kan starten.",
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Concept-factuur wacht op indiening</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je concept-factuur <strong>${esc(input.invoiceNumber)}</strong> staat al <strong>${plural(input.daysSince, "dag", "dagen")}</strong> klaar. Controleer en dien hem in zodat de betaling kan starten.</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur indienen")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Certificaat geverifieerd ─────────────────────────────────────────────────

export interface CredentialVerifiedEmailInput {
  name: string;
  email: string;
  credentialTitle: string;
  loginUrl: string;
}

export function buildCredentialVerifiedEmail(input: CredentialVerifiedEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Certificaat geverifieerd: "${input.credentialTitle}"`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Goed nieuws! Je certificaat "${input.credentialTitle}" is goedgekeurd en geverifieerd.`,
    "Je profiel is nu up-to-date en zichtbaar voor opdrachtgevers.",
    "",
    `Certificaten bekijken: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat geverifieerd</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> is goedgekeurd en geverifieerd. Je profiel is nu up-to-date en zichtbaar voor opdrachtgevers.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaten bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Certificaat afgewezen ────────────────────────────────────────────────────

export interface CredentialRejectedEmailInput {
  name: string;
  email: string;
  credentialTitle: string;
  reason: string;
  loginUrl: string;
}

export function buildCredentialRejectedEmail(input: CredentialRejectedEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Certificaat afgewezen: "${input.credentialTitle}"`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je certificaat "${input.credentialTitle}" is helaas afgewezen.`,
    `Reden: ${input.reason}`,
    "",
    "Je kunt de gegevens aanpassen en opnieuw verificatie aanvragen.",
    "",
    `Certificaten beheren: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat afgewezen</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> is helaas afgewezen.</p>
      <p style="margin:0 0 16px;font-size:14px;"><strong>Reden:</strong> ${esc(input.reason)}</p>
      <p style="margin:0 0 16px;font-size:14px;">Je kunt de gegevens aanpassen en opnieuw verificatie aanvragen.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaat aanpassen")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── DBA-signaal ─────────────────────────────────────────────────────────────

export interface DbaSignalEmailInput {
  name: string;
  email: string;
  /** "freelancer" of "client" — bepaalt de aanspreektitel. */
  role: "freelancer" | "client";
  level: string;
  /** Volledige signaaltekst inclusief disclaimer (uit dba-monitor-task). */
  message: string;
  collaborationId: string;
  loginUrl: string;
}

export function buildDbaSignalEmail(input: DbaSignalEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Aandachtspunt inzet — ${input.level}`;
  const text = [
    `Hallo ${input.name},`,
    "",
    input.message,
    "",
    `Samenwerking bekijken: ${input.loginUrl}/samenwerkingen/${input.collaborationId}`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Aandachtspunt inzet</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">${esc(input.message)}</p>
      ${btn(`${input.loginUrl}/samenwerkingen/${input.collaborationId}`, "Samenwerking bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── BTW-kwartaal herinnering ────────────────────────────────────────────────

export interface VatReminderEmailInput {
  name: string;
  email: string;
  quarter: number;
  year: number;
  loginUrl: string;
}

export function buildVatReminderEmail(input: VatReminderEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `BTW-aangifte Q${input.quarter} ${input.year}: deadline nadert`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `De deadline voor de BTW-aangifte van Q${input.quarter} ${input.year} nadert.`,
    "Controleer je administratie en dien de aangifte tijdig in bij de Belastingdienst.",
    "",
    `Administratie bekijken: ${input.loginUrl}/administratie`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">BTW-aangifte Q${input.quarter} ${input.year}</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">De deadline voor de BTW-aangifte van <strong>Q${input.quarter} ${input.year}</strong> nadert. Controleer je administratie en dien de aangifte tijdig in bij de Belastingdienst.</p>
      ${btn(`${input.loginUrl}/administratie`, "Administratie bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Notificatie-digest (e-mail-fallback voor ongelezen meldingen) ───────────

export interface NotificationDigestEmailInput {
  name: string;
  email: string;
  count: number;
  /** Groepsregels uit de planner: per categorie label, teller en voorbeeldtitels. */
  lines: Array<{ label: string; count: number; titles: string[] }>;
  loginUrl: string;
}

export function buildNotificationDigestEmail(input: NotificationDigestEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Je hebt ${plural(input.count, "ongelezen melding", "ongelezen meldingen")} op ${platform}`;
  const textLines = input.lines.flatMap((l) => [
    `${l.label} (${l.count}):`,
    ...l.titles.map((t) => `  - ${t}`),
    ...(l.count > l.titles.length ? [`  … en nog ${l.count - l.titles.length} meer`] : []),
  ]);
  const text = [
    `Hallo ${input.name},`,
    "",
    `Er ${input.count === 1 ? "wacht 1 melding" : `wachten ${input.count} meldingen`} op je in het notificatiecentrum:`,
    "",
    ...textLines,
    "",
    `Meldingen bekijken: ${input.loginUrl}/notificaties`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  const htmlLines = input.lines
    .map((l) => {
      const items = l.titles.map((t) => `<li style="margin:0 0 4px;">${esc(t)}</li>`).join("");
      const more =
        l.count > l.titles.length
          ? `<li style="margin:0 0 4px;color:#71717a;">… en nog ${l.count - l.titles.length} meer</li>`
          : "";
      return `<p style="margin:12px 0 4px;font-size:14px;"><strong>${esc(l.label)}</strong> (${l.count})</p>
      <ul style="margin:0;padding-left:18px;font-size:14px;color:#52525b;">${items}${more}</ul>`;
    })
    .join("");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">${plural(input.count, "Ongelezen melding", "Ongelezen meldingen")}</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      ${htmlLines}
      <p style="margin:16px 0 16px;font-size:14px;">Bekijk en handel ze af in het notificatiecentrum.</p>
      ${btn(`${input.loginUrl}/notificaties`, "Meldingen bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}
